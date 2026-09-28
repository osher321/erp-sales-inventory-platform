import "dotenv/config";
import request from "supertest";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { prisma } from "../src/config/prisma";
import app from "../src/app";

const DEMO_EMAIL = "demo@example.com";
const DEMO_PASSWORD = "Demo1234!";

let token: string;

beforeAll(async () => {
  const res = await request(app).post("/api/auth/login").send({ email: DEMO_EMAIL, password: DEMO_PASSWORD });
  token = res.body.data.token;
});

afterAll(async () => {
  await prisma.$disconnect();
});

describe("GET /api/integration/status", () => {
  it("rejects unauthenticated requests", async () => {
    const res = await request(app).get("/api/integration/status");
    expect(res.status).toBe(401);
  });

  it("returns simulated status wording, never claiming a real Priority connection", async () => {
    const res = await request(app).get("/api/integration/status").set("Authorization", `Bearer ${token}`);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.externalSystem).toBe("PRIORITY_SIMULATOR");
    expect(res.body.data.connectionStatus).toMatch(/simulat/i);
    expect(res.body.data.connectionStatus).not.toMatch(/^Connected to Priority$/i);
    expect(typeof res.body.data.totalSyncs).toBe("number");
  });
});

describe("POST /api/integration/sync/:entity — uses real DB data", () => {
  it("rejects unauthenticated sync requests", async () => {
    const res = await request(app).post("/api/integration/sync/customers");
    expect(res.status).toBe(401);
  });

  it("syncs customers using the real customer count, always SUCCESS", async () => {
    const [syncRes, customersRes] = await Promise.all([
      request(app).post("/api/integration/sync/customers").set("Authorization", `Bearer ${token}`),
      request(app).get("/api/customers?limit=1").set("Authorization", `Bearer ${token}`),
    ]);

    expect(syncRes.status).toBe(200);
    const sync = syncRes.body.data;
    expect(sync.entity).toBe("CUSTOMER");
    expect(sync.recordsProcessed).toBe(customersRes.body.data.pagination.total);
    expect(sync.recordsSucceeded).toBe(sync.recordsProcessed);
    expect(sync.recordsFailed).toBe(0);
    expect(sync.status).toBe("SUCCESS");
    expect(sync.errorMessage).toBeFalsy();
    expect(typeof sync.durationMs).toBe("number");
    expect(sync.payloadSummary).toContain("PRIORITY_SIMULATOR");
  });

  it("masks customer email/phone/address in the payload summary, never exposing real PII", async () => {
    const [syncRes, customersRes] = await Promise.all([
      request(app).post("/api/integration/sync/customers").set("Authorization", `Bearer ${token}`),
      request(app).get("/api/customers?limit=10").set("Authorization", `Bearer ${token}`),
    ]);

    const summary = syncRes.body.data.payloadSummary as string;
    expect(summary).toContain("demo@example.com");
    expect(summary).toContain("\"phone\": \"***\"");
    expect(summary).toContain("\"address\": \"***\"");

    for (const customer of customersRes.body.data.customers) {
      expect(summary).not.toContain(customer.email);
      expect(summary).not.toContain(customer.phone);
      expect(summary).not.toContain(customer.address);
    }

    // Non-sensitive fields (business id, name, city) are still shown.
    expect(summary).toMatch(/CUST-\d{4}/);
  });

  it("syncs products using the real product count, always SUCCESS", async () => {
    const [syncRes, productsRes] = await Promise.all([
      request(app).post("/api/integration/sync/products").set("Authorization", `Bearer ${token}`),
      request(app).get("/api/products?limit=1").set("Authorization", `Bearer ${token}`),
    ]);

    expect(syncRes.status).toBe(200);
    const sync = syncRes.body.data;
    expect(sync.entity).toBe("PRODUCT");
    expect(sync.recordsProcessed).toBe(productsRes.body.data.pagination.total);
    expect(sync.status).toBe("SUCCESS");
  });

  it("syncs inventory, deterministically failing zero-stock items (PARTIAL)", async () => {
    const [syncRes, outOfStockRes, allProductsRes] = await Promise.all([
      request(app).post("/api/integration/sync/inventory").set("Authorization", `Bearer ${token}`),
      request(app).get("/api/products?stockStatus=OUT_OF_STOCK&limit=1").set("Authorization", `Bearer ${token}`),
      request(app).get("/api/products?limit=1").set("Authorization", `Bearer ${token}`),
    ]);

    const outOfStockCount = outOfStockRes.body.data.pagination.total;
    const totalProducts = allProductsRes.body.data.pagination.total;

    expect(syncRes.status).toBe(200);
    const sync = syncRes.body.data;
    expect(sync.entity).toBe("INVENTORY");
    expect(sync.recordsProcessed).toBe(totalProducts);
    expect(sync.recordsFailed).toBe(outOfStockCount);
    expect(sync.recordsSucceeded).toBe(totalProducts - outOfStockCount);
    if (outOfStockCount > 0) {
      expect(sync.status).toBe("PARTIAL");
      expect(sync.errorMessage).toContain("zero-quantity");
    }
  });

  it("syncs orders, deterministically failing cancelled orders (PARTIAL)", async () => {
    const [syncRes, cancelledRes, allOrdersRes] = await Promise.all([
      request(app).post("/api/integration/sync/orders").set("Authorization", `Bearer ${token}`),
      request(app).get("/api/orders?status=CANCELLED&limit=1").set("Authorization", `Bearer ${token}`),
      request(app).get("/api/orders?limit=1").set("Authorization", `Bearer ${token}`),
    ]);

    const cancelledCount = cancelledRes.body.data.pagination.total;
    const totalOrders = allOrdersRes.body.data.pagination.total;

    expect(syncRes.status).toBe(200);
    const sync = syncRes.body.data;
    expect(sync.entity).toBe("ORDER");
    expect(sync.recordsProcessed).toBe(totalOrders);
    expect(sync.recordsFailed).toBe(cancelledCount);
    if (cancelledCount > 0) {
      expect(sync.status).toBe("PARTIAL");
      expect(sync.errorMessage).toContain("cancelled");
    }
  });

  it("does not mutate any business data (customers/products/orders unchanged by sync)", async () => {
    const before = await Promise.all([
      request(app).get("/api/customers?limit=1").set("Authorization", `Bearer ${token}`),
      request(app).get("/api/products?limit=1").set("Authorization", `Bearer ${token}`),
      request(app).get("/api/orders?limit=1").set("Authorization", `Bearer ${token}`),
    ]);

    await request(app).post("/api/integration/sync/all").set("Authorization", `Bearer ${token}`);

    const after = await Promise.all([
      request(app).get("/api/customers?limit=1").set("Authorization", `Bearer ${token}`),
      request(app).get("/api/products?limit=1").set("Authorization", `Bearer ${token}`),
      request(app).get("/api/orders?limit=1").set("Authorization", `Bearer ${token}`),
    ]);

    for (let i = 0; i < 3; i++) {
      expect(after[i].body.data.pagination.total).toBe(before[i].body.data.pagination.total);
    }
  });
});

