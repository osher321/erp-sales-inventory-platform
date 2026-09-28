import { IntegrationEntity } from "@prisma/client";
import { Request, Response } from "express";
import * as integrationService from "../services/priorityIntegration.service";
import { ApiError } from "../middleware/errorHandler";
import { sendSuccess } from "../utils/apiResponse";
import { integrationHistoryQuerySchema } from "../validators/integration.validators";

export async function getStatus(_req: Request, res: Response) {
  const status = await integrationService.getStatus();
  sendSuccess(res, status);
}

export async function syncCustomers(_req: Request, res: Response) {
  const result = await integrationService.runSync(IntegrationEntity.CUSTOMER);
  sendSuccess(res, result);
}

export async function syncProducts(_req: Request, res: Response) {
  const result = await integrationService.runSync(IntegrationEntity.PRODUCT);
  sendSuccess(res, result);
}

export async function syncInventory(_req: Request, res: Response) {
  const result = await integrationService.runSync(IntegrationEntity.INVENTORY);
  sendSuccess(res, result);
}

export async function syncOrders(_req: Request, res: Response) {
  const result = await integrationService.runSync(IntegrationEntity.ORDER);
  sendSuccess(res, result);
}

export async function syncAll(_req: Request, res: Response) {
  const result = await integrationService.runSyncAll();
  sendSuccess(res, result);
}

export async function getHistory(req: Request, res: Response) {
  const parsed = integrationHistoryQuerySchema.safeParse(req.query);
  if (!parsed.success) {
    throw new ApiError(400, parsed.error.issues.map((issue) => issue.message).join("; "));
  }
  const result = await integrationService.listHistory(parsed.data);
  sendSuccess(res, result);
}
