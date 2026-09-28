import "dotenv/config";
import request from "supertest";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { prisma } from "../src/config/prisma";
import app from "../src/app";

const uniqueSuffix = Date.now().toString();
const testSku = `TEST-${uniqueSuffix}`;

let token: string;
let createdProductId: string;
let baselineTotal: number;

beforeAll(async () => {
  const res = await request(app)
    .post("/api/auth/login")
    .send({ email: "demo@erp-platform.com", password: "Demo1234!" });
  token = res.body.data.token;

  baselineTotal = await prisma.product.count();
});

afterAll(async () => {
  await prisma.product.deleteMany({ where: { sku: testSku } });
  await prisma.$disconnect();
});

describe("Products API", () => {
  it("rejects unauthenticated requests", async () => {
    const res = await request(app).get("/api/products");

    expect(res.status).toBe(401);
    expect(res.body.success).toBe(false);
  });

  it("lists products with pagination", async () => {
    const res = await request(app).get("/api/products?page=1&limit=5").set("Authorization", `Bearer ${token}`);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.products.length).toBeLessThanOrEqual(5);
    expect(res.body.data.pagination).toMatchObject({ page: 1, limit: 5, total: baselineTotal });
  });

  it("searches by SKU and by name", async () => {
    const bySku = await request(app).get("/api/products?search=PRD-0001").set("Authorization", `Bearer ${token}`);
    expect(bySku.status).toBe(200);
    expect(bySku.body.data.products.some((p: { sku: string }) => p.sku === "PRD-0001")).toBe(true);

    const byName = await request(app)
      .get("/api/products")
      .query({ search: "Wireless Optical Mouse" })
      .set("Authorization", `Bearer ${token}`);
    expect(byName.status).toBe(200);
    expect(byName.body.data.products.some((p: { name: string }) => p.name === "Wireless Optical Mouse")).toBe(true);
  });

  it("filters by category", async () => {
    const res = await request(app).get("/api/products?category=Electronics").set("Authorization", `Bearer ${token}`);

    expect(res.status).toBe(200);
    expect(res.body.data.products.length).toBeGreaterThan(0);
    for (const product of res.body.data.products) {
      expect(product.category).toBe("Electronics");
    }
  });

  it("sorts by price ascending", async () => {
    const res = await request(app)
      .get("/api/products?sortBy=price&sortOrder=asc&limit=100")
      .set("Authorization", `Bearer ${token}`);

    expect(res.status).toBe(200);
    const prices = res.body.data.products.map((p: { price: string }) => Number(p.price));
    for (let i = 1; i < prices.length; i++) {
      expect(prices[i]).toBeGreaterThanOrEqual(prices[i - 1]);
    }
  });

  it("sorts by name descending as the exact reverse of ascending", async () => {
    const [ascRes, descRes] = await Promise.all([
      request(app).get("/api/products?sortBy=name&sortOrder=asc&limit=100").set("Authorization", `Bearer ${token}`),
      request(app).get("/api/products?sortBy=name&sortOrder=desc&limit=100").set("Authorization", `Bearer ${token}`),
    ]);

    expect(ascRes.status).toBe(200);
    expect(descRes.status).toBe(200);

    const ascNames = ascRes.body.data.products.map((p: { name: string }) => p.name);
    const descNames = descRes.body.data.products.map((p: { name: string }) => p.name);
    expect(descNames).toEqual([...ascNames].reverse());
  });

  it("returns products where stockQuantity <= minimumStock from /low-stock", async () => {
    const res = await request(app).get("/api/products/low-stock").set("Authorization", `Bearer ${token}`);

    expect(res.status).toBe(200);
    expect(res.body.data.length).toBeGreaterThan(0);
    for (const product of res.body.data) {
      expect(product.stockQuantity).toBeLessThanOrEqual(product.minimumStock);
    }
  });

  it("returns only stockQuantity === 0 products from /out-of-stock", async () => {
    const res = await request(app).get("/api/products/out-of-stock").set("Authorization", `Bearer ${token}`);

    expect(res.status).toBe(200);
    expect(res.body.data.length).toBeGreaterThan(0);
    for (const product of res.body.data) {
      expect(product.stockQuantity).toBe(0);
    }
  });

  it("creates a new product", async () => {
    const res = await request(app)
      .post("/api/products")
      .set("Authorization", `Bearer ${token}`)
      .send({
        sku: testSku,
        name: "Vitest Test Widget",
        description: "Created by the automated test suite",
        category: "Electronics",
        price: 49.99,
        stockQuantity: 100,
        minimumStock: 10,
      });

    expect(res.status).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body.data.sku).toBe(testSku);
    createdProductId = res.body.data.id;
  });

  it("rejects a duplicate SKU", async () => {
    const res = await request(app)
      .post("/api/products")
      .set("Authorization", `Bearer ${token}`)
      .send({
        sku: testSku,
        name: "Duplicate",
        category: "Electronics",
        price: 1,
        stockQuantity: 1,
        minimumStock: 1,
      });

    expect(res.status).toBe(409);
    expect(res.body.success).toBe(false);
  });

  it("rejects a negative price", async () => {
    const res = await request(app)
      .post("/api/products")
      .set("Authorization", `Bearer ${token}`)
      .send({ sku: `${testSku}-neg-price`, name: "Bad", category: "Electronics", price: -5, stockQuantity: 1, minimumStock: 1 });

    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
  });

  it("rejects a negative stockQuantity", async () => {
    const res = await request(app)
      .post("/api/products")
      .set("Authorization", `Bearer ${token}`)
      .send({ sku: `${testSku}-neg-stock`, name: "Bad", category: "Electronics", price: 5, stockQuantity: -1, minimumStock: 1 });

    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
  });

  it("rejects a negative minimumStock", async () => {
    const res = await request(app)
      .post("/api/products")
      .set("Authorization", `Bearer ${token}`)
      .send({ sku: `${testSku}-neg-min`, name: "Bad", category: "Electronics", price: 5, stockQuantity: 1, minimumStock: -1 });

    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
  });

  it("gets a product by id", async () => {
    const res = await request(app).get(`/api/products/${createdProductId}`).set("Authorization", `Bearer ${token}`);

    expect(res.status).toBe(200);
    expect(res.body.data.id).toBe(createdProductId);
  });

  it("returns 404 for a non-existent product", async () => {
    const res = await request(app).get("/api/products/does-not-exist").set("Authorization", `Bearer ${token}`);

    expect(res.status).toBe(404);
    expect(res.body).toEqual({ success: false, message: "Product not found" });
  });

  it("updates a product", async () => {
    const res = await request(app)
      .put(`/api/products/${createdProductId}`)
      .set("Authorization", `Bearer ${token}`)
      .send({ price: 39.99 });

    expect(res.status).toBe(200);
    expect(Number(res.body.data.price)).toBe(39.99);
  });

  it("refuses to delete a product that already has order history", async () => {
    const orderItem = await prisma.orderItem.findFirst();
    expect(orderItem).not.toBeNull();

    const res = await request(app)
      .delete(`/api/products/${orderItem!.productId}`)
      .set("Authorization", `Bearer ${token}`);

    expect(res.status).toBe(409);
    expect(res.body).toEqual({ success: false, message: "Cannot delete product with existing order history" });
  });

  it("deletes a product with no order history", async () => {
    const res = await request(app)
      .delete(`/api/products/${createdProductId}`)
      .set("Authorization", `Bearer ${token}`);

    expect(res.status).toBe(200);
    expect(res.body).toEqual({ success: true, data: null });

    const followUp = await request(app)
      .get(`/api/products/${createdProductId}`)
      .set("Authorization", `Bearer ${token}`);
    expect(followUp.status).toBe(404);
  });
});
