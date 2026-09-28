import "dotenv/config";
import request from "supertest";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { prisma } from "../src/config/prisma";
import app from "../src/app";

let token: string;
let testProduct: {
  id: string;
  sku: string;
  name: string;
  price: string;
  stockQuantity: number;
  minimumStock: number;
};

beforeAll(async () => {
  const res = await request(app)
    .post("/api/auth/login")
    .send({ email: "demo@example.com", password: "Demo1234!" });
  token = res.body.data.token;

  const product = await prisma.product.findUniqueOrThrow({ where: { sku: "PRD-0013" } });
  testProduct = {
    id: product.id,
    sku: product.sku,
    name: product.name,
    price: product.price.toString(),
    stockQuantity: product.stockQuantity,
    minimumStock: product.minimumStock,
  };
});

afterAll(async () => {
  await prisma.inventoryMovement.deleteMany({ where: { productId: testProduct.id } });
  await prisma.product.update({
    where: { id: testProduct.id },
    data: { stockQuantity: testProduct.stockQuantity },
  });
  await prisma.$disconnect();
});

describe("Inventory API", () => {
  it("rejects unauthenticated requests", async () => {
    const res = await request(app).get("/api/inventory");

    expect(res.status).toBe(401);
    expect(res.body.success).toBe(false);
  });

  it("lists inventory with productId, sku, productName, quantities, and computed status", async () => {
    const res = await request(app).get("/api/inventory").set("Authorization", `Bearer ${token}`);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.length).toBeGreaterThan(0);

    for (const item of res.body.data) {
      expect(item).toHaveProperty("productId");
      expect(item).toHaveProperty("sku");
      expect(item).toHaveProperty("productName");
      expect(item).toHaveProperty("stockQuantity");
      expect(item).toHaveProperty("minimumStock");
      expect(["IN_STOCK", "LOW_STOCK", "OUT_OF_STOCK"]).toContain(item.status);

      if (item.stockQuantity === 0) expect(item.status).toBe("OUT_OF_STOCK");
      else if (item.stockQuantity <= item.minimumStock) expect(item.status).toBe("LOW_STOCK");
      else expect(item.status).toBe("IN_STOCK");
    }
  });

  it("gets inventory for a single product by productId", async () => {
    const res = await request(app)
      .get(`/api/inventory/${testProduct.id}`)
      .set("Authorization", `Bearer ${token}`);

    expect(res.status).toBe(200);
    expect(res.body.data).toMatchObject({
      productId: testProduct.id,
      sku: testProduct.sku,
      productName: testProduct.name,
    });
  });

  it("returns 404 for a non-existent product", async () => {
    const res = await request(app).get("/api/inventory/does-not-exist").set("Authorization", `Bearer ${token}`);

    expect(res.status).toBe(404);
    expect(res.body).toEqual({ success: false, message: "Product not found" });
  });

  it("returns only 0 < stockQuantity <= minimumStock from /low-stock, each self-reporting status=LOW_STOCK", async () => {
    // Regression guard: this endpoint previously included zero-stock products
    // whose own `status` field said OUT_OF_STOCK — an internal contradiction
    // between the endpoint's name and its rows. Every row here must now agree.
    const res = await request(app).get("/api/inventory/low-stock").set("Authorization", `Bearer ${token}`);

    expect(res.status).toBe(200);
    expect(res.body.data.length).toBeGreaterThan(0);
    for (const item of res.body.data) {
      expect(item.stockQuantity).toBeGreaterThan(0);
      expect(item.stockQuantity).toBeLessThanOrEqual(item.minimumStock);
      expect(item.status).toBe("LOW_STOCK");
    }
  });

  it("returns only stockQuantity === 0 from /out-of-stock", async () => {
    const res = await request(app).get("/api/inventory/out-of-stock").set("Authorization", `Bearer ${token}`);

    expect(res.status).toBe(200);
    expect(res.body.data.length).toBeGreaterThan(0);
    for (const item of res.body.data) {
      expect(item.stockQuantity).toBe(0);
      expect(item.status).toBe("OUT_OF_STOCK");
    }
  });

  it("rejects a negative stockQuantity", async () => {
    const res = await request(app)
      .put(`/api/inventory/${testProduct.id}`)
      .set("Authorization", `Bearer ${token}`)
      .send({ stockQuantity: -5 });

    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
  });

  it("rejects an attempt to change catalog fields through this endpoint", async () => {
    const res = await request(app)
      .put(`/api/inventory/${testProduct.id}`)
      .set("Authorization", `Bearer ${token}`)
      .send({ stockQuantity: 50, price: 999, name: "Hacked Name" });

    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);

    const unchanged = await prisma.product.findUniqueOrThrow({ where: { id: testProduct.id } });
    expect(unchanged.name).toBe(testProduct.name);
    expect(unchanged.price.toString()).toBe(testProduct.price);
  });

  it("returns 404 when updating a non-existent product", async () => {
    const res = await request(app)
      .put("/api/inventory/does-not-exist")
      .set("Authorization", `Bearer ${token}`)
      .send({ stockQuantity: 10 });

    expect(res.status).toBe(404);
  });

  it("updates stockQuantity without touching catalog fields, and logs an InventoryMovement", async () => {
    const newQuantity = testProduct.stockQuantity + 15;

    const res = await request(app)
      .put(`/api/inventory/${testProduct.id}`)
      .set("Authorization", `Bearer ${token}`)
      .send({ stockQuantity: newQuantity, reason: "Vitest stock adjustment" });

    expect(res.status).toBe(200);
    expect(res.body.data.stockQuantity).toBe(newQuantity);

    const productRow = await prisma.product.findUniqueOrThrow({ where: { id: testProduct.id } });
    expect(productRow.stockQuantity).toBe(newQuantity);
    expect(productRow.name).toBe(testProduct.name);
    expect(productRow.sku).toBe(testProduct.sku);
    expect(productRow.price.toString()).toBe(testProduct.price);

    const movement = await prisma.inventoryMovement.findFirst({
      where: { productId: testProduct.id },
      orderBy: { createdAt: "desc" },
    });
    expect(movement).not.toBeNull();
    expect(movement!.type).toBe("ADJUSTMENT");
    expect(movement!.previousQuantity).toBe(testProduct.stockQuantity);
    expect(movement!.newQuantity).toBe(newQuantity);
    expect(movement!.quantity).toBe(Math.abs(newQuantity - testProduct.stockQuantity));
    expect(movement!.reason).toBe("Vitest stock adjustment");
  });

  it("rejects unauthenticated requests to the movements endpoint", async () => {
    const res = await request(app).get(`/api/inventory/${testProduct.id}/movements`);

    expect(res.status).toBe(401);
    expect(res.body.success).toBe(false);
  });

  it("returns 404 for movements of a non-existent product", async () => {
    const res = await request(app).get("/api/inventory/does-not-exist/movements").set("Authorization", `Bearer ${token}`);

    expect(res.status).toBe(404);
    expect(res.body).toEqual({ success: false, message: "Product not found" });
  });

  it("lists movement history for a product, most recent first", async () => {
    const res = await request(app)
      .get(`/api/inventory/${testProduct.id}/movements`)
      .set("Authorization", `Bearer ${token}`);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.length).toBeGreaterThan(0);

    const latest = res.body.data[0];
    expect(latest).toMatchObject({
      productId: testProduct.id,
      type: "ADJUSTMENT",
      reason: "Vitest stock adjustment",
    });

    const createdAtTimestamps = res.body.data.map((m: { createdAt: string }) => new Date(m.createdAt).getTime());
    for (let i = 1; i < createdAtTimestamps.length; i++) {
      expect(createdAtTimestamps[i]).toBeLessThanOrEqual(createdAtTimestamps[i - 1]);
    }
  });

  it("does not create a movement record when the quantity is unchanged", async () => {
    const before = await prisma.inventoryMovement.count({ where: { productId: testProduct.id } });

    const current = await prisma.product.findUniqueOrThrow({ where: { id: testProduct.id } });
    const res = await request(app)
      .put(`/api/inventory/${testProduct.id}`)
      .set("Authorization", `Bearer ${token}`)
      .send({ stockQuantity: current.stockQuantity });

    expect(res.status).toBe(200);

    const after = await prisma.inventoryMovement.count({ where: { productId: testProduct.id } });
    expect(after).toBe(before);
  });
});
