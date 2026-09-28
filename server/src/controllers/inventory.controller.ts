import { Request, Response } from "express";
import * as inventoryService from "../services/inventory.service";
import { sendSuccess } from "../utils/apiResponse";

export async function list(_req: Request, res: Response) {
  const inventory = await inventoryService.listInventory();
  sendSuccess(res, inventory);
}

export async function getByProductId(req: Request, res: Response) {
  const inventory = await inventoryService.getInventoryByProductId(req.params.productId as string);
  sendSuccess(res, inventory);
}

export async function update(req: Request, res: Response) {
  const inventory = await inventoryService.updateStockQuantity(req.params.productId as string, req.body);
  sendSuccess(res, inventory);
}

export async function lowStock(_req: Request, res: Response) {
  const inventory = await inventoryService.getLowStockInventory();
  sendSuccess(res, inventory);
}

export async function outOfStock(_req: Request, res: Response) {
  const inventory = await inventoryService.getOutOfStockInventory();
  sendSuccess(res, inventory);
}
