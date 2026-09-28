import "dotenv/config";
import request from "supertest";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { prisma } from "../src/config/prisma";
import app from "../src/app";

const uniqueSuffix = Date.now().toString();

let token: string;
let customer: { id: string };
let productPlenty: { id: string; sku: string; price: string; stockQuantity: number };
let productScarce: { id: string; sku: string; price: string; stockQuantity: number };
let createdOrderId: string;
let createdOrderNumber: string;

beforeAll(async () => {
  const res = await request(app)
    .post("/api/auth/login")
    .send({ email: "demo@erp-platform.com", password: "Demo1234!" });
  token = res.body.data.token;

  customer = await prisma.customer.create({
    data: {
      customerNumber: `TEST-ORD-${uniqueSuffix}`,
      firstName: "Order",
      lastName: "Tester",
      email: `order.tester.${uniqueSuffix}@example.com`,
      phone: "+972500000000",
      address: "1 Test Street",
      city: "Tel Aviv",
    },
  });

  const created = await prisma.$transaction([
    prisma.product.create({
      data: {
        sku: `TEST-ORD-A-${uniqueSuffix}`,
        name: "Order Test Widget A",
        category: "Electronics",
        price: 100.0,
        stockQuantity: 50,
        minimumStock: 5,
      },
    }),
    prisma.product.create({
      data: {
        sku: `TEST-ORD-B-${uniqueSuffix}`,
        name: "Order Test Widget B",
        category: "Electronics",
        price: 25.5,
        stockQuantity: 2,
        minimumStock: 5,
      },
    }),
  ]);

  productPlenty = { id: created[0].id, sku: created[0].sku, price: created[0].price.toString(), stockQuantity: 50 };
  productScarce = { id: created[1].id, sku: created[1].sku, price: created[1].price.toString(), stockQuantity: 2 };
});

afterAll(async () => {
  await prisma.order.deleteMany({ where: { customerId: customer.id } });
  await prisma.inventoryMovement.deleteMany({
    where: { productId: { in: [productPlenty.id, productScarce.id] } },
  });
  await prisma.product.deleteMany({ where: { id: { in: [productPlenty.id, productScarce.id] } } });
  await prisma.customer.delete({ where: { id: customer.id } });
  await prisma.$disconnect();
});

