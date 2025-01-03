import {Router} from "express";
import dayjs from "dayjs";
import {ConvertTimestampToDayjs, GetTimestamp} from "@/lib/helper/common";

import {Limiter} from "../../middleware/limiter";
import ValidatorMiddleware from "../../middleware/validator";
import {ResponseSuccessBuilder} from "@/lib/helper/response";
import logger from "@/lib/helper/logger";
import {sendEmail} from "@/lib/gateway/mailer";

import {CustomHttpExceptionError} from "@/lib/helper/customError";
import {TokenJwtGenerator, TokenJwtVerification} from "@/lib/auth/token";
import {DecryptMessage, EncryptMessage} from "@/lib/auth/signature";

import {UserService} from "../users/users.service";
import {AuthService} from "./auth.service";
import {RoleService} from "@/app/module/role/role.service";

import {
    ForgotPasswordDto,
    RefreshTokenDto,
    ResendOtpDto,
    ResetPasswordDto,
    SetupPinDto,
    SignInDto,
    VerifyOtpDto
} from "./auth.dto";
import {UserDto} from "@/app/module/users/users.dto";
import {HandleOtpGeneration} from "@/lib/helper/authHandler";
import GetRegisteredField from "@/lib/helper/registerHandler";
import {generateTokenJWT} from "@/lib/helper/authHandler";
import {HashPassword, VerifyPassword} from "@/lib/helper/authHandler";


export class AuthController {
    public router: Router;
    private authService: AuthService;
    private userService: UserService;
    private roleService: RoleService;

    constructor(authService: AuthService, userService: UserService, roleService: RoleService) {
        this.router = Router();
        this.authService = authService;
        this.userService = userService;
        this.roleService = roleService;
        this.initializeRoutes();
    }

    private initializeRoutes() {
        this.router.post('/sign-in', Limiter(5 * 1000, 10), ValidatorMiddleware(SignInDto), this.signIn);
        this.router.post('/sign-up', Limiter(5 * 1000, 10), ValidatorMiddleware(SignInDto), this.signUp);
        this.router.patch('/setup-pin', Limiter(5 * 1000, 10), ValidatorMiddleware(SetupPinDto), this.setupPin);
        this.router.post('/forgot-password', Limiter(5 * 1000, 10), ValidatorMiddleware(ForgotPasswordDto), this.forgotPassword);
        this.router.post('/verify-otp', Limiter(180 * 100, 3), ValidatorMiddleware(VerifyOtpDto), this.verifyOtp);
        this.router.post('/resend-otp', Limiter(60 * 100, 1), ValidatorMiddleware(ResendOtpDto), this.resendOtp);
        this.router.post('/reset-password', Limiter(5 * 1000, 10), ValidatorMiddleware(ResetPasswordDto), this.resetPassword);
        this.router.post('/refresh-token', ValidatorMiddleware(RefreshTokenDto), this.refreshAccessToken);
        this.router.post('/logout', Limiter(5 * 1000, 10), ValidatorMiddleware(RefreshTokenDto), this.logout);
    }

    signIn = async (req, res, next) => {
        try {
            const payload: SignInDto = req.body;

            // Fetch the user by email
            const user = await this.userService.GetUserByParams({email: payload.email});
            if (!user) {
                throw new CustomHttpExceptionError('Your email is not registered', 401);
            }

            // Check if type is 0 and validate password
            if (payload.type === 0) {
                if (!payload.password) {
                    throw new CustomHttpExceptionError('Password is required for type 0 login', 400);
                }

                const isPasswordValid = await VerifyPassword(payload.password, user.password);
                if (!isPasswordValid) {
                    throw new CustomHttpExceptionError('Invalid password', 401);
                }
            }

            // Check if PIN exists
            if (!user.pin) {
                const signature = await EncryptMessage(`${user.email}`);
                return ResponseSuccessBuilder(res, 202001, "You need to setup a PIN first before use your account", {signature});
            }

            const TokenUser = await generateTokenJWT(user, this.authService);

            return ResponseSuccessBuilder(res, 200, "Success", TokenUser);
        } catch (error) {
            next(error);
        }
    };

