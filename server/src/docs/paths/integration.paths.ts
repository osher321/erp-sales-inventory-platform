import { bearerSecurity, limitParam, pageParam, successData } from "../shared";

const syncResponses = {
  "200": {
    description: "Sync completed (SUCCESS, FAILED, or PARTIAL — check the `status` field, HTTP 200 either way since the sync itself ran).",
    content: { "application/json": { schema: successData("#/components/schemas/IntegrationSync") } },
  },
  "401": { $ref: "#/components/responses/Unauthorized" },
};

export const integrationPaths = {
  "/api/integration/status": {
    get: {
      tags: ["Priority Integration"],
      summary: "Get simulator connection status and sync summary",
      description: "Simulated status only — this project never connects to a real Priority instance.",
      security: bearerSecurity,
      responses: {
        "200": {
          description: "Status retrieved.",
          content: { "application/json": { schema: successData("#/components/schemas/IntegrationStatus") } },
        },
        "401": { $ref: "#/components/responses/Unauthorized" },
      },
    },
  },

  "/api/integration/history": {
    get: {
      tags: ["Priority Integration"],
      summary: "List past simulated sync runs",
      security: bearerSecurity,
      parameters: [
        pageParam,
        limitParam,
        { name: "entity", in: "query", schema: { type: "string", enum: ["CUSTOMER", "PRODUCT", "INVENTORY", "ORDER"] } },
        { name: "status", in: "query", schema: { type: "string", enum: ["SUCCESS", "FAILED", "PARTIAL"] } },
        { name: "sortOrder", in: "query", schema: { type: "string", enum: ["asc", "desc"], default: "desc" }, description: "Sorted by createdAt." },
      ],
      responses: {
        "200": {
          description: "History retrieved.",
          content: { "application/json": { schema: successData("#/components/schemas/IntegrationHistoryData") } },
        },
        "401": { $ref: "#/components/responses/Unauthorized" },
      },
    },
  },

  "/api/integration/sync/customers": {
    post: {
      tags: ["Priority Integration"],
      summary: "Simulate a Customer sync",
      description: "Reads real Customer rows from this app's own database and simulates sending them to Priority. No real outbound request is made.",
      security: bearerSecurity,
      responses: syncResponses,
    },
  },
  "/api/integration/sync/products": {
    post: {
      tags: ["Priority Integration"],
      summary: "Simulate a Product sync",
      description: "Reads real Product rows and simulates sending them to Priority. No real outbound request is made.",
      security: bearerSecurity,
      responses: syncResponses,
    },
  },
  "/api/integration/sync/inventory": {
    post: {
      tags: ["Priority Integration"],
      summary: "Simulate an Inventory sync",
      description:
        "Reads real stock levels and simulates sending them to Priority. Zero-quantity items are deterministically " +
        "simulated as rejected by the external system, so this call can return PARTIAL. No real outbound request is made.",
      security: bearerSecurity,
      responses: syncResponses,
    },
  },
  "/api/integration/sync/orders": {
    post: {
      tags: ["Priority Integration"],
      summary: "Simulate a Sales Order sync",
      description:
        "Reads real Order rows and simulates sending them to Priority. Cancelled orders are deterministically " +
        "simulated as excluded by the external system, so this call can return PARTIAL. No real outbound request is made.",
      security: bearerSecurity,
      responses: syncResponses,
    },
  },
  "/api/integration/sync/all": {
    post: {
      tags: ["Priority Integration"],
      summary: "Simulate a full sync (Customers, Products, Inventory, Orders)",
      description: "Runs all four entity syncs in sequence, each recorded as its own IntegrationSync row, and returns an aggregate result.",
      security: bearerSecurity,
      responses: {
        "200": {
          description: "All syncs completed.",
          content: { "application/json": { schema: successData("#/components/schemas/IntegrationSyncAllResult") } },
        },
        "401": { $ref: "#/components/responses/Unauthorized" },
      },
    },
  },
};
