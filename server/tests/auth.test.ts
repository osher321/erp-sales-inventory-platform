import "dotenv/config";
import request from "supertest";
import { afterAll, describe, expect, it } from "vitest";
import { prisma } from "../src/config/prisma";
import app from "../src/app";

const DEMO_EMAIL = "demo@erp-platform.com";
const DEMO_PASSWORD = "Demo1234!";

describe("POST /api/auth/login", () => {
  it("logs in successfully with valid demo credentials", async () => {
    const res = await request(app).post("/api/auth/login").send({ email: DEMO_EMAIL, password: DEMO_PASSWORD });

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.token).toEqual(expect.any(String));
    expect(res.body.data.user.email).toBe(DEMO_EMAIL);
    expect(res.body.data.user.password).toBeUndefined();
    expect(res.body.data.user.passwordHash).toBeUndefined();
  });

  it("rejects an incorrect password", async () => {
    const res = await request(app).post("/api/auth/login").send({ email: DEMO_EMAIL, password: "wrong-password" });

    expect(res.status).toBe(401);
    expect(res.body).toEqual({ success: false, message: "Invalid email or password" });
  });

  it("rejects a non-existent email with the same generic message", async () => {
    const res = await request(app)
      .post("/api/auth/login")
      .send({ email: "nobody@example.com", password: "whatever123" });

    expect(res.status).toBe(401);
    expect(res.body).toEqual({ success: false, message: "Invalid email or password" });
  });

  it("rejects a malformed request body", async () => {
    const res = await request(app).post("/api/auth/login").send({ email: "not-an-email" });

    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
  });
});

afterAll(async () => {
  await prisma.$disconnect();
});
