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

function buildOrderBy(
  sortBy: ProductListQuery["sortBy"],
  sortOrder: ProductListQuery["sortOrder"],
): Prisma.ProductOrderByWithRelationInput {
  switch (sortBy) {
    case "price":
      return { price: sortOrder };
    case "name":
      return { name: sortOrder };
    case "stockQuantity":
      return { stockQuantity: sortOrder };
    default:
      return { createdAt: "desc" };
  }
}

export async function listProducts(params: ProductListQuery) {
  const { page, limit, search, category, sortBy, sortOrder } = params;

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
// minimumStock), so this specific lookup needs a raw SQL query.
export async function getLowStockProducts() {
  return prisma.$queryRaw<ProductRow[]>`
    SELECT * FROM "Product" WHERE "stockQuantity" <= "minimumStock" ORDER BY "stockQuantity" ASC
  `;
}

export async function getOutOfStockProducts() {
  return prisma.product.findMany({
    where: { stockQuantity: 0 },
    orderBy: { name: "asc" },
  });
}
