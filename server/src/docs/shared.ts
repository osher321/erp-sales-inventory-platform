export const bearerSecurity = [{ bearerAuth: [] as string[] }];

export function successData(dataSchemaRef: string) {
  return {
    type: "object",
    properties: {
      success: { type: "boolean", example: true },
      data: { $ref: dataSchemaRef },
    },
    required: ["success", "data"],
  };
}

export const pageParam = {
  name: "page",
  in: "query",
  schema: { type: "integer", minimum: 1, default: 1 },
  description: "1-indexed page number.",
};

export const limitParam = {
  name: "limit",
  in: "query",
  schema: { type: "integer", minimum: 1, maximum: 100, default: 10 },
  description: "Page size (max 100).",
};

export const sortOrderParam = (defaultOrder: "asc" | "desc") => ({
  name: "sortOrder",
  in: "query",
  schema: { type: "string", enum: ["asc", "desc"], default: defaultOrder },
});
