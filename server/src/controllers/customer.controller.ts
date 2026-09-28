import { Request, Response } from "express";
import * as customerService from "../services/customer.service";
import { ApiError } from "../middleware/errorHandler";
import { sendSuccess } from "../utils/apiResponse";
import { customerListQuerySchema } from "../validators/customer.validators";

export async function list(req: Request, res: Response) {
  const parsed = customerListQuerySchema.safeParse(req.query);
  if (!parsed.success) {
    throw new ApiError(400, parsed.error.issues.map((issue) => issue.message).join("; "));
  }
  const result = await customerService.listCustomers(parsed.data);
  sendSuccess(res, result);
}

export async function getById(req: Request, res: Response) {
  const customer = await customerService.getCustomerById(req.params.id as string);
  sendSuccess(res, customer);
}

export async function create(req: Request, res: Response) {
  const customer = await customerService.createCustomer(req.body);
  sendSuccess(res, customer, 201);
}

export async function update(req: Request, res: Response) {
  const customer = await customerService.updateCustomer(req.params.id as string, req.body);
  sendSuccess(res, customer);
}

export async function remove(req: Request, res: Response) {
  await customerService.deleteCustomer(req.params.id as string);
  sendSuccess(res, null);
}
