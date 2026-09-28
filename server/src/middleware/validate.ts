import { NextFunction, Request, Response } from "express";
import { ZodType } from "zod";
import { ApiError } from "./errorHandler";

export function validateBody(schema: ZodType) {
  return (req: Request, _res: Response, next: NextFunction) => {
    const result = schema.safeParse(req.body);
    if (!result.success) {
      const message = result.error.issues.map((issue) => `${issue.path.join(".")}: ${issue.message}`).join("; ");
      return next(new ApiError(400, message));
    }
    req.body = result.data;
    next();
  };
}
