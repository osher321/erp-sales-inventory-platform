export const schemas = {
  ErrorResponse: {
    type: "object",
    properties: {
      success: { type: "boolean", example: false },
      message: { type: "string", example: "Resource not found" },
    },
    required: ["success", "message"],
  },

  Pagination: {
    type: "object",
    properties: {
      page: { type: "integer", example: 1 },
      limit: { type: "integer", example: 10 },
      total: { type: "integer", example: 42 },
      totalPages: { type: "integer", example: 5 },
    },
    required: ["page", "limit", "total", "totalPages"],
  },

  User: {
    type: "object",
    description: "Public user shape — never includes the password hash.",
    properties: {
      id: { type: "string", example: "cmuktybhc0000sbm8a38dmap0" },
      email: { type: "string", format: "email", example: "demo@erp-platform.com" },
      name: { type: "string", example: "Demo Admin" },
      role: { type: "string", enum: ["ADMIN", "USER"], example: "ADMIN" },
    },
    required: ["id", "email", "name", "role"],
  },

  AuthData: {
    type: "object",
    properties: {
      token: { type: "string", description: "JWT access token", example: "eyJhbGciOiJIUzI1NiIs..." },
      user: { $ref: "#/components/schemas/User" },
    },
    required: ["token", "user"],
  },

  Customer: {
    type: "object",
    properties: {
      id: { type: "string", example: "cmuktybia000asbm8dcl696lz" },
      customerNumber: { type: "string", example: "CUST-0001" },
      firstName: { type: "string", example: "Jane" },
      lastName: { type: "string", example: "Doe" },
      email: { type: "string", format: "email", example: "jane.doe@example.com" },
      phone: { type: "string", example: "+972501234567" },
      address: { type: "string", example: "1 Main Street" },
      city: { type: "string", example: "Tel Aviv" },
      createdAt: { type: "string", format: "date-time" },
      updatedAt: { type: "string", format: "date-time" },
    },
    required: [
      "id",
      "customerNumber",
      "firstName",
      "lastName",
      "email",
      "phone",
      "address",
      "city",
      "createdAt",
      "updatedAt",
    ],
  },

  CustomerInput: {
    type: "object",
    properties: {
      customerNumber: { type: "string", minLength: 1, example: "CUST-0011" },
      firstName: { type: "string", minLength: 1, example: "Jane" },
      lastName: { type: "string", minLength: 1, example: "Doe" },
      email: { type: "string", format: "email", example: "jane.doe@example.com" },
      phone: { type: "string", minLength: 1, example: "+972501234567" },
      address: { type: "string", minLength: 1, example: "1 Main Street" },
      city: { type: "string", minLength: 1, example: "Tel Aviv" },
    },
    required: ["customerNumber", "firstName", "lastName", "email", "phone", "address", "city"],
  },

  CustomerListData: {
    type: "object",
    properties: {
      customers: { type: "array", items: { $ref: "#/components/schemas/Customer" } },
      pagination: { $ref: "#/components/schemas/Pagination" },
    },
    required: ["customers", "pagination"],
  },

  CustomerUpdateInput: {
    type: "object",
    description: "All fields optional; at least one must be provided.",
    properties: {
      customerNumber: { type: "string", minLength: 1 },
      firstName: { type: "string", minLength: 1 },
      lastName: { type: "string", minLength: 1 },
      email: { type: "string", format: "email" },
      phone: { type: "string", minLength: 1 },
      address: { type: "string", minLength: 1 },
      city: { type: "string", minLength: 1 },
    },
  },

  Product: {
    type: "object",
    properties: {
      id: { type: "string", example: "cmukukkqx000bsbb4z4uu5xpt" },
      sku: { type: "string", example: "PRD-0001" },
      name: { type: "string", example: "Wireless Optical Mouse" },
      description: { type: "string", nullable: true, example: "Ergonomic wireless mouse with adjustable DPI." },
      category: { type: "string", example: "Electronics" },
      price: { type: "string", description: "Decimal serialized as a string.", example: "49.99" },
      stockQuantity: { type: "integer", example: 100 },
      minimumStock: { type: "integer", example: 10 },
      createdAt: { type: "string", format: "date-time" },
      updatedAt: { type: "string", format: "date-time" },
    },
    required: [
      "id",
      "sku",
      "name",
      "category",
      "price",
      "stockQuantity",
      "minimumStock",
      "createdAt",
      "updatedAt",
    ],
  },

  ProductInput: {
    type: "object",
    properties: {
      sku: { type: "string", minLength: 1, example: "PRD-0021" },
      name: { type: "string", minLength: 1, example: "USB-C Hub" },
      description: { type: "string", example: "7-port USB-C hub." },
      category: { type: "string", minLength: 1, example: "Electronics" },
      price: { type: "number", minimum: 0, example: 49.99 },
      stockQuantity: { type: "integer", minimum: 0, example: 100 },
      minimumStock: { type: "integer", minimum: 0, example: 10 },
    },
    required: ["sku", "name", "category", "price", "stockQuantity", "minimumStock"],
  },

  ProductListData: {
    type: "object",
    properties: {
      products: { type: "array", items: { $ref: "#/components/schemas/Product" } },
      pagination: { $ref: "#/components/schemas/Pagination" },
    },
    required: ["products", "pagination"],
  },

  ProductUpdateInput: {
    type: "object",
    description: "All fields optional; at least one must be provided.",
    properties: {
      sku: { type: "string", minLength: 1 },
      name: { type: "string", minLength: 1 },
      description: { type: "string" },
      category: { type: "string", minLength: 1 },
      price: { type: "number", minimum: 0 },
      stockQuantity: { type: "integer", minimum: 0 },
      minimumStock: { type: "integer", minimum: 0 },
    },
  },

  InventoryItem: {
    type: "object",
    properties: {
      productId: { type: "string", example: "cmukukkqx000bsbb4z4uu5xpt" },
      sku: { type: "string", example: "PRD-0001" },
      productName: { type: "string", example: "Wireless Optical Mouse" },
      stockQuantity: { type: "integer", example: 0 },
      minimumStock: { type: "integer", example: 12 },
      status: {
        type: "string",
        enum: ["IN_STOCK", "LOW_STOCK", "OUT_OF_STOCK"],
        description: "Always computed from stockQuantity vs minimumStock; never stored.",
        example: "OUT_OF_STOCK",
      },
    },
    required: ["productId", "sku", "productName", "stockQuantity", "minimumStock", "status"],
  },

  InventoryUpdateInput: {
    type: "object",
    description: "Updates stockQuantity only. Any other field (price, name, sku, ...) is rejected with 400.",
    properties: {
      stockQuantity: { type: "integer", minimum: 0, example: 75 },
      reason: { type: "string", minLength: 1, example: "Manual stocktake correction" },
    },
    required: ["stockQuantity"],
  },

  OrderItemLine: {
    type: "object",
    properties: {
      id: { type: "string", example: "cmuktybhl0003sbm8x004uvl9" },
      orderId: { type: "string" },
      productId: { type: "string" },
      quantity: { type: "integer", example: 2 },
      unitPrice: { type: "string", description: "Decimal, price at the time the order was placed.", example: "49.99" },
      subtotal: { type: "string", description: "Decimal: unitPrice * quantity.", example: "99.98" },
      product: { $ref: "#/components/schemas/Product" },
    },
    required: ["id", "orderId", "productId", "quantity", "unitPrice", "subtotal"],
  },

  OrderItemInput: {
    type: "object",
    properties: {
      productId: { type: "string", example: "cmukukkqx000bsbb4z4uu5xpt" },
      quantity: { type: "integer", minimum: 1, example: 2 },
    },
    required: ["productId", "quantity"],
  },

  Order: {
    type: "object",
    properties: {
      id: { type: "string", example: "cmuktybhl0001sbm8x004uvl3" },
      orderNumber: { type: "string", example: "SO-2026-0016" },
      customerId: { type: "string" },
      status: {
        type: "string",
        enum: ["DRAFT", "PENDING", "CONFIRMED", "SHIPPED", "COMPLETED", "CANCELLED"],
        example: "DRAFT",
      },
      subtotal: { type: "string", description: "Decimal: sum of item subtotals.", example: "500.00" },
      vatAmount: { type: "string", description: "Decimal: subtotal * 18%, rounded to 2 decimal places.", example: "90.00" },
      total: { type: "string", description: "Decimal: subtotal + vatAmount.", example: "590.00" },
      createdAt: { type: "string", format: "date-time" },
      updatedAt: { type: "string", format: "date-time" },
      customer: { $ref: "#/components/schemas/Customer" },
      items: { type: "array", items: { $ref: "#/components/schemas/OrderItemLine" } },
    },
    required: [
      "id",
      "orderNumber",
      "customerId",
      "status",
      "subtotal",
      "vatAmount",
      "total",
      "createdAt",
      "updatedAt",
    ],
  },

  OrderListData: {
    type: "object",
    properties: {
      orders: { type: "array", items: { $ref: "#/components/schemas/Order" } },
      pagination: { $ref: "#/components/schemas/Pagination" },
    },
    required: ["orders", "pagination"],
  },

  CreateOrderInput: {
    type: "object",
    properties: {
      customerId: { type: "string", example: "cmuktybhl0001sbm8x004uvl3" },
      items: {
        type: "array",
        minItems: 1,
        items: { $ref: "#/components/schemas/OrderItemInput" },
        description: "Duplicate productId lines are merged by summing their quantities, not rejected.",
      },
    },
    required: ["customerId", "items"],
  },

  UpdateOrderStatusInput: {
    type: "object",
    properties: {
      status: {
        type: "string",
        enum: ["DRAFT", "PENDING", "CONFIRMED", "SHIPPED", "COMPLETED", "CANCELLED"],
        example: "CONFIRMED",
      },
    },
    required: ["status"],
  },
} as const;
