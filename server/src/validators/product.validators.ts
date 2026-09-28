import { z } from "zod";

export const createProductSchema = z.object({
  sku: z.string().min(1, "SKU is required"),
  name: z.string().min(1, "Name is required"),
  description: z.string().optional(),
  category: z.string().min(1, "Category is required"),
  price: z.number().min(0, "Price cannot be negative"),
  stockQuantity: z.number().int().min(0, "Stock quantity cannot be negative"),
  minimumStock: z.number().int().min(0, "Minimum stock cannot be negative"),
});

export const updateProductSchema = createProductSchema
  .partial()
  .refine((data) => Object.keys(data).length > 0, {
    message: "At least one field must be provided",
  });

const SORTABLE_FIELDS = ["price", "name", "stockQuantity", "createdAt"] as const;
const STOCK_STATUSES = ["IN_STOCK", "LOW_STOCK", "OUT_OF_STOCK"] as const;

export const productListQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(10),
  search: z.string().trim().optional(),
  category: z.string().trim().optional(),
  stockStatus: z.enum(STOCK_STATUSES).optional(),
  sortBy: z.enum(SORTABLE_FIELDS).optional(),
  sortOrder: z.enum(["asc", "desc"]).default("asc"),
});

export type CreateProductInput = z.infer<typeof createProductSchema>;
export type UpdateProductInput = z.infer<typeof updateProductSchema>;
export type ProductListQuery = z.infer<typeof productListQuerySchema>;
export type SortableField = (typeof SORTABLE_FIELDS)[number];
export type StockStatusValue = (typeof STOCK_STATUSES)[number];
