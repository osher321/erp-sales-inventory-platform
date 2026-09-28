import { z } from "zod";

export const updateInventorySchema = z
  .object({
    stockQuantity: z.number().int().min(0, "Stock quantity cannot be negative"),
    reason: z.string().min(1).optional(),
  })
  .strict();

export type UpdateInventoryInput = z.infer<typeof updateInventorySchema>;
