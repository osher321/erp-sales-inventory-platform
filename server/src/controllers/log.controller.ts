import { Request, Response } from "express";
import * as logService from "../services/log.service";
import { ApiError } from "../middleware/errorHandler";
import { sendSuccess } from "../utils/apiResponse";
import { logListQuerySchema } from "../validators/log.validators";

export async function list(req: Request, res: Response) {
  const parsed = logListQuerySchema.safeParse(req.query);
  if (!parsed.success) {
    throw new ApiError(400, parsed.error.issues.map((issue) => issue.message).join("; "));
  }
  const result = await logService.listLogs(parsed.data);
  sendSuccess(res, result);
}
