import { apiRequest } from "./httpClient";
import type { Customer, CustomerListResult, ListParams } from "../types/api";

export interface CustomerInput {
  customerNumber: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  address: string;
  city: string;
}

export function listCustomers(params: ListParams = {}): Promise<CustomerListResult> {
  return apiRequest<CustomerListResult>("/api/customers", { query: params });
}

export function createCustomer(input: CustomerInput): Promise<Customer> {
  return apiRequest<Customer>("/api/customers", { method: "POST", body: input });
}

export function updateCustomer(id: string, input: Partial<CustomerInput>): Promise<Customer> {
  return apiRequest<Customer>(`/api/customers/${id}`, { method: "PUT", body: input });
}

export function deleteCustomer(id: string): Promise<void> {
  return apiRequest<void>(`/api/customers/${id}`, { method: "DELETE" });
}
