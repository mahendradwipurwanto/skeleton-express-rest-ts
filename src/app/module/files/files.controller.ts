import {Router} from "express";
import {Limiter} from "../../middleware/limiter";

import {CustomHttpExceptionError} from "@/lib/helper/customError";
import {GetFileFromLocal} from "@/lib/storage/uploader";

export class FilesController {
    public router: Router;

    constructor() {
        this.router = Router();
        this.initializeRoutes();
    }

    private initializeRoutes() {
        this.router.get('/images/:name', Limiter(10 * 1000, 10), this.getDropPoint);
    }

    getDropPoint = async (req, res, next) => {
        try {
            const filename: string = req.params.name;

            if (!filename) {
                throw new CustomHttpExceptionError("Filename is required", 400);
            }

            // get file from storage
            const file = await GetFileFromLocal(filename);

            // return as file response
            res.setHeader('Content-Type', 'image/jpeg');
            res.send(file);
        } catch (error) {
            next(error);
        }
    }
}
