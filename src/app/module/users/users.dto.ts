import {IsNotEmpty, IsEmail, IsEnum, IsString, IsOptional, Matches} from 'class-validator';

export class UserDto {
    @IsNotEmpty({message: "Email cannot be empty"})
    @IsEmail({}, {message: "Invalid email"})
    email: string;

    @IsOptional()
    @IsNotEmpty({message: "Phone cannot be empty"})
    phone: string;

    @IsOptional()
    @IsNotEmpty({message: "Username cannot be empty"})
    @IsString({message: "Invalid username"})
    username: string;

    @IsOptional()
    @IsNotEmpty({message: "Role Id cannot be empty"})
    @IsString({message: "Invalid Role Id"})
    role_id: string;

    @IsOptional()
    @IsNotEmpty({message: "Type cannot be empty"})
    @IsEnum([0, 1, 2], {message: "Invalid type"}) // Assuming type is an enum or specific values
    type: number;

    @IsOptional()
    @IsNotEmpty({message: "Status cannot be empty"})
    @IsEnum([0, 1, 2, 3], {message: "Invalid status"}) // Assuming status is an enum or specific values
    status: number;

    @IsOptional()
    @IsNotEmpty({message: "PIN cannot be empty"})
    @Matches(/^\d{4}$/, { message: "PIN must be a 4-digit number" })
    pin: number;

    @IsOptional()
    @IsNotEmpty({message: "Password cannot be empty"})
    @IsString({message: "Invalid password"})
    password: string;

    @IsOptional()
    @IsNotEmpty({message: "Referral code cannot be empty"})
    @IsString({message: "Invalid referral code"})
    referral_code: string;

    @IsOptional()
    @IsNotEmpty({message: "District cannot be empty"})
    @IsString({message: "Invalid district"})
    district: string;

    @IsOptional()
    @IsNotEmpty({message: "City cannot be empty"})
    @IsString({message: "Invalid city"})
    city: string;

    @IsOptional()
    @IsNotEmpty({message: "Province cannot be empty"})
    @IsString({message: "Invalid province"})
    province: string;
}