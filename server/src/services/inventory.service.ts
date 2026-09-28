import { prisma } from "../config/prisma";
import { ApiError } from "../middleware/errorHandler";
import type { UpdateInventoryInput } from "../validators/inventory.validators";

export type InventoryStatus = "IN_STOCK" | "LOW_STOCK" | "OUT_OF_STOCK";

function computeStatus(stockQuantity: number, minimumStock: number): InventoryStatus {
  if (stockQuantity === 0) return "OUT_OF_STOCK";
  if (stockQuantity <= minimumStock) return "LOW_STOCK";
  return "IN_STOCK";
}

function toInventoryView(product: {
  id: string;
  sku: string;
  name: string;
  stockQuantity: number;
  minimumStock: number;
}) {
  return {
    productId: product.id,
    sku: product.sku,
    productName: product.name,
    stockQuantity: product.stockQuantity,
    minimumStock: product.minimumStock,
    status: computeStatus(product.stockQuantity, product.minimumStock),
  };
}

const INVENTORY_SELECT = {
  id: true,
  sku: true,
  name: true,
  stockQuantity: true,
  minimumStock: true,
} as const;

export async function listInventory() {
  const products = await prisma.product.findMany({
    select: INVENTORY_SELECT,
    orderBy: { name: "asc" },
  });
  return products.map(toInventoryView);
}

export async function getInventoryByProductId(productId: string) {
  const product = await prisma.product.findUnique({
    where: { id: productId },
    select: INVENTORY_SELECT,
  });
  if (!product) {
    throw new ApiError(404, "Product not found");
  }
  return toInventoryView(product);
}

export async function getMovementsByProductId(productId: string) {
  const product = await prisma.product.findUnique({ where: { id: productId }, select: { id: true } });
  if (!product) {
    throw new ApiError(404, "Product not found");
  }

  return prisma.inventoryMovement.findMany({
    where: { productId },
    orderBy: { createdAt: "desc" },
  });
}

// Excludes zero-stock rows so every returned item's own computed status is
// actually LOW_STOCK, never OUT_OF_STOCK — this endpoint's name and its rows'
// status must agree, and stays consistent with getOutOfStockInventory() below.
export async function getLowStockInventory() {
  const products = await prisma.$queryRaw<
    Array<{ id: string; sku: string; name: string; stockQuantity: number; minimumStock: number }>
  >`
    SELECT id, sku, name, "stockQuantity", "minimumStock"
    FROM "Product"
    WHERE "stockQuantity" > 0 AND "stockQuantity" <= "minimumStock"
    ORDER BY "stockQuantity" ASC
  `;
  return products.map(toInventoryView);
}

export async function getOutOfStockInventory() {
  const products = await prisma.product.findMany({
    where: { stockQuantity: 0 },
    select: INVENTORY_SELECT,
    orderBy: { name: "asc" },
  });
  return products.map(toInventoryView);
}

export async function updateStockQuantity(productId: string, input: UpdateInventoryInput) {
  const product = await prisma.product.findUnique({ where: { id: productId } });
  if (!product) {
    throw new ApiError(404, "Product not found");
  }

  const previousQuantity = product.stockQuantity;
  const newQuantity = input.stockQuantity;

  const updated = await prisma.$transaction(async (tx) => {
    const updatedProduct = await tx.product.update({
      where: { id: productId },
      data: { stockQuantity: newQuantity },
      select: INVENTORY_SELECT,
    });

    if (newQuantity !== previousQuantity) {
      await tx.inventoryMovement.create({
        data: {
          productId,
          type: "ADJUSTMENT",
          quantity: Math.abs(newQuantity - previousQuantity),
          previousQuantity,
          newQuantity,
          reason: input.reason ?? "Manual stock adjustment",
        },
      });
    }

    return updatedProduct;
  });

  return toInventoryView(updated);
}
