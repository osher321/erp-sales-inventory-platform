import { Prisma } from "@prisma/client";
import { prisma } from "../config/prisma";
import { ApiError } from "../middleware/errorHandler";
import {
  conflictFieldName,
  isForeignKeyConstraintError,
  isRecordNotFoundError,
  isUniqueConstraintError,
} from "../utils/prismaErrors";
import type { CreateProductInput, ProductListQuery, UpdateProductInput } from "../validators/product.validators";

// `id` is appended as a secondary sort key so rows with tied values (e.g.
// products seeded within the same millisecond, giving them an identical
// createdAt) still resolve to a stable, fully-reversible order between
// ascending and descending requests.
function buildOrderBy(
  sortBy: ProductListQuery["sortBy"],
  sortOrder: ProductListQuery["sortOrder"],
): Prisma.ProductOrderByWithRelationInput[] {
  switch (sortBy) {
    case "price":
      return [{ price: sortOrder }, { id: sortOrder }];
    case "name":
      return [{ name: sortOrder }, { id: sortOrder }];
    case "stockQuantity":
      return [{ stockQuantity: sortOrder }, { id: sortOrder }];
    case "createdAt":
      return [{ createdAt: sortOrder }, { id: sortOrder }];
    default:
      return [{ createdAt: "desc" }, { id: "desc" }];
  }
}

// Prisma's filter builder can't compare two columns of the same row
// (stockQuantity vs minimumStock), so LOW_STOCK/IN_STOCK are resolved via a
// raw query for matching ids first, then folded into the main paginated
// query's `where`. IN_STOCK / LOW_STOCK / OUT_OF_STOCK are mutually
// exclusive (matching the inventory service's computeStatus()), so LOW_STOCK
// explicitly excludes zero-stock rows rather than treating them as a subset.
async function resolveStockStatusIds(stockStatus: "IN_STOCK" | "LOW_STOCK"): Promise<string[]> {
  const rows = await prisma.$queryRaw<Array<{ id: string }>>(
    stockStatus === "LOW_STOCK"
      ? Prisma.sql`SELECT id FROM "Product" WHERE "stockQuantity" > 0 AND "stockQuantity" <= "minimumStock"`
      : Prisma.sql`SELECT id FROM "Product" WHERE "stockQuantity" > "minimumStock"`,
  );
  return rows.map((row) => row.id);
}

export async function listProducts(params: ProductListQuery) {
  const { page, limit, search, category, stockStatus, sortBy, sortOrder } = params;

  const where: Prisma.ProductWhereInput = {
    ...(search
      ? {
          OR: [
            { name: { contains: search, mode: "insensitive" } },
            { sku: { contains: search, mode: "insensitive" } },
          ],
        }
      : {}),
    ...(category ? { category: { equals: category, mode: "insensitive" } } : {}),
  };

  if (stockStatus === "OUT_OF_STOCK") {
    where.stockQuantity = 0;
  } else if (stockStatus === "LOW_STOCK" || stockStatus === "IN_STOCK") {
    where.id = { in: await resolveStockStatusIds(stockStatus) };
  }

  const [products, total] = await Promise.all([
    prisma.product.findMany({
      where,
      skip: (page - 1) * limit,
      take: limit,
      orderBy: buildOrderBy(sortBy, sortOrder),
    }),
    prisma.product.count({ where }),
  ]);

  return {
    products,
    pagination: { page, limit, total, totalPages: Math.max(1, Math.ceil(total / limit)) },
  };
}

export async function getProductById(id: string) {
  const product = await prisma.product.findUnique({ where: { id } });
  if (!product) {
    throw new ApiError(404, "Product not found");
  }
  return product;
}

export async function createProduct(input: CreateProductInput) {
  try {
    return await prisma.product.create({ data: input });
  } catch (err) {
    if (isUniqueConstraintError(err)) {
      throw new ApiError(409, `Product with this ${conflictFieldName(err)} already exists`);
    }
    throw err;
  }
}

export async function updateProduct(id: string, input: UpdateProductInput) {
  try {
    return await prisma.product.update({ where: { id }, data: input });
  } catch (err) {
    if (isRecordNotFoundError(err)) {
      throw new ApiError(404, "Product not found");
    }
    if (isUniqueConstraintError(err)) {
      throw new ApiError(409, `Product with this ${conflictFieldName(err)} already exists`);
    }
    throw err;
  }
}

export async function deleteProduct(id: string) {
  try {
    await prisma.product.delete({ where: { id } });
  } catch (err) {
    if (isRecordNotFoundError(err)) {
      throw new ApiError(404, "Product not found");
    }
    if (isForeignKeyConstraintError(err)) {
      throw new ApiError(409, "Cannot delete product with existing order history");
    }
    throw err;
  }
}

type ProductRow = {
  id: string;
  sku: string;
  name: string;
  description: string | null;
  category: string;
  price: Prisma.Decimal;
  stockQuantity: number;
  minimumStock: number;
  createdAt: Date;
  updatedAt: Date;
};

// Prisma's query builder cannot compare two columns of the same row (stockQuantity vs
// minimumStock), so this specific lookup needs a raw SQL query. Excludes zero-stock rows
// so "low stock" and "out of stock" stay mutually exclusive (matching /api/inventory's
// computeStatus()) — a zero-stock product is reported as out of stock, not both.
export async function getLowStockProducts() {
  return prisma.$queryRaw<ProductRow[]>`
    SELECT * FROM "Product" WHERE "stockQuantity" > 0 AND "stockQuantity" <= "minimumStock" ORDER BY "stockQuantity" ASC
  `;
}

export async function getOutOfStockProducts() {
  return prisma.product.findMany({
    where: { stockQuantity: 0 },
    orderBy: { name: "asc" },
  });
}
