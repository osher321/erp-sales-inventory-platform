import { bearerSecurity, limitParam, pageParam, successData } from "../shared";

const idParam = {
  name: "id",
  in: "path",
  required: true,
  schema: { type: "string" },
  description: "Order id.",
};

const orderNotFound = {
  description: "Order not found.",
  content: {
    "application/json": {
      schema: { $ref: "#/components/schemas/ErrorResponse" },
      example: { success: false, message: "Order not found" },
    },
  },
};

export const ordersPaths = {
  "/api/orders": {
    get: {
      tags: ["Orders"],
      summary: "List orders",
      description: "Paginated list with status filter, search (orderNumber/customer name/email), and sorting.",
      security: bearerSecurity,
      parameters: [
        pageParam,
        limitParam,
        {
          name: "status",
          in: "query",
          schema: {
            type: "string",
            enum: ["DRAFT", "PENDING", "CONFIRMED", "SHIPPED", "COMPLETED", "CANCELLED"],
          },
        },
        {
          name: "search",
          in: "query",
          schema: { type: "string" },
          description: "Matches orderNumber, or the customer's firstName/lastName/email.",
        },
        {
          name: "sortBy",
          in: "query",
          schema: { type: "string", enum: ["createdAt", "total", "orderNumber"] },
          description: "Defaults to createdAt.",
        },
        { name: "sortOrder", in: "query", schema: { type: "string", enum: ["asc", "desc"], default: "desc" } },
      ],
      responses: {
        "200": {
          description: "Orders retrieved.",
          content: { "application/json": { schema: successData("#/components/schemas/OrderListData") } },
        },
        "401": { $ref: "#/components/responses/Unauthorized" },
      },
    },
    post: {
      tags: ["Orders"],
      summary: "Create a sales order",
      description: [
        "Runs the entire flow in one Prisma transaction:",
        "1. Validates the request body.",
        "2. Confirms the customer exists (404 if not).",
        "3. Normalizes items: duplicate productId lines are merged by summing quantity, not rejected.",
        "4. Confirms every referenced product exists (404 naming the missing id(s) if not).",
        "5. Atomically checks and decrements stock per line (`UPDATE ... WHERE stockQuantity >= qty`), so the ",
        "   check can never race with a concurrent order for the same product.",
        "6. If ANY line has insufficient stock, the entire transaction rolls back: no Order, no OrderItems, no ",
        "   stock change (including lines already decremented earlier in this same request), no InventoryMovement.",
        "7. Otherwise: creates the Order and OrderItems (unitPrice snapshotted from the product's current price), ",
        "   computes subtotal/vatAmount(18%)/total using Prisma.Decimal end to end, and logs one ",
        "   InventoryMovement(type=SALE) per line.",
        "orderNumber (format SO-<year>-NNNN) is generated fresh per attempt and retried up to 3 times if it races ",
        "with a concurrently-created order.",
      ].join(" "),
      security: bearerSecurity,
      requestBody: {
        required: true,
        content: {
          "application/json": {
            schema: { $ref: "#/components/schemas/CreateOrderInput" },
            example: {
              customerId: "cmuktybhl0001sbm8x004uvl3",
              items: [{ productId: "cmukukkqx000bsbb4z4uu5xpt", quantity: 2 }],
            },
          },
        },
      },
      responses: {
        "201": {
          description: "Order created; stock decremented and movement(s) logged.",
          content: { "application/json": { schema: successData("#/components/schemas/Order") } },
        },
        "400": { $ref: "#/components/responses/ValidationError" },
        "401": { $ref: "#/components/responses/Unauthorized" },
        "404": {
          description: "Customer not found, or one or more products not found.",
          content: {
            "application/json": {
              schema: { $ref: "#/components/schemas/ErrorResponse" },
              examples: {
                customer: { value: { success: false, message: "Customer not found" } },
                product: { value: { success: false, message: "Product(s) not found: does-not-exist" } },
              },
            },
          },
        },
        "409": {
          description: "Insufficient stock for at least one line item. Nothing was persisted.",
          content: {
            "application/json": {
              schema: { $ref: "#/components/schemas/ErrorResponse" },
              example: {
                success: false,
                message: 'Insufficient stock for "Office Chair" (SKU: PRD-0011): requested 3, available 2',
              },
            },
          },
        },
      },
    },
  },

  "/api/orders/{id}": {
    get: {
      tags: ["Orders"],
      summary: "Get an order by id",
      description: "Returns the order with its customer, items, and each item's product.",
      security: bearerSecurity,
      parameters: [idParam],
      responses: {
        "200": {
          description: "Order found.",
          content: { "application/json": { schema: successData("#/components/schemas/Order") } },
        },
        "401": { $ref: "#/components/responses/Unauthorized" },
        "404": orderNotFound,
      },
    },
  },

  "/api/orders/{id}/status": {
    put: {
      tags: ["Orders"],
      summary: "Change an order's status",
      security: bearerSecurity,
      parameters: [idParam],
      requestBody: {
        required: true,
        content: { "application/json": { schema: { $ref: "#/components/schemas/UpdateOrderStatusInput" } } },
      },
      responses: {
        "200": {
          description: "Status updated.",
          content: { "application/json": { schema: successData("#/components/schemas/Order") } },
        },
        "400": { $ref: "#/components/responses/ValidationError" },
        "401": { $ref: "#/components/responses/Unauthorized" },
        "404": orderNotFound,
      },
    },
  },
};
