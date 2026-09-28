import "dotenv/config";
import request from "supertest";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { prisma } from "../src/config/prisma";
import app from "../src/app";

const uniqueSuffix = Date.now().toString();
const testEmail = `vitest.customer.${uniqueSuffix}@example.com`;
const testCustomerNumber = `TEST-${uniqueSuffix}`;

let token: string;
let createdCustomerId: string;

beforeAll(async () => {
  const res = await request(app)
    .post("/api/auth/login")
    .send({ email: "demo@erp-platform.com", password: "Demo1234!" });
  token = res.body.data.token;
});

afterAll(async () => {
  await prisma.customer.deleteMany({ where: { email: testEmail } });
  await prisma.$disconnect();
});

describe("Customers API", () => {
  it("rejects unauthenticated requests", async () => {
    const res = await request(app).get("/api/customers");

    expect(res.status).toBe(401);
    expect(res.body.success).toBe(false);
  });

  it("rejects requests with an invalid token", async () => {
    const res = await request(app).get("/api/customers").set("Authorization", "Bearer garbage.token.value");

    expect(res.status).toBe(401);
    expect(res.body.success).toBe(false);
  });

  it("lists customers with pagination", async () => {
    const res = await request(app).get("/api/customers?page=1&limit=5").set("Authorization", `Bearer ${token}`);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(Array.isArray(res.body.data.customers)).toBe(true);
    expect(res.body.data.pagination).toMatchObject({ page: 1, limit: 5 });
  });

  it("creates a new customer", async () => {
    const res = await request(app)
      .post("/api/customers")
      .set("Authorization", `Bearer ${token}`)
      .send({
        customerNumber: testCustomerNumber,
        firstName: "Vitest",
        lastName: "Tester",
        email: testEmail,
        phone: "+972500000000",
        address: "1 Test Street",
        city: "Tel Aviv",
      });

    expect(res.status).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body.data.email).toBe(testEmail);
    createdCustomerId = res.body.data.id;
  });

  it("rejects a duplicate customerNumber/email", async () => {
    const res = await request(app)
      .post("/api/customers")
      .set("Authorization", `Bearer ${token}`)
      .send({
        customerNumber: testCustomerNumber,
        firstName: "Dup",
        lastName: "User",
        email: testEmail,
        phone: "+972500000000",
        address: "X",
        city: "Y",
      });

    expect(res.status).toBe(409);
    expect(res.body.success).toBe(false);
  });

  it("rejects an invalid customer payload", async () => {
    const res = await request(app)
      .post("/api/customers")
      .set("Authorization", `Bearer ${token}`)
      .send({ firstName: "OnlyFirst" });

    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
  });

  it("gets a customer by id", async () => {
    const res = await request(app)
      .get(`/api/customers/${createdCustomerId}`)
      .set("Authorization", `Bearer ${token}`);

    expect(res.status).toBe(200);
    expect(res.body.data.id).toBe(createdCustomerId);
  });

  it("returns 404 for a non-existent customer", async () => {
    const res = await request(app).get("/api/customers/does-not-exist").set("Authorization", `Bearer ${token}`);

    expect(res.status).toBe(404);
    expect(res.body).toEqual({ success: false, message: "Customer not found" });
  });

  it("updates a customer", async () => {
    const res = await request(app)
      .put(`/api/customers/${createdCustomerId}`)
      .set("Authorization", `Bearer ${token}`)
      .send({ city: "Haifa" });

    expect(res.status).toBe(200);
    expect(res.body.data.city).toBe("Haifa");
  });

  it("deletes a customer", async () => {
    const res = await request(app)
      .delete(`/api/customers/${createdCustomerId}`)
      .set("Authorization", `Bearer ${token}`);

    expect(res.status).toBe(200);
    expect(res.body).toEqual({ success: true, data: null });

    const followUp = await request(app)
      .get(`/api/customers/${createdCustomerId}`)
      .set("Authorization", `Bearer ${token}`);
    expect(followUp.status).toBe(404);
  });
});