describe("Orders API", () => {
  it("rejects unauthenticated requests", async () => {
    const res = await request(app).post("/api/orders").send({});

    expect(res.status).toBe(401);
    expect(res.body.success).toBe(false);
  });

  it("rejects an order for a non-existent customer", async () => {
    const orderCountBefore = await prisma.order.count();

    const res = await request(app)
      .post("/api/orders")
      .set("Authorization", `Bearer ${token}`)
      .send({ customerId: "does-not-exist", items: [{ productId: productPlenty.id, quantity: 1 }] });

    expect(res.status).toBe(404);
    expect(res.body).toEqual({ success: false, message: "Customer not found" });
    expect(await prisma.order.count()).toBe(orderCountBefore);
  });

  it("rejects an order referencing a non-existent product", async () => {
    const res = await request(app)
      .post("/api/orders")
      .set("Authorization", `Bearer ${token}`)
      .send({ customerId: customer.id, items: [{ productId: "does-not-exist", quantity: 1 }] });

    expect(res.status).toBe(404);
    expect(res.body.message).toContain("does-not-exist");
  });

  it("rolls back everything when stock is insufficient (2 in stock, 3 ordered)", async () => {
    const orderCountBefore = await prisma.order.count();
    const plentyBefore = await prisma.product.findUniqueOrThrow({ where: { id: productPlenty.id } });
    const movementsBefore = await prisma.inventoryMovement.count({ where: { productId: productScarce.id } });

    const res = await request(app)
      .post("/api/orders")
      .set("Authorization", `Bearer ${token}`)
      .send({
        customerId: customer.id,
        items: [
          { productId: productPlenty.id, quantity: 1 },
          { productId: productScarce.id, quantity: 3 },
        ],
      });

    expect(res.status).toBe(409);
    expect(res.body.success).toBe(false);
    expect(res.body.message).toContain(productScarce.sku);

    // Nothing must have been persisted: not the order, not the (already-processed)
    // first line's stock decrement, not any movement record.
    expect(await prisma.order.count()).toBe(orderCountBefore);
    const plentyAfter = await prisma.product.findUniqueOrThrow({ where: { id: productPlenty.id } });
    expect(plentyAfter.stockQuantity).toBe(plentyBefore.stockQuantity);
    const scarceAfter = await prisma.product.findUniqueOrThrow({ where: { id: productScarce.id } });
    expect(scarceAfter.stockQuantity).toBe(2);
    expect(await prisma.inventoryMovement.count({ where: { productId: productScarce.id } })).toBe(movementsBefore);
  });

  it("creates an order, merging duplicate productId lines, with correct math and stock/movement effects", async () => {
    const res = await request(app)
      .post("/api/orders")
      .set("Authorization", `Bearer ${token}`)
      .send({
        customerId: customer.id,
        items: [
          { productId: productPlenty.id, quantity: 2 },
          { productId: productPlenty.id, quantity: 3 },
        ],
      });

    expect(res.status).toBe(201);
    expect(res.body.success).toBe(true);

    const order = res.body.data;
    expect(order.status).toBe("DRAFT");
    expect(order.items).toHaveLength(1);
    expect(order.items[0].quantity).toBe(5);
    expect(order.items[0].unitPrice).toBe("100");
    expect(order.items[0].subtotal).toBe("500");
    expect(order.subtotal).toBe("500");
    expect(order.vatAmount).toBe("90");
    expect(order.total).toBe("590");
    expect(order.customer.id).toBe(customer.id);
    expect(order.items[0].product.id).toBe(productPlenty.id);

    createdOrderId = order.id;
    createdOrderNumber = order.orderNumber;

    const productRow = await prisma.product.findUniqueOrThrow({ where: { id: productPlenty.id } });
    expect(productRow.stockQuantity).toBe(45);

    const movement = await prisma.inventoryMovement.findFirst({
      where: { productId: productPlenty.id },
      orderBy: { createdAt: "desc" },
    });
    expect(movement).not.toBeNull();
    expect(movement!.type).toBe("SALE");
    expect(movement!.quantity).toBe(5);
    expect(movement!.previousQuantity).toBe(50);
    expect(movement!.newQuantity).toBe(45);
    expect(movement!.reason).toBe(`Order ${createdOrderNumber}`);
  });

  it("gets the order by id with customer, items, and products included", async () => {
    const res = await request(app).get(`/api/orders/${createdOrderId}`).set("Authorization", `Bearer ${token}`);

    expect(res.status).toBe(200);
    expect(res.body.data.id).toBe(createdOrderId);
    expect(res.body.data.customer.id).toBe(customer.id);
    expect(res.body.data.items[0].product.sku).toBe(productPlenty.sku);
    expect(res.body.data.subtotal).toBe("500");
    expect(res.body.data.vatAmount).toBe("90");
    expect(res.body.data.total).toBe("590");
  });

  it("returns 404 for a non-existent order", async () => {
    const res = await request(app).get("/api/orders/does-not-exist").set("Authorization", `Bearer ${token}`);

    expect(res.status).toBe(404);
    expect(res.body).toEqual({ success: false, message: "Order not found" });
  });

  it("lists orders with pagination, status filter, and search", async () => {
    const paged = await request(app).get("/api/orders?page=1&limit=5").set("Authorization", `Bearer ${token}`);
    expect(paged.status).toBe(200);
    expect(paged.body.data.orders.length).toBeLessThanOrEqual(5);
    expect(paged.body.data.pagination).toMatchObject({ page: 1, limit: 5 });

    const byStatus = await request(app).get("/api/orders?status=DRAFT").set("Authorization", `Bearer ${token}`);
    expect(byStatus.status).toBe(200);
    for (const order of byStatus.body.data.orders) {
      expect(order.status).toBe("DRAFT");
    }
    expect(byStatus.body.data.orders.some((o: { id: string }) => o.id === createdOrderId)).toBe(true);

    const bySearch = await request(app)
      .get("/api/orders")
      .query({ search: createdOrderNumber })
      .set("Authorization", `Bearer ${token}`);
    expect(bySearch.status).toBe(200);
    expect(bySearch.body.data.orders.some((o: { id: string }) => o.id === createdOrderId)).toBe(true);

    const byCustomerSearch = await request(app)
      .get("/api/orders")
      .query({ search: "Tester" })
      .set("Authorization", `Bearer ${token}`);
    expect(byCustomerSearch.status).toBe(200);
    expect(byCustomerSearch.body.data.orders.some((o: { id: string }) => o.id === createdOrderId)).toBe(true);
  });

  it("sorts orders by total", async () => {
    const res = await request(app)
      .get("/api/orders?sortBy=total&sortOrder=asc&limit=100")
      .set("Authorization", `Bearer ${token}`);

    expect(res.status).toBe(200);
    const totals = res.body.data.orders.map((o: { total: string }) => Number(o.total));
    for (let i = 1; i < totals.length; i++) {
      expect(totals[i]).toBeGreaterThanOrEqual(totals[i - 1]);
    }
  });

  it("rejects an invalid status value", async () => {
    const res = await request(app)
      .put(`/api/orders/${createdOrderId}/status`)
      .set("Authorization", `Bearer ${token}`)
      .send({ status: "NOT_A_STATUS" });

    expect(res.status).toBe(400);
  });

  it("updates the order status", async () => {
    const res = await request(app)
      .put(`/api/orders/${createdOrderId}/status`)
      .set("Authorization", `Bearer ${token}`)
      .send({ status: "CONFIRMED" });

    expect(res.status).toBe(200);
    expect(res.body.data.status).toBe("CONFIRMED");
  });

  it("returns 404 when updating status on a non-existent order", async () => {
    const res = await request(app)
      .put("/api/orders/does-not-exist/status")
      .set("Authorization", `Bearer ${token}`)
      .send({ status: "CONFIRMED" });

    expect(res.status).toBe(404);
  });
});
