import { apiRequest } from "./httpClient";
import type { InventoryStatus, ListParams, Product, ProductListResult } from "../types/api";

export interface ProductInput {
  sku: string;
  name: string;
  description?: string;
  category: string;
  price: number;
  stockQuantity: number;
  minimumStock: number;
}

export type ProductSortField = "price" | "name" | "stockQuantity" | "createdAt";

export type ProductListParams = ListParams & {
  category?: string;
  stockStatus?: InventoryStatus;
  sortBy?: ProductSortField;
  sortOrder?: "asc" | "desc";
};

export function listProducts(params: ProductListParams = {}): Promise<ProductListResult> {
  return apiRequest<ProductListResult>("/api/products", { query: params });
}

export function createProduct(input: ProductInput): Promise<Product> {
  return apiRequest<Product>("/api/products", { method: "POST", body: input });
}

export function updateProduct(id: string, input: Partial<ProductInput>): Promise<Product> {
  return apiRequest<Product>(`/api/products/${id}`, { method: "PUT", body: input });
}

export function deleteProduct(id: string): Promise<void> {
  return apiRequest<void>(`/api/products/${id}`, { method: "DELETE" });
}

export function getLowStockProducts(): Promise<Product[]> {
  return apiRequest<Product[]>("/api/products/low-stock");
}

export function getOutOfStockProducts(): Promise<Product[]> {
  return apiRequest<Product[]>("/api/products/out-of-stock");
}
