import type { InventoryStatus } from "../types/api";

// Mirrors the backend's stock-status semantics exactly (see
// server/src/services/product.service.ts / inventory.service.ts): OUT_OF_STOCK
// takes priority, then LOW_STOCK (stockQuantity <= minimumStock, which is a
// superset that includes 0), otherwise IN_STOCK.
export function getStockStatus(stockQuantity: number, minimumStock: number): InventoryStatus {
  if (stockQuantity === 0) return "OUT_OF_STOCK";
  if (stockQuantity <= minimumStock) return "LOW_STOCK";
  return "IN_STOCK";
}
