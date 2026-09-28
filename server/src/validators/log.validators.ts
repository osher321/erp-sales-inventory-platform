import { z } from "zod";

const HTTP_METHODS = ["GET", "POST", "PUT", "PATCH", "DELETE"] as const;

export const logListQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
  search: z.string().trim().optional(),
  method: z.enum(HTTP_METHODS).optional(),
  // z.coerce.boolean() would treat the string "false" as truthy (Boolean("false") === true),
  // so the query value is matched explicitly instead.
  success: z
    .enum(["true", "false"])
    .transform((value) => value === "true")
    .optional(),
  sortOrder: z.enum(["asc", "desc"]).default("desc"),
});

export type LogListQuery = z.infer<typeof logListQuerySchema>;
