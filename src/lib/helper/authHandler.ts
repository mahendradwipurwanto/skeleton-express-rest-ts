import bcrypt from 'bcrypt';
// generate token
import {TokenData} from "@/lib/types/data/authentication";
import {TransformPermissionsAsync} from "@/lib/helper/roles";
import {TokenJwtGenerator} from "@/lib/auth/token";
import {OtpDto} from "@/app/module/auth/auth.dto";
import {GenerateRandomNumber, GetTimestamp} from "@/lib/helper/common";
import {User} from "@/lib/types/data/user";
import {AuthService} from "@/app/module/auth/auth.service";

export async function HandleOtpGeneration(user: User, authService: AuthService, type: string): Promise<{
    message: string,
    code: number
}> {

    // Generate OTP-related data
    const timestamp = await GetTimestamp();
    const otpCode = await GenerateRandomNumber(6);
    const message = `${user.email}|${timestamp}|${otpCode}`;

    // Create OTP object to store in database
    const otp: OtpDto = {
        user_id: user.id,
        data: message,
        code: otpCode,
        type: type
    };

    // Store OTP in the database
    await authService.StoreOtp(otp);

    return {
        message,
        code: otpCode
    }
}
/**
 * Hashes a plain text password.
 * @param plainTextPassword - The plain text password to hash.
 * @param saltRounds - The number of salt rounds to use (default: 10).
 * @returns A promise that resolves to the hashed password.
 */
export const HashPassword = async (plainTextPassword: string, saltRounds: number = 10): Promise<string> => {
    try {
        const salt = await bcrypt.genSalt(saltRounds);
        return await bcrypt.hash(plainTextPassword, salt);
    } catch (error) {
        console.error('Error hashing password:', error);
        throw new Error('Password hashing failed');
    }
};

export const generateTokenJWT = async (user: User, authService: AuthService) => {
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
    await authService.StoreRefreshToken(metadata.id, refreshToken, null);

    return {
        access_token: accessToken,
        refresh_token: refreshToken,
        data: {
            name: metadata.name,
            email: metadata.email,
            username: user.username
        },
        expired_in: parseInt(process.env.JWT_ACCESS_TOKEN_EXP),
    };
};

/**
 * Verifies if the provided password matches the hashed password.
 * @param plainTextPassword - The plain text password provided by the user.
 * @param hashedPassword - The hashed password stored in the database.
 * @returns A boolean indicating whether the password is valid.
 */
export const VerifyPassword = async (plainTextPassword: string, hashedPassword: string): Promise<boolean> => {
    try {
        return await bcrypt.compare(plainTextPassword, hashedPassword);
    } catch (error) {
        console.error('Error verifying password:', error);
        throw new Error('Password verification failed');
    }
};
