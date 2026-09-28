import "dotenv/config";
import request from "supertest";
import { afterAll, describe, expect, it } from "vitest";
import { prisma } from "../src/config/prisma";
import app from "../src/app";

const DEMO_EMAIL = "demo@example.com";
const DEMO_PASSWORD = "Demo1234!";
const uniqueSuffix = Date.now().toString();
const newUserEmail = `vitest.register.${uniqueSuffix}@example.com`;

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

describe("POST /api/auth/register", () => {
  it("registers a new user and returns a token in the same envelope shape as login", async () => {
    const res = await request(app)
      .post("/api/auth/register")
      .send({ name: "Vitest Newcomer", email: newUserEmail, password: "SecurePass123" });

    expect(res.status).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body.data.token).toEqual(expect.any(String));
    expect(res.body.data.user).toMatchObject({ email: newUserEmail, name: "Vitest Newcomer", role: "USER" });
    expect(res.body.data.user.password).toBeUndefined();
    expect(res.body.data.user.passwordHash).toBeUndefined();

    const stored = await prisma.user.findUniqueOrThrow({ where: { email: newUserEmail } });
    expect(stored.password).not.toBe("SecurePass123");
    expect(stored.password.startsWith("$2")).toBe(true); // bcrypt hash prefix
  });

  it("logs in successfully with the newly registered user's credentials", async () => {
    const res = await request(app)
      .post("/api/auth/login")
      .send({ email: newUserEmail, password: "SecurePass123" });

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.user.email).toBe(newUserEmail);
  });

  it("rejects registration with an email that is already registered", async () => {
    const res = await request(app)
      .post("/api/auth/register")
      .send({ name: "Duplicate", email: newUserEmail, password: "AnotherPass123" });

    expect(res.status).toBe(409);
    expect(res.body).toEqual({ success: false, message: "Email already registered" });
  });

  it("rejects an invalid email format", async () => {
    const res = await request(app)
      .post("/api/auth/register")
      .send({ name: "Bad Email", email: "not-an-email", password: "ValidPass123" });

    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
  });

  it("rejects a password shorter than 8 characters", async () => {
    const res = await request(app)
      .post("/api/auth/register")
      .send({ name: "Short Pass", email: `short.${uniqueSuffix}@example.com`, password: "short" });

    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
  });

  it("rejects a missing name", async () => {
    const res = await request(app)
      .post("/api/auth/register")
      .send({ email: `noname.${uniqueSuffix}@example.com`, password: "ValidPass123" });

    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
  });

  it("rejects a missing email", async () => {
    const res = await request(app)
      .post("/api/auth/register")
      .send({ name: "No Email", password: "ValidPass123" });

    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
  });

  it("rejects a missing password", async () => {
    const res = await request(app)
      .post("/api/auth/register")
      .send({ name: "No Password", email: `nopassword.${uniqueSuffix}@example.com` });

    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
  });

  it("ignores an unknown confirmPassword field rather than erroring", async () => {
    // confirmPassword is a client-side-only concept; the schema doesn't
    // declare it, so Zod strips it instead of rejecting the request.
    const res = await request(app)
      .post("/api/auth/register")
      .send({
        name: "Has Confirm Field",
        email: `hasconfirm.${uniqueSuffix}@example.com`,
        password: "ValidPass123",
        confirmPassword: "ValidPass123",
      });

    expect(res.status).toBe(201);
    expect(res.body.success).toBe(true);
  });
});

afterAll(async () => {
  await prisma.user.deleteMany({
    where: {
      email: {
        in: [
          newUserEmail,
          `short.${uniqueSuffix}@example.com`,
          `noname.${uniqueSuffix}@example.com`,
          `nopassword.${uniqueSuffix}@example.com`,
          `hasconfirm.${uniqueSuffix}@example.com`,
        ],
      },
    },
  });
  await prisma.$disconnect();
});
