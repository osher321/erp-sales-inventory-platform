import { Prisma } from "@prisma/client";
import { VAT_RATE } from "../config/constants";
import { prisma } from "../config/prisma";
import { ApiError } from "../middleware/errorHandler";
import { conflictFieldName, isRecordNotFoundError, isUniqueConstraintError } from "../utils/prismaErrors";
import type { CreateOrderInput, OrderListQuery, OrderStatusValue } from "../validators/order.validators";

const ORDER_INCLUDE = {
  customer: true,
  items: { include: { product: true } },
} satisfies Prisma.OrderInclude;

function buildOrderBy(
  sortBy: OrderListQuery["sortBy"],
  sortOrder: OrderListQuery["sortOrder"],
): Prisma.OrderOrderByWithRelationInput {
  switch (sortBy) {
    case "total":
      return { total: sortOrder };
    case "orderNumber":
      return { orderNumber: sortOrder };
    default:
      return { createdAt: sortOrder };
  }
}

// Merges duplicate productId lines within the same request into a single line
// with the summed quantity, rather than rejecting the request outright.
function normalizeItems(items: CreateOrderInput["items"]) {
  const quantityByProductId = new Map<string, number>();
  for (const item of items) {
    quantityByProductId.set(item.productId, (quantityByProductId.get(item.productId) ?? 0) + item.quantity);
  }
  return Array.from(quantityByProductId.entries()).map(([productId, quantity]) => ({ productId, quantity }));
}

async function generateOrderNumber(tx: Prisma.TransactionClient): Promise<string> {
  const count = await tx.order.count();
  const year = new Date().getFullYear();
  return `SO-${year}-${String(count + 1).padStart(4, "0")}`;
}

// Atomically decrements stock only if enough is available, in one round-trip,
// so the check-then-decrement can never race with a concurrent order for the
// same product. Returns null when there isn't enough stock (the caller has
// already confirmed the product exists, so a null here means insufficient
// stock, not a missing row).
async function decrementStockAtomic(tx: Prisma.TransactionClient, productId: string, quantity: number) {
  const rows = await tx.$queryRaw<Array<{ previousQuantity: number; newQuantity: number }>>`
    UPDATE "Product"
    SET "stockQuantity" = "stockQuantity" - ${quantity}, "updatedAt" = NOW()
    WHERE id = ${productId} AND "stockQuantity" >= ${quantity}
    RETURNING ("stockQuantity" + ${quantity})::integer AS "previousQuantity", "stockQuantity" AS "newQuantity"
  `;
  return rows[0] ?? null;
}

const MAX_ORDER_NUMBER_ATTEMPTS = 3;

export async function createOrder(input: CreateOrderInput) {
  for (let attempt = 1; attempt <= MAX_ORDER_NUMBER_ATTEMPTS; attempt++) {
    try {
      return await prisma.$transaction((tx) => attemptCreateOrder(tx, input));
    } catch (err) {
      const isOrderNumberRace = isUniqueConstraintError(err) && conflictFieldName(err) === "orderNumber";
      if (isOrderNumberRace && attempt < MAX_ORDER_NUMBER_ATTEMPTS) {
        continue;
      }
      throw err;
    }
  }
  throw new ApiError(500, "Failed to generate a unique order number, please retry");
}

async function attemptCreateOrder(tx: Prisma.TransactionClient, input: CreateOrderInput) {
  const customer = await tx.customer.findUnique({ where: { id: input.customerId } });
  if (!customer) {
    throw new ApiError(404, "Customer not found");
  }

  const normalizedItems = normalizeItems(input.items);

  const products = await tx.product.findMany({
    where: { id: { in: normalizedItems.map((item) => item.productId) } },
  });
  const productById = new Map(products.map((product) => [product.id, product]));

  const missingProductIds = normalizedItems
    .map((item) => item.productId)
    .filter((productId) => !productById.has(productId));
  if (missingProductIds.length > 0) {
    throw new ApiError(404, `Product(s) not found: ${missingProductIds.join(", ")}`);
  }

  const lineItems: {
    productId: string;
    quantity: number;
    unitPrice: Prisma.Decimal;
    subtotal: Prisma.Decimal;
    previousQuantity: number;
    newQuantity: number;
  }[] = [];

  for (const { productId, quantity } of normalizedItems) {
    const product = productById.get(productId)!;
    const decremented = await decrementStockAtomic(tx, productId, quantity);
    if (!decremented) {
      throw new ApiError(
        409,
        `Insufficient stock for "${product.name}" (SKU: ${product.sku}): requested ${quantity}, available ${product.stockQuantity}`,
      );
    }

    lineItems.push({
      productId,
      quantity,
      unitPrice: product.price,
      subtotal: product.price.mul(quantity),
      previousQuantity: decremented.previousQuantity,
      newQuantity: decremented.newQuantity,
    });
  }

  const subtotal = lineItems.reduce((sum, item) => sum.add(item.subtotal), new Prisma.Decimal(0));
  const vatAmount = subtotal.mul(VAT_RATE).toDecimalPlaces(2);
  const total = subtotal.add(vatAmount);

  const orderNumber = await generateOrderNumber(tx);

  const order = await tx.order.create({
    data: {
      orderNumber,
      customerId: input.customerId,
      subtotal,
      vatAmount,
      total,
      items: {
        create: lineItems.map((item) => ({
          productId: item.productId,
          quantity: item.quantity,
          unitPrice: item.unitPrice,
          subtotal: item.subtotal,
        })),
      },
    },
    include: ORDER_INCLUDE,
  });

  await tx.inventoryMovement.createMany({
    data: lineItems.map((item) => ({
      productId: item.productId,
      type: "SALE" as const,
      quantity: item.quantity,
      previousQuantity: item.previousQuantity,
      newQuantity: item.newQuantity,
      reason: `Order ${orderNumber}`,
    })),
  });

  return order;
}

export async function listOrders(params: OrderListQuery) {
  const { page, limit, status, search, sortBy, sortOrder } = params;

  const where: Prisma.OrderWhereInput = {
    ...(status ? { status } : {}),
    ...(search
      ? {
          OR: [
            { orderNumber: { contains: search, mode: "insensitive" } },
            { customer: { firstName: { contains: search, mode: "insensitive" } } },
            { customer: { lastName: { contains: search, mode: "insensitive" } } },
            { customer: { email: { contains: search, mode: "insensitive" } } },
          ],
        }
      : {}),
  };

  const [orders, total] = await Promise.all([
    prisma.order.findMany({
      where,
      skip: (page - 1) * limit,
      take: limit,
      orderBy: buildOrderBy(sortBy, sortOrder),
      include: { customer: true },
    }),
    prisma.order.count({ where }),
  ]);

  return {
    orders,
    pagination: { page, limit, total, totalPages: Math.max(1, Math.ceil(total / limit)) },
  };
}

export async function getOrderById(id: string) {
  const order = await prisma.order.findUnique({ where: { id }, include: ORDER_INCLUDE });
  if (!order) {
    throw new ApiError(404, "Order not found");
  }
  return order;
}

export async function updateOrderStatus(id: string, status: OrderStatusValue) {
  try {
    return await prisma.order.update({
      where: { id },
      data: { status },
      include: ORDER_INCLUDE,
    });
  } catch (err) {
    if (isRecordNotFoundError(err)) {
      throw new ApiError(404, "Order not found");
    }
    throw err;
  }
}
