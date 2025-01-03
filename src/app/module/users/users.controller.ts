import {Router} from "express";
import {ResponseSuccessBuilder} from "@/lib/helper/response";
import {CustomHttpExceptionError} from "@/lib/helper/customError";
import {FilterUser} from "@/lib/types/filters/user";

import ValidatorMiddleware from "../../middleware/validator";
import {Limiter} from "../../middleware/limiter";

import {UserDto} from "./users.dto";
import {UserService} from "./users.service";

export class UserController {
    public router: Router;
    private userService: UserService;

    constructor(userService: UserService) {
        this.router = Router();
        this.userService = userService;
        this.initializeRoutes();
    }

    private initializeRoutes() {
        this.router.get("/list", this.getAllUser);
        this.router.get("/", this.getUser);
        this.router.get("/:id", this.getUserById);
        this.router.put("/", Limiter(5 * 1000, 1), ValidatorMiddleware(UserDto), this.update);
        this.router.delete("/:id", this.delete);
    }

    getAllUser = async (req, res, next) => {
        try {
            const filter: FilterUser = {
                name: req.query.name,
                email: req.query.email,
                phone: req.query.phone,
            }

            const page: number = req.query.page || 1;
            const limit: number = req.query.limit || 10;
            const sortBy: string = req.query.sortBy || "name";
            const order: string = req.query.order || "ASC";

            const users = await this.userService.GetAll(page, limit, sortBy, order.toUpperCase() as "ASC" | "DESC", filter);

            return ResponseSuccessBuilder(res, 200, "Success get all user data", users);
        } catch (error) {
            next(error);
        }
    }

    // get user by token jwt
    getUser = async (req, res, next) => {
        try {
            const id: string = req.id;
            if (!id) {
                throw new CustomHttpExceptionError("Can`t read the user id", 400);
            }
            const user = await this.userService.GetUserByParams({id: id});
            return ResponseSuccessBuilder(res, 200, "Success get user data", user);
        } catch (error) {
            next(error);
        }
    }

    getUserById = async (req, res, next) => {
        try {
            let user;
            const id: string = req.params.id;
            if (!id) {
                throw new CustomHttpExceptionError("Invalid payload", 400);
            }

            user = await this.userService.GetUserByParams({id: id});

            if (!user) {
                throw new CustomHttpExceptionError("User not found", 404);
            }
            return ResponseSuccessBuilder(res, 200, "Success get user data", user);
        } catch (error) {
            next(error);
        }
    }

    update = async (req, res, next) => {
        try {
            const id: string = req.id;
            const payload: UserDto = req.body;
            if (!id) {
                throw new CustomHttpExceptionError("Gagal mendapatkan identitas user", 404);
            }
            const user = await this.userService.Update(id, payload);

            return ResponseSuccessBuilder(res, 200, user.message, user.data)
        } catch (error) {
            next(error);
        }
    }

    delete = async (req, res, next) => {
        try {
            const id: string = req.params.id;
            const deletedUser = await this.userService.Delete(id);
            if (deletedUser.affected === 0) {
                throw new CustomHttpExceptionError('User tidak ditemukan', 404)
            }
            return ResponseSuccessBuilder(res, 200, "Berhasil menghapus data user")
        } catch (error) {
            next(error);
        }
    }
}