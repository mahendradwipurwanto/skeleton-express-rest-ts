import express from "express";
import cors from 'cors';
import {AppDataSource} from "@/config/mysql/datasource";
import ErrorHandler from "./middleware/errorHandling";
import {VerifyJwtToken} from "./middleware/auth";

import {AuthController} from "./module/auth/auth.controller";
import {AuthService} from "./module/auth/auth.service";
import {EntityUserToken, EntityOtpData} from "./module/auth/auth.model";

import {UserController} from "./module/users/users.controller";
import {UserService} from "./module/users/users.service";
import {EntityUser} from "./module/users/users.model";
import {EntityUserData} from "@/app/module/users/userData.model";

import {RoleController} from "@/app/module/role/role.controller";
import {RoleService} from "@/app/module/role/role.service";
import {EntityRole} from "@/app/module/role/role.model";

import {FilesController} from "@/app/module/files/files.controller";

const prefix = process.env.API_PREFIX;
const listOrigin = process.env.CORS_ORIGIN;
const corsOptions = {
    origin: listOrigin,
    method: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS', 'PATCH'],
    optionsSuccessStatus: 200,
    credentials: true

}

export class App {
    public SetupMiddleware(app: express.Application): void {
        app.use(cors(corsOptions));
        app.use(express.json());
        app.use(express.urlencoded({extended: true}))
        app.use(VerifyJwtToken(prefix));
    }

    public SetupRoutes(app: express.Application): void {

        // service dependency injection
        const authService = new AuthService(AppDataSource.getRepository(EntityUserToken), AppDataSource.getRepository(EntityOtpData), AppDataSource.getRepository(EntityUser));
        const roleService = new RoleService(AppDataSource.getRepository(EntityRole));
        const userService = new UserService(AppDataSource.getRepository(EntityUser), AppDataSource.getRepository(EntityUserData));

        // controller dependency injection
        const authController = new AuthController(authService, userService, roleService);
        const roleController = new RoleController(roleService);
        const userController = new UserController(userService);

        const fileController = new FilesController();

        // routes register
        app.use(`${prefix}/auth`, authController.router);
        app.use(`${prefix}/role`, roleController.router);
        app.use(`${prefix}/users`, userController.router);
        app.use(`/files`, fileController.router);
    }

    public SetupErrorHandling(app: express.Application): void {
        app.use(ErrorHandler);
    }
}
