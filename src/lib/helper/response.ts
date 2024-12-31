import {Response} from "express";
import {ResponseStructure} from "../types/response";
import {CustomHttpExceptionError} from "./customError";
import {substringNumber} from "@/lib/helper/common";

/* eslint-disable @typescript-eslint/no-explicit-any */
export async function ResponseSuccessBuilder(res: Response, code: number, message?: string | undefined, data?: any) {

    responseBuilder(res, code, "Success", message, data);
}

export async function ResponseErrorBuilder(res: Response, err: any) {
    if (err.code === undefined) {
        err = new CustomHttpExceptionError("Internal Server Error", 500, err);
    }
    const error = err as CustomHttpExceptionError;
    const {customCode, message, detailError} = error;
    const errMessage = detailError ? detailError.message : null;

    responseBuilder(res, customCode, "Failed", message, errMessage);
}

function responseBuilder(res: Response, code: number, status: string, message: string, data?: any) {
    const isEmptyObject = (obj: object) => obj && Object.keys(obj).length === 0 && obj.constructor === Object;
    const payload: ResponseStructure = {
        status: status,
        code: code,
        data: isEmptyObject(data) ? null : data,
        message
    };
    res.status(substringNumber(code, 3)).send(payload);
}