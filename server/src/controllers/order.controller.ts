import { Request, Response } from "express";
import * as orderService from "../services/order.service";
import { ApiError } from "../middleware/errorHandler";
import { sendSuccess } from "../utils/apiResponse";
import { orderListQuerySchema } from "../validators/order.validators";

export async function list(req: Request, res: Response) {
  const parsed = orderListQuerySchema.safeParse(req.query);
  if (!parsed.success) {
    throw new ApiError(400, parsed.error.issues.map((issue) => issue.message).join("; "));
  }
  const result = await orderService.listOrders(parsed.data);
  sendSuccess(res, result);
}

export async function getById(req: Request, res: Response) {
  const order = await orderService.getOrderById(req.params.id as string);
  sendSuccess(res, order);
}

export async function create(req: Request, res: Response) {
  const order = await orderService.createOrder(req.body);
  sendSuccess(res, order, 201);
}

export async function updateStatus(req: Request, res: Response) {
  const order = await orderService.updateOrderStatus(req.params.id as string, req.body.status);
  sendSuccess(res, order);
}