    signUp = async (req, res, next) => {
        try {
            const payload: UserDto = req.body;

            // Validate payload for type 0
            if (payload.type === 0 && !payload.password) {
                throw new CustomHttpExceptionError('Password is required for type 0', 400);
            }

            const checkUser = await this.userService.GetUserByParams({
                email: payload.email,
                user_data: {
                    phone: payload.phone
                }
            }, "OR");

            if (checkUser) {
                const registeredField = GetRegisteredField(checkUser, payload, ['email', 'user_data.phone']);
                throw new CustomHttpExceptionError(`${registeredField} already registered`, 400);
            }

            // Get default role ID
            const role = await this.roleService.GetDefaultRole();
            if (!role) {
                throw new CustomHttpExceptionError('Default role not found', 500);
            }

            // Hash password if type is 0
            if (payload.type === 0) {
                payload.password = await HashPassword(payload.password);
            }

            const user = await this.userService.Create({
                ...payload,
                role_id: role.id
            })

            const timestamp = await GetTimestamp();
            const message = `${user.email}|${timestamp}`;

            // Encrypt the message (for signature)
            const signature = await EncryptMessage(message);

            return ResponseSuccessBuilder(res, 201, 'Success register the user', {signature});
        } catch (error) {
            console.log(error);
            next(error);
        }
    };

    // Setup pin
    setupPin = async (req, res, next) => {
        try {
            const payload: SetupPinDto = req.body;

            // verify the signature

            // Decrypt the incoming signature and extract information
            const decryptedMessage = await DecryptMessage(payload.signature);
            const email = decryptedMessage.split("|")[0];

            // Fetch the user by phone number
            const user = await this.userService.GetUserByParams({email: email});
            if (!user) {
                throw new CustomHttpExceptionError('Your email is not registered', 401);
            }

            const TokenUser = await generateTokenJWT(user, this.authService);

            //check if pin exist
            if (user.pin) {
                // Respond with success
                return ResponseSuccessBuilder(res, 200, "Your account already setup pin", TokenUser);
            }

            // Update the user's pin
            await this.userService.UpdateUserPatch(user.id, {pin: payload.pin});

            return ResponseSuccessBuilder(res, 200, "Berhasil memverifikasi kode OTP", TokenUser);
        } catch (error) {
            next(error);
        }
    }

    // forgot password
    forgotPassword = async (req, res, next) => {
        try {
            const payload: UserDto = req.body;

            // Fetch the user by phone number
            const user = await this.userService.GetUserByParams({email: payload.email});
            if (!user) {
                throw new CustomHttpExceptionError('Your email is not registered', 401);
            }

            // Generate OTP-related data
            const generated_otp = await HandleOtpGeneration(user, this.authService, "reset-password")

            // Encrypt the message (for signature)
            const signature = await EncryptMessage(generated_otp.message);

            logger.info(`[AUTH] Generated OTP: ${generated_otp.code} for user ${user.email}`);

            /**
             * SEND OTP EMAIL
             */
                // Define the email subject
            const subject = `Your OTP Code ${generated_otp.code}`;

            // Choose whether to use the HTML template or plaintext message
            const template = '/otp.html'; // Or null if you want to send plaintext
            const params = {otp: generated_otp}; // Params for the template

            // Send the OTP email
            await sendEmail(
                user.email, subject, template, params
            );

            return ResponseSuccessBuilder(res, 200, 'Berhasil mengirimkan kode OTP', {signature});
        } catch (error) {
            next(error);
        }
    }

    verifyOtp = async (req, res, next) => {
        try {
            const payload: VerifyOtpDto = req.body;
            const decryptedMessage = await DecryptMessage(payload.signature);
            const email = decryptedMessage.split("|")[0];
            const user = await this.userService.GetUserByParams({email: email});
            if (!user) {
                throw new CustomHttpExceptionError('Invalid signature', 401);
            }
            const otp = await this.authService.GetOtp(decryptedMessage, payload.code, "reset-password");
            await this.authService.VerifyOtp(otp);

            const timestamp = await GetTimestamp();
            const message = `${user.email}|${timestamp}`;

            // Encrypt the message (for signature)
            const signature = await EncryptMessage(message);

            return ResponseSuccessBuilder(res, 200, "Berhasil memverifikasi kode OTP", {signature});
        } catch (error) {
            next(error);
        }
    }

