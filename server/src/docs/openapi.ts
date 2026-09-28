import { responses } from "./responses";
import { schemas } from "./schemas";
import { authPaths } from "./paths/auth.paths";
import { customersPaths } from "./paths/customers.paths";
import { healthPaths } from "./paths/health.paths";
import { integrationPaths } from "./paths/integration.paths";
import { inventoryPaths } from "./paths/inventory.paths";
import { logsPaths } from "./paths/logs.paths";
import { ordersPaths } from "./paths/orders.paths";
import { productsPaths } from "./paths/products.paths";

export const openApiDocument = {
  openapi: "3.0.3",
  info: {
    title: "ERP Sales & Inventory Integration Platform API",
    version: "1.0.0",
    description:
      "REST API for a portfolio ERP demo covering authentication, customers, products, inventory, and sales " +
      "orders. All responses (except GET /api/health) use a consistent envelope: " +
      '`{"success": true, "data": ...}` on success, `{"success": false, "message": "..."}` on error. ' +
      "Every endpoint except /api/health, /api/auth/login, and /api/auth/register requires a Bearer JWT " +
      '— use the "Authorize" button above with a token from POST /api/auth/login (demo account: ' +
      "demo@example.com / Demo1234!).",
  },
  servers: [{ url: "/", description: "Current server" }],
  tags: [
    { name: "Health", description: "Service liveness check" },
    { name: "Auth", description: "Login, registration, and JWT issuance" },
    { name: "Customers", description: "Customer CRUD" },
    { name: "Products", description: "Product catalog CRUD, search, and stock-level lookups" },
    { name: "Inventory", description: "Stock-quantity view and updates, separate from catalog data" },
    { name: "Orders", description: "Sales order creation (atomic, stock-checked) and lifecycle" },
    { name: "Logs", description: "Automatically recorded API request history" },
    {
      name: "Priority Integration",
      description:
        "Priority Integration Simulator — simulates syncing real local data to a Priority-style external ERP. " +
        "No real outbound network call is ever made; this is a demo of integration architecture, not a live connection.",
    },
  ],
  components: {
    securitySchemes: {
      bearerAuth: {
        type: "http",
        scheme: "bearer",
        bearerFormat: "JWT",
      },
    },
    schemas,
    responses,
  },
  security: [{ bearerAuth: [] }],
  paths: {
    ...healthPaths,
    ...authPaths,
    ...customersPaths,
    ...productsPaths,
    ...inventoryPaths,
    ...ordersPaths,
    ...logsPaths,
    ...integrationPaths,
  },
};
