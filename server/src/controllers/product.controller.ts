import { Request, Response } from "express";
import * as productService from "../services/product.service";
import { ApiError } from "../middleware/errorHandler";
import { sendSuccess } from "../utils/apiResponse";
import { productListQuerySchema } from "../validators/product.validators";

export async function list(req: Request, res: Response) {
  const parsed = productListQuerySchema.safeParse(req.query);
  if (!parsed.success) {
    throw new ApiError(400, parsed.error.issues.map((issue) => issue.message).join("; "));
  }
  const result = await productService.listProducts(parsed.data);
  sendSuccess(res, result);
}

export async function getById(req: Request, res: Response) {
  const product = await productService.getProductById(req.params.id as string);
  sendSuccess(res, product);
}

export async function create(req: Request, res: Response) {
  const product = await productService.createProduct(req.body);
  sendSuccess(res, product, 201);
}

export async function update(req: Request, res: Response) {
  const product = await productService.updateProduct(req.params.id as string, req.body);
  sendSuccess(res, product);
}

export async function remove(req: Request, res: Response) {
  await productService.deleteProduct(req.params.id as string);
  sendSuccess(res, null);
}

export async function lowStock(_req: Request, res: Response) {
  const products = await productService.getLowStockProducts();
  sendSuccess(res, products);
}

export async function outOfStock(_req: Request, res: Response) {
  const products = await productService.getOutOfStockProducts();
  sendSuccess(res, products);
}
