import { bearerSecurity, limitParam, pageParam, successData } from "../shared";

const idParam = {
  name: "id",
  in: "path",
  required: true,
  schema: { type: "string" },
  description: "Product id.",
};

const notFound = (example: string) => ({
  description: "Product not found.",
  content: {
    "application/json": {
      schema: { $ref: "#/components/schemas/ErrorResponse" },
      example: { success: false, message: example },
    },
  },
});

export const productsPaths = {
  "/api/products": {
    get: {
      tags: ["Products"],
      summary: "List products",
      description: "Paginated list with search (name/SKU), category filter, and sorting.",
      security: bearerSecurity,
      parameters: [
        pageParam,
        limitParam,
        { name: "search", in: "query", schema: { type: "string" }, description: "Matches against name or SKU." },
        { name: "category", in: "query", schema: { type: "string" }, description: "Exact category match (case-insensitive)." },
        {
          name: "sortBy",
          in: "query",
          schema: { type: "string", enum: ["price", "name", "stockQuantity"] },
          description: "Defaults to createdAt desc when omitted.",
        },
        { name: "sortOrder", in: "query", schema: { type: "string", enum: ["asc", "desc"], default: "asc" } },
      ],
      responses: {
        "200": {
          description: "Products retrieved.",
          content: { "application/json": { schema: successData("#/components/schemas/ProductListData") } },
        },
        "401": { $ref: "#/components/responses/Unauthorized" },
      },
    },
    post: {
      tags: ["Products"],
      summary: "Create a product",
      security: bearerSecurity,
      requestBody: {
        required: true,
        content: { "application/json": { schema: { $ref: "#/components/schemas/ProductInput" } } },
      },
      responses: {
        "201": {
          description: "Product created.",
          content: { "application/json": { schema: successData("#/components/schemas/Product") } },
        },
        "400": { $ref: "#/components/responses/ValidationError" },
        "401": { $ref: "#/components/responses/Unauthorized" },
        "409": {
          description: "SKU already exists.",
          content: {
            "application/json": {
              schema: { $ref: "#/components/schemas/ErrorResponse" },
              example: { success: false, message: "Product with this sku already exists" },
            },
          },
        },
      },
    },
  },

  "/api/products/low-stock": {
    get: {
      tags: ["Products"],
      summary: "List products where stockQuantity <= minimumStock",
      security: bearerSecurity,
      responses: {
        "200": {
          description: "Low-stock products retrieved.",
          content: {
            "application/json": {
              schema: {
                type: "object",
                properties: {
                  success: { type: "boolean", example: true },
                  data: { type: "array", items: { $ref: "#/components/schemas/Product" } },
                },
              },
            },
          },
        },
        "401": { $ref: "#/components/responses/Unauthorized" },
      },
    },
  },

  "/api/products/out-of-stock": {
    get: {
      tags: ["Products"],
      summary: "List products where stockQuantity = 0",
      security: bearerSecurity,
      responses: {
        "200": {
          description: "Out-of-stock products retrieved.",
          content: {
            "application/json": {
              schema: {
                type: "object",
                properties: {
                  success: { type: "boolean", example: true },
                  data: { type: "array", items: { $ref: "#/components/schemas/Product" } },
                },
              },
            },
          },
        },
        "401": { $ref: "#/components/responses/Unauthorized" },
      },
    },
  },

  "/api/products/{id}": {
    get: {
      tags: ["Products"],
      summary: "Get a product by id",
      security: bearerSecurity,
      parameters: [idParam],
      responses: {
        "200": {
          description: "Product found.",
          content: { "application/json": { schema: successData("#/components/schemas/Product") } },
        },
        "401": { $ref: "#/components/responses/Unauthorized" },
        "404": notFound("Product not found"),
      },
    },
    put: {
      tags: ["Products"],
      summary: "Update a product",
      description: "Partial update; at least one field must be provided.",
      security: bearerSecurity,
      parameters: [idParam],
      requestBody: {
        required: true,
        content: { "application/json": { schema: { $ref: "#/components/schemas/ProductUpdateInput" } } },
      },
      responses: {
        "200": {
          description: "Product updated.",
          content: { "application/json": { schema: successData("#/components/schemas/Product") } },
        },
        "400": { $ref: "#/components/responses/ValidationError" },
        "401": { $ref: "#/components/responses/Unauthorized" },
        "404": notFound("Product not found"),
        "409": {
          description: "SKU already exists on another product.",
          content: {
            "application/json": {
              schema: { $ref: "#/components/schemas/ErrorResponse" },
              example: { success: false, message: "Product with this sku already exists" },
            },
          },
        },
      },
    },
    delete: {
      tags: ["Products"],
      summary: "Delete a product",
      description: "Blocked with 409 if the product is referenced by any OrderItem, to preserve sales history.",
      security: bearerSecurity,
      parameters: [idParam],
      responses: {
        "200": {
          description: "Product deleted.",
          content: {
            "application/json": {
              schema: { type: "object", properties: { success: { type: "boolean" }, data: { nullable: true } } },
              example: { success: true, data: null },
            },
          },
        },
        "401": { $ref: "#/components/responses/Unauthorized" },
        "404": notFound("Product not found"),
        "409": {
          description: "Product has existing order history.",
          content: {
            "application/json": {
              schema: { $ref: "#/components/schemas/ErrorResponse" },
              example: { success: false, message: "Cannot delete product with existing order history" },
            },
          },
        },
      },
    },
  },
};
