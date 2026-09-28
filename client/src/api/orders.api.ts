import { apiRequest } from "./httpClient";
import type { ListParams, Order, OrderListResult, OrderStatus } from "../types/api";

export type OrderSortField = "createdAt" | "total" | "orderNumber";

export type OrderListParams = ListParams & {
  status?: OrderStatus;
  sortBy?: OrderSortField;
  sortOrder?: "asc" | "desc";
};

export interface CreateOrderItemInput {
  productId: string;
  quantity: number;
}

export interface CreateOrderInput {
  customerId: string;
  items: CreateOrderItemInput[];
}

export function listOrders(params: OrderListParams = {}): Promise<OrderListResult> {
  return apiRequest<OrderListResult>("/api/orders", { query: params });
}

export function getOrderById(id: string): Promise<Order> {
  return apiRequest<Order>(`/api/orders/${id}`);
}

export function createOrder(input: CreateOrderInput): Promise<Order> {
  return apiRequest<Order>("/api/orders", { method: "POST", body: input });
}

export function updateOrderStatus(id: string, status: OrderStatus): Promise<Order> {
  return apiRequest<Order>(`/api/orders/${id}/status`, { method: "PUT", body: { status } });
}
