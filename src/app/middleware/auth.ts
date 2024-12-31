import {Request, Response, NextFunction} from "express";
import {CustomHttpExceptionError} from "@/lib/helper/customError";
import {TokenJwtVerification} from "@/lib/auth/token";
import {TokenData} from "@/lib/types/data/authentication";
import {Permission} from "@/lib/types/data/role";

// initial request information into context / request interface
declare module 'express' {
    export interface Request {
        id: string;
        email: string;
        name: string;
        role: string;
        permissions: Permission;
        date: string;
        expired: string;
    }
}

export function VerifyJwtToken(prefix: string) {
    return async (req: Request, _res: Response, next: NextFunction) => {
        try {
            // skip routes for verify
            const openRoutes = [
                `${prefix}/auth/sign-in`,
                `${prefix}/auth/sign-up`,
                `${prefix}/auth/setup-pin`,
                `${prefix}/auth/refresh-token`,
                `${prefix}/auth/forgot-password`,
                `${prefix}/auth/verify-otp`,
                `${prefix}/auth/resend-otp`,
                `${prefix}/auth/reset-password`,
                `${prefix}/auth/logout`,
            ];

            if (openRoutes.includes(req.path) || req.path.includes("/files/images") || req.path.includes("/favicon.ico")) {
                return next();
            }

            // get authorization header
            const header = req.headers.authorization;
            if (!header) {
                throw new CustomHttpExceptionError('Authorization not found', 401);
            }

            // split header by space
            const parts = header.split(' ');
            if (parts.length !== 2 || parts[0] !== 'Bearer') {
                throw new CustomHttpExceptionError('Invalid token', 401);
            }

            // get and verify the jwt token
            const token = parts[1];
            const metadata: TokenData = await TokenJwtVerification(token, false);

            req.id = metadata.id;
            req.email = metadata.email;
            req.name = metadata.name;
            req.role = metadata.role;
            req.permissions = metadata.permissions;
            req.date = metadata.date;
            req.expired = metadata.expired;

            next();
        } catch (error) {
            next(error);
        }
    }
}
