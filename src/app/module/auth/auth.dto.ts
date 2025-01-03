import {IsNotEmpty, IsNumber, IsOptional, IsString, Matches} from "class-validator";

export class SignInDto {
    @IsNotEmpty({message: "Email can't be empty"})
    @IsString({message: "Email is not valid"})
    email: string;

    @IsOptional()
    @IsNotEmpty({message: "Password can't be empty"})
    @IsString({message: "Password is not valid"})
    @Matches(
        /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[\W_])[A-Za-z\d\W_]{8,}$/,
        {
            message: "Password must be at least 8 characters long and include uppercase, lowercase, number, and special character",
        }
    )
    password: string;

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

    @IsOptional()
    @IsNotEmpty({message: "Type can't be empty"})
    @IsString({message: "Type is not valid"})
    type: string;
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

export class ResetPasswordDto {
    @IsNotEmpty({message: "Signature tidak boleh kosong"})
    @IsString({message: "Signature tidak sesuai"})
    signature: string;

    @IsNotEmpty({message: "Password tidak boleh kosong"})
    @IsString({message: "Password tidak sesuai"})
    @Matches(
        /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[\W_])[A-Za-z\d\W_]{8,}$/,
        {
            message: "Password must be at least 8 characters long and include uppercase, lowercase, number, and special character",
        }
    )
    password: string;
}

export class RefreshTokenDto {
    @IsNotEmpty({message: "Refresh token can't be empty"})
    @IsString({message: "Refresh token is not valid"})
    refresh_token: string;
}