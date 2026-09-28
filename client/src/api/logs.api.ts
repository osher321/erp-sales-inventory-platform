import { apiRequest } from "./httpClient";
import type { ApiLogListResult, HttpMethod, ListParams } from "../types/api";

export type LogListParams = ListParams & {
  method?: HttpMethod;
  success?: boolean;
  sortOrder?: "asc" | "desc";
};

export function listLogs(params: LogListParams = {}): Promise<ApiLogListResult> {
  return apiRequest<ApiLogListResult>("/api/logs", { query: params });
}
