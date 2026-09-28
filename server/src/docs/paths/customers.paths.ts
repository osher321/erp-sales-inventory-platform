import { bearerSecurity, limitParam, pageParam, successData } from "../shared";

const idParam = {
  name: "id",
  in: "path",
  required: true,
  schema: { type: "string" },
  description: "Customer id.",
};

export const customersPaths = {
  "/api/customers": {
    get: {
      tags: ["Customers"],
      summary: "List customers",
      description: "Paginated list with optional search across customerNumber, firstName, lastName, and email.",
      security: bearerSecurity,
      parameters: [
        pageParam,
        limitParam,
        {
          name: "search",
          in: "query",
          schema: { type: "string" },
          description: "Case-insensitive substring match against customerNumber/firstName/lastName/email.",
        },
      ],
      responses: {
        "200": {
          description: "Customers retrieved.",
          content: {
            "application/json": {
              schema: successData("#/components/schemas/CustomerListData"),
            },
          },
        },
        "401": { $ref: "#/components/responses/Unauthorized" },
      },
    },
    post: {
      tags: ["Customers"],
      summary: "Create a customer",
      security: bearerSecurity,
      requestBody: {
        required: true,
        content: { "application/json": { schema: { $ref: "#/components/schemas/CustomerInput" } } },
      },
      responses: {
        "201": {
          description: "Customer created.",
          content: { "application/json": { schema: successData("#/components/schemas/Customer") } },
        },
        "400": { $ref: "#/components/responses/ValidationError" },
        "401": { $ref: "#/components/responses/Unauthorized" },
        "409": {
          description: "customerNumber or email already exists.",
          content: {
            "application/json": {
              schema: { $ref: "#/components/schemas/ErrorResponse" },
              example: { success: false, message: "Customer with this customerNumber already exists" },
            },
          },
        },
      },
    },
  },

  "/api/customers/{id}": {
    get: {
      tags: ["Customers"],
      summary: "Get a customer by id",
      security: bearerSecurity,
      parameters: [idParam],
      responses: {
        "200": {
          description: "Customer found.",
          content: { "application/json": { schema: successData("#/components/schemas/Customer") } },
        },
        "401": { $ref: "#/components/responses/Unauthorized" },
        "404": {
          description: "Customer not found.",
          content: {
            "application/json": {
              schema: { $ref: "#/components/schemas/ErrorResponse" },
              example: { success: false, message: "Customer not found" },
            },
          },
        },
      },
    },
    put: {
      tags: ["Customers"],
      summary: "Update a customer",
      description: "Partial update; at least one field must be provided.",
      security: bearerSecurity,
      parameters: [idParam],
      requestBody: {
        required: true,
        content: { "application/json": { schema: { $ref: "#/components/schemas/CustomerUpdateInput" } } },
      },
      responses: {
        "200": {
          description: "Customer updated.",
          content: { "application/json": { schema: successData("#/components/schemas/Customer") } },
        },
        "400": { $ref: "#/components/responses/ValidationError" },
        "401": { $ref: "#/components/responses/Unauthorized" },
        "404": {
          description: "Customer not found.",
          content: {
            "application/json": {
              schema: { $ref: "#/components/schemas/ErrorResponse" },
              example: { success: false, message: "Customer not found" },
            },
          },
        },
        "409": {
          description: "customerNumber or email already exists on another customer.",
          content: {
            "application/json": {
              schema: { $ref: "#/components/schemas/ErrorResponse" },
              example: { success: false, message: "Customer with this email already exists" },
            },
          },
        },
      },
    },
    delete: {
      tags: ["Customers"],
      summary: "Delete a customer",
      description: "Blocked with 409 if the customer already has orders, to preserve sales history.",
      security: bearerSecurity,
      parameters: [idParam],
      responses: {
        "200": {
          description: "Customer deleted.",
          content: {
            "application/json": {
              schema: { type: "object", properties: { success: { type: "boolean" }, data: { nullable: true } } },
              example: { success: true, data: null },
            },
          },
        },
        "401": { $ref: "#/components/responses/Unauthorized" },
        "404": {
          description: "Customer not found.",
          content: {
            "application/json": {
              schema: { $ref: "#/components/schemas/ErrorResponse" },
              example: { success: false, message: "Customer not found" },
            },
          },
        },
        "409": {
          description: "Customer has existing orders.",
          content: {
            "application/json": {
              schema: { $ref: "#/components/schemas/ErrorResponse" },
              example: { success: false, message: "Cannot delete customer with existing orders" },
            },
          },
        },
      },
    },
  },
};
