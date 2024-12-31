import { NextFunction, Request, Response } from "express";
import { CustomHttpExceptionError } from "@/lib/helper/customError";
import { ResponseErrorBuilder } from "@/lib/helper/response";
import logger from "@/lib/helper/logger";

/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable @typescript-eslint/no-explicit-any */
const ErrorHandler = (err: any, req: Request, res: Response, _next: NextFunction) => {
    logger.error('=> "' + req.originalUrl + '" use method: "' + req.method + '", unexprected error:', err.message);
    if (err instanceof CustomHttpExceptionError) {
        ResponseErrorBuilder(res, err);
    } else {
        const error = new CustomHttpExceptionError('Terjadi kesalahan pada server', 500, err);
        ResponseErrorBuilder(res, error);
    }
};

export default ErrorHandler;