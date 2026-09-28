import { z } from "zod";

const ENTITIES = ["CUSTOMER", "PRODUCT", "INVENTORY", "ORDER"] as const;
const STATUSES = ["SUCCESS", "FAILED", "PARTIAL"] as const;

export const integrationHistoryQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(10),
  entity: z.enum(ENTITIES).optional(),
  status: z.enum(STATUSES).optional(),
  sortOrder: z.enum(["asc", "desc"]).default("desc"),
});

export type IntegrationHistoryQuery = z.infer<typeof integrationHistoryQuerySchema>;