    resendOtp = async (req, res, next) => {
        try {
            const payload: ResendOtpDto = req.body;

            // Decrypt the incoming signature and extract information
            const decryptedMessage = await DecryptMessage(payload.signature);
            logger.info(`[AUTH] Resend OTP: ${decryptedMessage}`);

            // Extract timestamp from the decrypted message
            const createdOn = await ConvertTimestampToDayjs(decryptedMessage.split("|")[1]);

            // Get the current UTC time and calculate the difference in seconds
            const now = dayjs().utc();
            const diffInSeconds = now.diff(createdOn, "second");

            // Get the OTP expiration period from the environment variable
            const expiryInSeconds = parseInt(process.env.EXPIRY_OTP_IN_SECOND);

            // Check if the OTP is still within the expiration period
            if (diffInSeconds < expiryInSeconds) {
                const remainingTimeInSeconds = expiryInSeconds - diffInSeconds;

                // Calculate minutes and seconds
                const minutes = Math.floor(remainingTimeInSeconds / 60);
                const seconds = remainingTimeInSeconds % 60;

                // Format the remaining time for display
                const remainingTime = minutes > 0
                    ? `in ${minutes} minute ${seconds} second`
                    : `in ${seconds} second`;

                throw new CustomHttpExceptionError(`You can send OTP ${remainingTime}`, 400);
            }


            // Extract the phone number and validate it
            const email = decryptedMessage.split("|")[0];
            if (!email || typeof email !== "string") {
                throw new CustomHttpExceptionError("Email not valid", 400);
            }

            // Check if the user exists in the system
            const user = await this.userService.GetUserByParams({email: email});
            if (!user) {
                throw new CustomHttpExceptionError('User not found!', 400);
            }

            // Generate OTP-related data
            const generated_otp = await HandleOtpGeneration(user, this.authService, "reset-password")

            // Encrypt the message (for signature)
            const signature = await EncryptMessage(generated_otp.message);

            logger.info(`[AUTH] Generated OTP: ${generated_otp.code} for user ${user.email}`);

            /**
             * SEND OTP EMAIL
             */
                // Define the email subject
            const subject = `Your OTP Code ${generated_otp.code}`;

            // Choose whether to use the HTML template or plaintext message
            const template = '/otp.html'; // Or null if you want to send plaintext
            const params = {otp: generated_otp}; // Params for the template

            // Send the OTP email
            await sendEmail(
                user.email, subject, template, params
            );

            return ResponseSuccessBuilder(res, 200, "Success", {signature});
        } catch (error) {
            next(error);
        }
    };

    resetPassword = async (req, res, next) => {
        try {
            const payload: ResetPasswordDto = req.body;

            // Decrypt the incoming signature and extract information
            const decryptedMessage = await DecryptMessage(payload.signature);
            const email = decryptedMessage.split("|")[0];

            // Fetch the user by email
            const user = await this.userService.GetUserByParams({ email });
            if (!user) {
                throw new CustomHttpExceptionError('Your email is not registered', 401);
            }

            // Hash the new password
            const hashedPassword = await HashPassword(payload.password);

            // Update the user's password
            await this.userService.UpdateUserPatch(user.id, { password: hashedPassword });

            const TokenUser = await generateTokenJWT(user, this.authService);

            return ResponseSuccessBuilder(res, 200, "Success", TokenUser);
        } catch (error) {
            next(error);
        }
    };


    refreshAccessToken = async (req, res, next) => {
        try {
            const refreshTokenDto: RefreshTokenDto = req.body;
            const token = await this.authService.GetRefreshToken(refreshTokenDto.refresh_token);
            if (!token) {
                throw new CustomHttpExceptionError('Invalid token', 400);
            }

            // jwt verify
            const metadata = await TokenJwtVerification(token.token, true);

            // generate new access token
            const accessToken = await TokenJwtGenerator(metadata, process.env.JWT_ACCESS_TOKEN_EXP, false);

            req.id = metadata.id;
            req.email = metadata.email;
            ResponseSuccessBuilder(res, 200, 'Success', {access_token: accessToken})
        } catch (error) {
            next(error);
        }
    }

    logout = async (req, res, next) => {
        try {
            const refreshTokenDto: RefreshTokenDto = req.body;
            const metadata = await TokenJwtVerification(refreshTokenDto.refresh_token, true);
            await this.authService.DeleteRefreshToken(metadata.id);
            ResponseSuccessBuilder(res, 200, 'Logout success', null);
        } catch (error) {
            next(error);
        }
    }
}