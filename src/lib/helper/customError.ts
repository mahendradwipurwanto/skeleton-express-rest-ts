import {substringNumber} from "@/lib/helper/common";

export class CustomHttpExceptionError extends Error {
    public code: number;
    public customCode: number;
    public detailError: { name: string; message: string; };

    constructor(message: string, code: number, error?: Error) {
        super(message);
        this.code = substringNumber(code, 3) || 500;
        this.customCode = code || 500;
        this.detailError = error as { name: string; message: string; };
    }
}
