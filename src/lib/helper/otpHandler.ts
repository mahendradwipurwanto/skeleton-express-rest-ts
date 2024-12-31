// function to handle OTP generation with userData, otpData, and otpRepository

import {OtpDto} from "@/app/module/auth/auth.dto";
import {GenerateRandomNumber, GetTimestamp} from "@/lib/helper/common";
import {User} from "@/lib/types/data/user";
import {AuthService} from "@/app/module/auth/auth.service";

export async function HandleOtpGeneration(user: User, authService: AuthService): Promise<{
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
        code: otpCode
    };

    // Store OTP in the database
    await authService.StoreOtp(otp);

    return {
        message,
        code: otpCode
    }
}