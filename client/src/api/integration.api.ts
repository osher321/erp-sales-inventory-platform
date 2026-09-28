import { apiRequest } from "./httpClient";
import type {
  IntegrationEntityType,
  IntegrationHistoryResult,
  IntegrationStatus,
  IntegrationSync,
  IntegrationSyncAllResult,
  IntegrationSyncStatus,
  ListParams,
} from "../types/api";

export function getStatus(): Promise<IntegrationStatus> {
  return apiRequest<IntegrationStatus>("/api/integration/status");
}

export function syncCustomers(): Promise<IntegrationSync> {
  return apiRequest<IntegrationSync>("/api/integration/sync/customers", { method: "POST" });
}

export function syncProducts(): Promise<IntegrationSync> {
  return apiRequest<IntegrationSync>("/api/integration/sync/products", { method: "POST" });
}

export function syncInventory(): Promise<IntegrationSync> {
  return apiRequest<IntegrationSync>("/api/integration/sync/inventory", { method: "POST" });
}

export function syncOrders(): Promise<IntegrationSync> {
  return apiRequest<IntegrationSync>("/api/integration/sync/orders", { method: "POST" });
}

export function syncAll(): Promise<IntegrationSyncAllResult> {
  return apiRequest<IntegrationSyncAllResult>("/api/integration/sync/all", { method: "POST" });
}

export type IntegrationHistoryParams = ListParams & {
  entity?: IntegrationEntityType;
  status?: IntegrationSyncStatus;
  sortOrder?: "asc" | "desc";
};

export function getHistory(params: IntegrationHistoryParams = {}): Promise<IntegrationHistoryResult> {
  return apiRequest<IntegrationHistoryResult>("/api/integration/history", { query: params });
}
