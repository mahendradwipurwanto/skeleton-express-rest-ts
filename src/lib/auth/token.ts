import jwt from 'jsonwebtoken';
import {CustomHttpExceptionError} from '../helper/customError';
import {TokenData} from "../types/data/authentication";

export async function TokenJwtGenerator(data: TokenData, expiredIn: string, isRefresh: boolean): Promise<string> {
    const secretKey = isRefresh ? process.env.JWT_REFRESH_SECRET_KEY : process.env.JWT_ACCESS_SECRET_KEY;

    if (!secretKey) {
        throw new Error('Secret key not found');
    }

    try {
        return jwt.sign(
            {
                id: data.id,
                email: data.email,
                name: data.name,
                role: data.role,
                permissions: data.permissions,
                date: new Date().toLocaleString('id-ID', {timeZone: 'Asia/Jakarta'}),
                expired: new Date(Date.now() + parseInt(expiredIn) * 1000).toLocaleString('id-ID', {timeZone: 'Asia/Jakarta'}),
            },
            secretKey,
            {
                issuer: 'exchanger-vepay-by-ngodingin-indonesia',
                algorithm: 'HS256',
                expiresIn: parseInt(expiredIn),
            }
        );
    } catch (error) {
        throw new Error(`Failed when generating token: ${error.message}`);
    }
}

export async function TokenJwtVerification(token: string, isRefresh: boolean): Promise<TokenData> {
    const secretKey = isRefresh ? process.env.JWT_REFRESH_SECRET_KEY : process.env.JWT_ACCESS_SECRET_KEY;
    if (!secretKey) {
        throw new Error('Secret key not found');
    }

    try {
        const decodedToken = jwt.verify(token, secretKey, {
            issuer: 'exchanger-vepay-by-ngodingin-indonesia',
            algorithms: ['HS256'],
        });

        return {
            id: decodedToken['id'],
            email: decodedToken['email'],
            name: decodedToken['name'],
            role: decodedToken['role'],
            permissions: decodedToken['permissions'],
            date: decodedToken['date'],
            expired: decodedToken['expired'],
        };
    } catch (err) {
        throw new CustomHttpExceptionError('There is something wrong when verify token', 401, err);
    }
}
