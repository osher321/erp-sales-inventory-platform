export type UserRole = "ADMIN" | "USER";

export interface AuthUser {
  id: string;
  email: string;
  name: string;
  role: UserRole;
}

export interface LoginResult {
  token: string;
  user: AuthUser;
}

export interface Pagination {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

export interface Customer {
  id: string;
  customerNumber: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  address: string;
  city: string;
  createdAt: string;
  updatedAt: string;
}

export interface Product {
  id: string;
  sku: string;
  name: string;
  description: string | null;
  category: string;
  price: string;
  stockQuantity: number;
  minimumStock: number;
  createdAt: string;
  updatedAt: string;
}

export type OrderStatus = "DRAFT" | "PENDING" | "CONFIRMED" | "SHIPPED" | "COMPLETED" | "CANCELLED";

export interface OrderItem {
  id: string;
  orderId: string;
  productId: string;
  quantity: number;
  unitPrice: string;
  subtotal: string;
  product?: Product;
}

export interface Order {
  id: string;
  orderNumber: string;
  customerId: string;
  customer?: Customer;
  status: OrderStatus;
  subtotal: string;
  vatAmount: string;
  total: string;
  items?: OrderItem[];
  createdAt: string;
  updatedAt: string;
}

export type InventoryStatus = "IN_STOCK" | "LOW_STOCK" | "OUT_OF_STOCK";

export interface InventoryItem {
  productId: string;
  sku: string;
  productName: string;
  stockQuantity: number;
  minimumStock: number;
  status: InventoryStatus;
}

export type InventoryMovementType = "STOCK_IN" | "STOCK_OUT" | "ADJUSTMENT" | "SALE" | "RETURN";

export interface InventoryMovement {
  id: string;
  productId: string;
  type: InventoryMovementType;
  quantity: number;
  previousQuantity: number;
  newQuantity: number;
  reason: string | null;
  createdAt: string;
}

export type ListParams = {
  page?: number;
  limit?: number;
  search?: string;
};

export interface CustomerListResult {
  customers: Customer[];
  pagination: Pagination;
}

export interface ProductListResult {
  products: Product[];
  pagination: Pagination;
}

export interface OrderListResult {
  orders: Order[];
  pagination: Pagination;
}

export type HttpMethod = "GET" | "POST" | "PUT" | "PATCH" | "DELETE";

export interface ApiLog {
  id: string;
  method: HttpMethod;
  endpoint: string;
  statusCode: number;
  responseTime: number;
  userEmail: string | null;
  errorMessage: string | null;
  timestamp: string;
}

export interface ApiLogListResult {
  logs: ApiLog[];
  pagination: Pagination;
}

export type IntegrationEntityType = "CUSTOMER" | "PRODUCT" | "INVENTORY" | "ORDER";
export type IntegrationSyncStatus = "SUCCESS" | "FAILED" | "PARTIAL";

export interface IntegrationSync {
  id: string;
  entity: IntegrationEntityType;
  status: IntegrationSyncStatus;
  startedAt: string;
  completedAt: string;
  durationMs: number;
  recordsProcessed: number;
  recordsSucceeded: number;
  recordsFailed: number;
  errorMessage: string | null;
  payloadSummary: string | null;
  createdAt: string;
}

export interface IntegrationStatus {
  externalSystem: string;
  connectionStatus: string;
  lastSyncAt: string | null;
  totalSyncs: number;
  successfulSyncs: number;
  failedSyncs: number;
  partialSyncs: number;
}

export interface IntegrationSyncAllResult {
  status: IntegrationSyncStatus;
  recordsProcessed: number;
  recordsSucceeded: number;
  recordsFailed: number;
  results: IntegrationSync[];
}

export interface IntegrationHistoryResult {
  syncs: IntegrationSync[];
  pagination: Pagination;
}
