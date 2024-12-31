import { rateLimit } from "express-rate-limit";
import { CustomHttpExceptionError } from "@/lib/helper/customError";

/* eslint-disable @typescript-eslint/no-unused-vars */
export const Limiter = (limit: number, max: number) => rateLimit({
  windowMs: limit, // Window duration in milliseconds
  max: max, // Maximum number of requests per IP per windowMs
  standardHeaders: true, // Enable `RateLimit-*` headers in the response
  legacyHeaders: false, // Disable the `X-RateLimit-*` headers
  handler: (_req, _res, next, _options) => {
    next(new CustomHttpExceptionError('Terlalu banyak requests - harap tunggu sebentar', 429));
  },
});