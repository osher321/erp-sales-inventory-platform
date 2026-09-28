import type { OrderStatus } from "../types/api";

// Mirrors the backend's ORDER_STATUSES enum (server/src/validators/order.validators.ts).
// The backend doesn't restrict which transitions are allowed, so the UI doesn't
// either — every status is always selectable, and the server is the sole judge.
export const ORDER_STATUSES: OrderStatus[] = ["DRAFT", "PENDING", "CONFIRMED", "SHIPPED", "COMPLETED", "CANCELLED"];

export function formatOrderStatusLabel(status: OrderStatus): string {
  return status.charAt(0) + status.slice(1).toLowerCase();
}
