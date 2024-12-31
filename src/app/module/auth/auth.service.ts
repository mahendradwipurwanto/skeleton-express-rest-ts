import {Repository} from "typeorm";
import dayjs from "dayjs";
import timezone from "dayjs/plugin/timezone";
import utc from "dayjs/plugin/utc";

import {CustomHttpExceptionError} from "@/lib/helper/customError";

import {OtpDto} from "./auth.dto";

import {EntityOtpData, EntityUserToken} from "./auth.model";
import {EntityUser} from "../users/users.model";

dayjs.extend(utc);
dayjs.extend(timezone);

export class AuthService {
    constructor(
        private readonly authRepository: Repository<EntityUserToken>,
        private readonly otpRepository: Repository<EntityOtpData>,
        private readonly userRepository: Repository<EntityUser>,
    ) {
    }

    async GetRefreshToken(token: string, ip: string) {
        return this.authRepository.findOneBy(
            {
                token: token,
                ip_address: ip
            }
        );
    }

    // create a new one if the user has never logged in, or update if they have
    async StoreRefreshToken(user_id: string, token: string, ip: string) {
        return this.authRepository.createQueryBuilder()
            .insert()
            .into(EntityUserToken)
            .values({
                user_id,
                token: token,
                ip_address: ip
            })
            .orUpdate(['token', 'ip_address'], ['user_id'])
            .execute();
    }

    async GetOtp(data: string, code?: number) {
        const [queryBuilder] = await Promise.all([this.otpRepository.createQueryBuilder('otp')]);
        queryBuilder.select([
            'otp.id',
            'otp.user_id',
            'otp.data',
            'otp.code',
            'otp.created_at'
        ]).where('otp.data = :data', {data})

        if (code) {
            queryBuilder.andWhere('otp.code = :code', {code});
        }

        const otp = await queryBuilder.getOne();
        if (!otp) {
            throw new CustomHttpExceptionError("Invalid OTP Code", 401);
        }

        return otp;
    }

    async VerifyOtp(data: EntityOtpData) {
        const queryRunner = this.otpRepository.manager.connection.createQueryRunner();
        await queryRunner.startTransaction();

        try {
            const createdAtUTC = dayjs(data.created_at).utc();
            const today = dayjs().utc();
            const diffInMinutes = today.diff(createdAtUTC, 'second');

            if (diffInMinutes > parseInt(process.env.EXPIRY_OTP_IN_SECOND)) throw new CustomHttpExceptionError("Expired OTP Code", 401);

            const email = data.data.split("|")[0];
            const existUser = await queryRunner.manager.findOne(EntityUser, {where: {email}});
            if (!existUser) throw new CustomHttpExceptionError('User not found', 404);

            if (!existUser.status) {
                await queryRunner.manager.update(this.userRepository.target, existUser.id, {status: 1});
            }

            await this.DeleteOtp(data);
            await queryRunner.commitTransaction();
        } catch (error) {
            await queryRunner.rollbackTransaction();
            throw error;
        } finally {
            await queryRunner.release();
        }
    }

    async StoreOtp(data: OtpDto) {
        const queryRunner = this.otpRepository.manager.connection.createQueryRunner();

        // Start a transaction
        await queryRunner.startTransaction();

        try {
            // Check if an OTP entry already exists for the given `data`
            const existingOtp = await this.otpRepository.findOne({
                where: { data: data.data },
            });

            if (existingOtp) {
                // Update the existing OTP entry
                existingOtp.code = data.code;
                existingOtp.created_at = new Date();
                await queryRunner.manager.save(existingOtp);
            } else {
                // Create a new OTP entry
                const newOtp = this.otpRepository.create({
                    user_id: data.user_id,
                    data: data.data,
                    code: data.code,
                    created_at: new Date(),
                });
                await queryRunner.manager.save(newOtp);
            }

            // Commit the transaction
            await queryRunner.commitTransaction();
        } catch (error) {
            // Rollback the transaction in case of an error
            await queryRunner.rollbackTransaction();
            throw error;
        } finally {
            // Release the query runner
            await queryRunner.release();
        }
    }

    async DeleteOtp(data: EntityOtpData) {
        this.otpRepository.remove(data);
    }

    async DeleteRefreshToken(user_id: string, ip: string) {
        return this.authRepository.delete(
            {
                user_id,
                ip_address: ip
            }
        );
    }
}