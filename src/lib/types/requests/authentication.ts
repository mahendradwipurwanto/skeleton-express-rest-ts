export interface RequestSignIn {
    email: string;
    password?: string;
    type: number;
}

export interface RequestRefreshToken {
    token: string;
}

export interface RequestSignUp {
    name: string;
    email: string;
    phone: string;
    password: string;
    type: number;
}

export interface RequestSetupPin {
    signature: string;
    pin: number;
}

export interface RequestForgotPassword {
    email: string;
}

export interface RequestVerifyOtp {
    signature: string;
    otp: string;
}

export interface RequestResetPassword {
    signature: string;
    password: string;
}