describe("POST /api/integration/sync/all", () => {
  it("runs all four entity syncs and returns an aggregate result", async () => {
    const res = await request(app).post("/api/integration/sync/all").set("Authorization", `Bearer ${token}`);

    expect(res.status).toBe(200);
    const { data } = res.body;
    expect(data.results).toHaveLength(4);
    const entities = data.results.map((r: { entity: string }) => r.entity).sort();
    expect(entities).toEqual(["CUSTOMER", "INVENTORY", "ORDER", "PRODUCT"]);
    expect(data.recordsProcessed).toBe(data.results.reduce((sum: number, r: { recordsProcessed: number }) => sum + r.recordsProcessed, 0));
    expect(["SUCCESS", "FAILED", "PARTIAL"]).toContain(data.status);
  });
});

describe("GET /api/integration/history", () => {
  it("rejects unauthenticated requests", async () => {
    const res = await request(app).get("/api/integration/history");
    expect(res.status).toBe(401);
  });

  it("lists real sync history with pagination", async () => {
    const res = await request(app).get("/api/integration/history?page=1&limit=5").set("Authorization", `Bearer ${token}`);

    expect(res.status).toBe(200);
    expect(Array.isArray(res.body.data.syncs)).toBe(true);
    expect(res.body.data.syncs.length).toBeGreaterThan(0);
    expect(res.body.data.pagination).toMatchObject({ page: 1, limit: 5 });
  });

  it("filters by entity", async () => {
    const res = await request(app).get("/api/integration/history?entity=ORDER&limit=50").set("Authorization", `Bearer ${token}`);

    expect(res.status).toBe(200);
    for (const sync of res.body.data.syncs) {
      expect(sync.entity).toBe("ORDER");
    }
  });

  it("filters by status", async () => {
    const res = await request(app).get("/api/integration/history?status=PARTIAL&limit=50").set("Authorization", `Bearer ${token}`);

    expect(res.status).toBe(200);
    for (const sync of res.body.data.syncs) {
      expect(sync.status).toBe("PARTIAL");
    }
  });

  it("sorts by createdAt", async () => {
    const [descRes, ascRes] = await Promise.all([
      request(app).get("/api/integration/history?limit=20&sortOrder=desc").set("Authorization", `Bearer ${token}`),
      request(app).get("/api/integration/history?limit=20&sortOrder=asc").set("Authorization", `Bearer ${token}`),
    ]);

    const descTimes = descRes.body.data.syncs.map((s: { createdAt: string }) => new Date(s.createdAt).getTime());
    const ascTimes = ascRes.body.data.syncs.map((s: { createdAt: string }) => new Date(s.createdAt).getTime());

    for (let i = 1; i < descTimes.length; i++) expect(descTimes[i]).toBeLessThanOrEqual(descTimes[i - 1]);
    for (let i = 1; i < ascTimes.length; i++) expect(ascTimes[i]).toBeGreaterThanOrEqual(ascTimes[i - 1]);
  });

  it("never exposes passwords, JWTs, or Authorization headers in payload summaries", async () => {
    const res = await request(app).get("/api/integration/history?limit=100").set("Authorization", `Bearer ${token}`);
    const serialized = JSON.stringify(res.body.data.syncs);

    expect(serialized).not.toContain(token);
    expect(serialized).not.toContain("Bearer ");
    expect(serialized).not.toContain(`"${DEMO_PASSWORD}"`);
  });
});
