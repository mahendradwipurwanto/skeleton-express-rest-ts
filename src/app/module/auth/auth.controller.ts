import {Router} from "express";
import dayjs from "dayjs";
import {ConvertTimestampToDayjs} from "@/lib/helper/common";

import {Limiter} from "../../middleware/limiter";
import ValidatorMiddleware from "../../middleware/validator";
import {ResponseSuccessBuilder} from "@/lib/helper/response";
import logger from "@/lib/helper/logger";
import {sendEmail} from "@/lib/gateway/mailer";

import {TokenData} from "@/lib/types/data/authentication";
import {CustomHttpExceptionError} from "@/lib/helper/customError";
import {TokenJwtGenerator, TokenJwtVerification} from "@/lib/auth/token";
import {DecryptMessage, EncryptMessage} from "@/lib/auth/signature";

import {UserService} from "../users/users.service";
import {AuthService} from "./auth.service";
import {RoleService} from "@/app/module/role/role.service";

import {ForgotPasswordDto, RefreshTokenDto, ResendOtpDto, SetupPinDto, SignInDto, VerifyOtpDto} from "./auth.dto";
import {UserDto} from "@/app/module/users/users.dto";
import {TransformPermissionsAsync} from "@/lib/helper/roles";
import {HandleOtpGeneration} from "@/lib/helper/otpHandler";
import GetRegisteredField from "@/lib/helper/registerHandler";


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
        this.router.post('/refresh-token', ValidatorMiddleware(RefreshTokenDto), this.refreshAccessToken);
        this.router.post('/logout', Limiter(5 * 1000, 10), ValidatorMiddleware(RefreshTokenDto), this.logout);
    }

    signIn = async (req, res, next) => {
        try {
            const payload: SignInDto = req.body;

            // Fetch the user by phone number
            const user = await this.userService.GetUserByParams({email: payload.email});
            if (!user) {
                throw new CustomHttpExceptionError('Your email is not registered', 401);
            }

            //check if pin exist
            if (!user.pin) {
                // Encrypt the message (for signature)
                const signature = await EncryptMessage(`${user.email}`);

                // Respond with success
                return ResponseSuccessBuilder(res, 202001, "You need to setup a PIN first before use your account", {signature});
            }

            // Respond with success
            return ResponseSuccessBuilder(res, 200, "Success", user);
        } catch (error) {
            next(error);
        }
    };

    signUp = async (req, res, next) => {
        try {
            const payload: UserDto = req.body;

            const checkUser = await this.userService.GetUserByParams({
                email: payload.email,
                user_data: {
                    phone: payload.phone
                }
            }, "OR");

            if (checkUser) { // Use the dynamic function to check which field is already registered
                const registeredField = GetRegisteredField(checkUser, payload, ['email', 'user_data.phone']);

                throw new CustomHttpExceptionError(`${registeredField} already registered`, 400);
            }

            // get default role id
            const role = await this.roleService.GetDefaultRole();

            // if role not found
            if (!role) {
                throw new CustomHttpExceptionError('Default role not found', 500);
            }

            const user = await this.userService.Create({
                ...payload,
                role_id: role.id
            });

            // Generate OTP-related data
            const generated_otp = await HandleOtpGeneration(user, this.authService)

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

            return ResponseSuccessBuilder(res, 201, 'Berhasil menambahkan data user.', {signature});
        } catch (error) {
            console.log(error);

            next(error);
        }
    }

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

            //check if pin exist
            if (user.pin) {
                // Respond with success
                return ResponseSuccessBuilder(res, 202002, "Your account already setup pin", user);
            }

            // Update the user's pin
            const userData = await this.userService.UpdateUserPatch(user.id, {pin: payload.pin});

            // Respond with success
            return ResponseSuccessBuilder(res, 200, userData.message, userData.data);
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
            const generated_otp = await HandleOtpGeneration(user, this.authService)

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
            const ip: string = req.ip;
            const payload: VerifyOtpDto = req.body;
            const decryptedMessage = await DecryptMessage(payload.signature);
            const email = decryptedMessage.split("|")[0];
            const user = await this.userService.GetUserByParams({email: email});
            if (!user) {
                throw new CustomHttpExceptionError('Invalid signature', 401);
            }
            const otp = await this.authService.GetOtp(decryptedMessage, payload.code);
            await this.authService.VerifyOtp(otp);

            const metadata: TokenData = {
                id: user.id,
                email: user.email,
                name: user.user_data.name,
                role: user.role.name,
                permissions: await TransformPermissionsAsync(user.role.permissions) || null,
                date: new Date().toLocaleString('id-ID', {timeZone: 'Asia/Jakarta'}),
                expired: new Date(Date.now() + parseInt(process.env.JWT_ACCESS_TOKEN_EXP) * 1000).toLocaleString('id-ID', {timeZone: 'Asia/Jakarta'})
            }

            // generate jwt token
            const accessToken = await TokenJwtGenerator(metadata, process.env.JWT_ACCESS_TOKEN_EXP, false);
            const refreshToken = await TokenJwtGenerator(metadata, process.env.JWT_REFRESH_TOKEN_EXP, true);

            // store refresh token to database
            await this.authService.StoreRefreshToken(metadata.id, refreshToken, ip);
            req.id = metadata.id;
            req.name = metadata.name
            req.email = metadata.email;
            return ResponseSuccessBuilder(res, 200, "Berhasil memverifikasi kode OTP", {
                access_token: accessToken,
                refresh_token: refreshToken,
                data: {
                    name: metadata.name,
                    email: metadata.email,
                    username: user.username
                },
                expired_in: parseInt(process.env.JWT_ACCESS_TOKEN_EXP),
            });
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
            const generated_otp = await HandleOtpGeneration(user, this.authService)

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

    refreshAccessToken = async (req, res, next) => {
        try {
            const ip: string = req.ip;
            const refreshTokenDto: RefreshTokenDto = req.body;
            const token = await this.authService.GetRefreshToken(refreshTokenDto.token, ip);
            if (!token) {
                throw new CustomHttpExceptionError('Token tidak sesuai', 401);
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
            const ip: string = req.ip;
            const refreshTokenDto: RefreshTokenDto = req.body;
            const metadata = await TokenJwtVerification(refreshTokenDto.token, true);
            await this.authService.DeleteRefreshToken(metadata.id, ip);
            ResponseSuccessBuilder(res, 200, 'Logout success', null);
        } catch (error) {
            next(error);
        }
    }
}