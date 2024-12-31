import {Router} from "express";
import {ResponseSuccessBuilder} from "@/lib/helper/response";

import {RoleService} from "./role.service";

export class RoleController {
    public router: Router;
    private roleService: RoleService;

    constructor(roleService: RoleService) {
        this.router = Router();
        this.roleService = roleService;
        this.initializeRoutes();
    }

    private initializeRoutes() {
        this.router.get('/', this.getAll);
        this.router.get('/:id', this.getById);
    }

    getAll = async (req, res, next) => {
        try {
            const limit: number = req.query.limit || null;
            const roles = await this.roleService.GetAll(limit);

            return ResponseSuccessBuilder(res, 200, "Success getting role data", roles);
        } catch (error) {
            next(error);
        }
    }

    getById = async (req, res, next) => {
        try {
            const Id: string = req.id;
            const roles = await this.roleService.GetById(Id);

            return ResponseSuccessBuilder(res, 200, "Success getting role data", roles);
        } catch (error) {
            next(error);
        }
    }
}