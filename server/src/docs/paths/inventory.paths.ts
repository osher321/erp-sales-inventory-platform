import { bearerSecurity, successData } from "../shared";

const productIdParam = {
  name: "productId",
  in: "path",
  required: true,
  schema: { type: "string" },
  description: "Product id.",
};

const inventoryListResponse = {
  description: "Inventory items retrieved.",
  content: {
    "application/json": {
      schema: {
        type: "object",
        properties: {
          success: { type: "boolean", example: true },
          data: { type: "array", items: { $ref: "#/components/schemas/InventoryItem" } },
        },
      },
    },
  },
};

const productNotFound = {
  description: "Product not found.",
  content: {
    "application/json": {
      schema: { $ref: "#/components/schemas/ErrorResponse" },
      example: { success: false, message: "Product not found" },
    },
  },
};

export const inventoryPaths = {
  "/api/inventory": {
    get: {
      tags: ["Inventory"],
      summary: "List inventory for every product",
      description: "Returns productId, sku, productName, stockQuantity, minimumStock, and a computed status.",
      security: bearerSecurity,
      responses: {
        "200": inventoryListResponse,
        "401": { $ref: "#/components/responses/Unauthorized" },
      },
    },
  },

  "/api/inventory/low-stock": {
    get: {
      tags: ["Inventory"],
      summary: "List inventory where stockQuantity <= minimumStock",
      security: bearerSecurity,
      responses: {
        "200": inventoryListResponse,
        "401": { $ref: "#/components/responses/Unauthorized" },
      },
    },
  },

  "/api/inventory/out-of-stock": {
    get: {
      tags: ["Inventory"],
      summary: "List inventory where stockQuantity = 0",
      security: bearerSecurity,
      responses: {
        "200": inventoryListResponse,
        "401": { $ref: "#/components/responses/Unauthorized" },
      },
    },
  },

  "/api/inventory/{productId}": {
    get: {
      tags: ["Inventory"],
      summary: "Get inventory for a single product",
      security: bearerSecurity,
      parameters: [productIdParam],
      responses: {
        "200": {
          description: "Inventory item found.",
          content: { "application/json": { schema: successData("#/components/schemas/InventoryItem") } },
        },
        "401": { $ref: "#/components/responses/Unauthorized" },
        "404": productNotFound,
      },
    },
    put: {
      tags: ["Inventory"],
      summary: "Update stockQuantity for a product",
      description:
        "Updates stockQuantity only (plus an optional audit reason). Any catalog field (price, name, sku, category, ...) " +
        "in the request body is rejected with 400 rather than silently ignored. Writes the new quantity and an " +
        "InventoryMovement(type=ADJUSTMENT) row in one transaction; no movement is logged if the quantity is unchanged.",
      security: bearerSecurity,
      parameters: [productIdParam],
      requestBody: {
        required: true,
        content: { "application/json": { schema: { $ref: "#/components/schemas/InventoryUpdateInput" } } },
      },
      responses: {
        "200": {
          description: "Stock quantity updated.",
          content: { "application/json": { schema: successData("#/components/schemas/InventoryItem") } },
        },
        "400": { $ref: "#/components/responses/ValidationError" },
        "401": { $ref: "#/components/responses/Unauthorized" },
        "404": productNotFound,
      },
    },
  },

  "/api/inventory/{productId}/movements": {
    get: {
      tags: ["Inventory"],
      summary: "List inventory movement history for a product",
      description: "Returns every InventoryMovement row for the product (stock adjustments and sale deductions), most recent first.",
      security: bearerSecurity,
      parameters: [productIdParam],
      responses: {
        "200": {
          description: "Movement history retrieved.",
          content: {
            "application/json": {
              schema: {
                type: "object",
                properties: {
                  success: { type: "boolean", example: true },
                  data: { type: "array", items: { $ref: "#/components/schemas/InventoryMovement" } },
                },
              },
            },
          },
        },
        "401": { $ref: "#/components/responses/Unauthorized" },
        "404": productNotFound,
      },
    },
  },
};
