import { NextFunction, Request, Response } from "express";
import { prisma } from "../config/prisma";

const MAX_ERROR_MESSAGE_LENGTH = 500;

// Every response in this app goes through res.json() (sendSuccess, errorHandler,
// and notFoundHandler all call it), so wrapping it lets the ApiLog row be written
// — and awaited — before the response bytes actually go out, instead of a
// fire-and-forget write racing the caller's next request. Only method, path,
// outcome, timing, and the caller's email are captured — never the request
// body, headers, or Authorization, so passwords/JWTs/secrets never reach ApiLog.
export function apiLogger(req: Request, res: Response, next: NextFunction) {
  const startedAt = Date.now();
  const originalJson = res.json.bind(res);

  res.json = ((body: unknown) => {
    const message =
      body && typeof body === "object" && typeof (body as { message?: unknown }).message === "string"
        ? (body as { message: string }).message
        : undefined;

    void prisma.apiLog
      .create({
        data: {
          method: req.method,
          endpoint: req.originalUrl.split("?")[0],
          statusCode: res.statusCode,
          responseTime: Date.now() - startedAt,
          userEmail: req.user?.email,
          errorMessage: res.statusCode >= 400 ? message?.slice(0, MAX_ERROR_MESSAGE_LENGTH) : undefined,
        },
      })
      .catch((err) => {
        console.error("Failed to write ApiLog entry:", err);
      })
      .finally(() => {
        originalJson(body);
      });

    return res;
  }) as Response["json"];

  next();
}
