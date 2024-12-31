import {IsNotEmpty, IsNumber, IsString} from "class-validator";

export class SignInDto {
    @IsNotEmpty({message: "Email can't be empty"})
    @IsString({message: "Email is not valid"})
    email: string;

    @IsNotEmpty({message: "Type can't be empty"})
    @IsNumber()
    type: number;
}

export class SetupPinDto {
    @IsNotEmpty({message: "Signature can't be empty"})
    @IsString({message: "Signature is not valid"})
    signature: string;

    @IsNotEmpty({message: "PIN can't be empty"})
    @IsNumber()
    pin: number;
}

export class OtpDto {
    @IsNotEmpty({message: "User id tidak boleh kosong"})
    @IsString({message: "User id tidak sesuai"})
    user_id: string;

    @IsNotEmpty({message: "Metadata tidak boleh kosong"})
    @IsString({message: "Metadata tidak sesuai"})
    data: string;

    @IsNotEmpty({message: "Kode OTP tidak boleh kosong"})
    @IsNumber()
    code: number;
}

export class ForgotPasswordDto {
    @IsNotEmpty({message: "Email tidak boleh kosong"})
    @IsString({message: "Email tidak sesuai"})
    email: string;
}

export class VerifyOtpDto {
    @IsNotEmpty({message: "Signature tidak boleh kosong"})
    @IsString({message: "Signature tidak sesuai"})
    signature: string;

    @IsNotEmpty({message: "Kode OTP tidak boleh kosong"})
    @IsNumber()
    code: number;
}

export class ResendOtpDto {
    @IsNotEmpty({message: "Signature tidak boleh kosong"})
    @IsString({message: "Signature tidak sesuai"})
    signature: string;
}

export class RefreshTokenDto {
    @IsNotEmpty({message: "Refresh token can't be empty"})
    @IsString({message: "Refresh token is not valid"})
    token: string;
}