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

describe("GET /api/logs", () => {
  it("rejects unauthenticated requests", async () => {
    const res = await request(app).get("/api/logs");

    expect(res.status).toBe(401);
    expect(res.body.success).toBe(false);
  });

  it("lists logs with pagination", async () => {
    const res = await request(app).get("/api/logs?page=1&limit=5").set("Authorization", `Bearer ${token}`);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(Array.isArray(res.body.data.logs)).toBe(true);
    expect(res.body.data.pagination).toMatchObject({ page: 1, limit: 5 });
  });

  it("records a real successful API call with method, endpoint, status, timing, and caller", async () => {
    // The logged `endpoint` intentionally strips the query string (so search
    // terms/params never end up stored), so this call is identified by path +
    // method + caller rather than a marker smuggled through the query string.
    await request(app).get("/api/customers?search=irrelevant-marker").set("Authorization", `Bearer ${token}`);

    const res = await request(app)
      .get("/api/logs?method=GET&success=true&limit=50")
      .set("Authorization", `Bearer ${token}`);

    expect(res.status).toBe(200);
    const entries: Array<{ endpoint: string; statusCode: number; responseTime: number; userEmail: string | null; errorMessage: string | null }> =
      res.body.data.logs;
    const entry = entries.find((e) => e.endpoint === "/api/customers");
    expect(entry).toBeDefined();
    expect(entry!.statusCode).toBe(200);
    expect(typeof entry!.responseTime).toBe("number");
    expect(entry!.userEmail).toBe(DEMO_EMAIL);
    expect(entry!.errorMessage).toBeFalsy();
  });

  it("records a failed API call with its error message", async () => {
    await request(app).post("/api/auth/login").send({ email: DEMO_EMAIL, password: "definitely-wrong" });

    const res = await request(app)
      .get("/api/logs?success=false&method=POST&limit=5")
      .set("Authorization", `Bearer ${token}`);

    expect(res.status).toBe(200);
    const entries = res.body.data.logs;
    expect(entries.length).toBeGreaterThan(0);
    for (const entry of entries) {
      expect(entry.statusCode).toBeGreaterThanOrEqual(400);
    }
    const loginFailure = entries.find((e: { endpoint: string }) => e.endpoint === "/api/auth/login");
    expect(loginFailure).toBeDefined();
    expect(loginFailure.errorMessage).toBe("Invalid email or password");
  });

  it("never records the raw password or a JWT from the requests that generated the logs", async () => {
    const secretPassword = "super-secret-password-should-never-leak";
    await request(app).post("/api/auth/login").send({ email: DEMO_EMAIL, password: secretPassword });

    const res = await request(app).get("/api/logs?limit=100").set("Authorization", `Bearer ${token}`);
    const serialized = JSON.stringify(res.body.data.logs);

    expect(serialized).not.toContain(secretPassword);
    expect(serialized).not.toContain(token);
    expect(serialized).not.toContain("Bearer ");
  });

  it("filters by method", async () => {
    const res = await request(app).get("/api/logs?method=GET&limit=50").set("Authorization", `Bearer ${token}`);

    expect(res.status).toBe(200);
    for (const entry of res.body.data.logs) {
      expect(entry.method).toBe("GET");
    }
  });

  it("filters by success=true", async () => {
    const res = await request(app).get("/api/logs?success=true&limit=50").set("Authorization", `Bearer ${token}`);

    expect(res.status).toBe(200);
    for (const entry of res.body.data.logs) {
      expect(entry.statusCode).toBeLessThan(400);
    }
  });

  it("sorts by timestamp descending by default, then ascending when requested", async () => {
    const [descRes, ascRes] = await Promise.all([
      request(app).get("/api/logs?limit=20&sortOrder=desc").set("Authorization", `Bearer ${token}`),
      request(app).get("/api/logs?limit=20&sortOrder=asc").set("Authorization", `Bearer ${token}`),
    ]);

    const descTimes = descRes.body.data.logs.map((l: { timestamp: string }) => new Date(l.timestamp).getTime());
    const ascTimes = ascRes.body.data.logs.map((l: { timestamp: string }) => new Date(l.timestamp).getTime());

    for (let i = 1; i < descTimes.length; i++) expect(descTimes[i]).toBeLessThanOrEqual(descTimes[i - 1]);
    for (let i = 1; i < ascTimes.length; i++) expect(ascTimes[i]).toBeGreaterThanOrEqual(ascTimes[i - 1]);
  });
});
