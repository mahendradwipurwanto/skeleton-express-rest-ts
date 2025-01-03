import * as dotenv from 'dotenv';
import {join} from "path";
import fs from 'fs';
import {DataSource, DataSourceOptions} from 'typeorm';
import {SeederOptions} from 'typeorm-extension';

import {EntityUser} from '@/app/module/users/users.model';
import {EntityUserData} from "@/app/module/users/userData.model";
import {EntityUserToken, EntityOtpData} from "@/app/module/auth/auth.model";

import {EntityRole} from "@/app/module/role/role.model";
import {EntityNotification} from "@/app/module/profile/profile.model";

dotenv.config();

const options: DataSourceOptions & SeederOptions = {
    type: 'mysql',
    host: process.env.DB_HOST,
    port: parseInt(process.env.DB_PORT || "3306"),
    username: process.env.DB_USER,
    password: process.env.DB_PASS,
    database: process.env.DB_NAME,
    logging: false,
    synchronize: false,
    entities: [
        EntityUser,
        EntityUserData,
        EntityUserToken,
        EntityOtpData,
        EntityNotification,
        EntityRole
    ],
    migrations: [join(__dirname, '/migrations/**/*{.ts,.js}')],
    migrationsTableName: 'typeorm_migrations',
    migrationsRun: false,
    seeds: [join(__dirname, '/seeders/**/*{.ts,.js}')],
    seedTracking: true,
    ssl: process.env.DB_CA ? {
        ca: fs.readFileSync(process.env.DB_CA),
        rejectUnauthorized: true,
    } : false,
};

export const AppDataSource = new DataSource(options);