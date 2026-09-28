import { z } from "zod";

const ORDER_STATUSES = ["DRAFT", "PENDING", "CONFIRMED", "SHIPPED", "COMPLETED", "CANCELLED"] as const;

export const orderItemInputSchema = z.object({
  productId: z.string().min(1, "productId is required"),
  quantity: z.number().int().positive("Quantity must be greater than 0"),
});

export const createOrderSchema = z.object({
  customerId: z.string().min(1, "customerId is required"),
  items: z.array(orderItemInputSchema).min(1, "At least one item is required"),
});

export const updateOrderStatusSchema = z
  .object({
    status: z.enum(ORDER_STATUSES),
  })
  .strict();

const SORTABLE_FIELDS = ["createdAt", "total", "orderNumber"] as const;

export const orderListQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(10),
  status: z.enum(ORDER_STATUSES).optional(),
  search: z.string().trim().optional(),
  sortBy: z.enum(SORTABLE_FIELDS).optional(),
  sortOrder: z.enum(["asc", "desc"]).default("desc"),
});

export type CreateOrderInput = z.infer<typeof createOrderSchema>;
export type UpdateOrderStatusInput = z.infer<typeof updateOrderStatusSchema>;
export type OrderListQuery = z.infer<typeof orderListQuerySchema>;
export type OrderStatusValue = (typeof ORDER_STATUSES)[number];
