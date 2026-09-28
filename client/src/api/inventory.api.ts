import { apiRequest } from "./httpClient";
import type { InventoryItem, InventoryMovement } from "../types/api";

export interface UpdateStockInput {
  stockQuantity: number;
  reason?: string;
}

export function listInventory(): Promise<InventoryItem[]> {
  return apiRequest<InventoryItem[]>("/api/inventory");
}

export function updateStock(productId: string, input: UpdateStockInput): Promise<InventoryItem> {
  return apiRequest<InventoryItem>(`/api/inventory/${productId}`, { method: "PUT", body: input });
}

export function getMovements(productId: string): Promise<InventoryMovement[]> {
  return apiRequest<InventoryMovement[]>(`/api/inventory/${productId}/movements`);
}
