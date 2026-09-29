import { mkdtempSync, readFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { beforeAll, describe, expect, it, vi } from "vitest";
import golden from "../src/lib/__fixtures__/legacy-golden.json" with { type: "json" };

/**
 * Runs the Vercel API handlers end to end against a real SQLite file with the
 * schema from migrations/. The web client talks to Turso over HTTP; the Node
 * client has the same API and also opens local files, so it stands in here.
 */
vi.mock("@libsql/client/web", async () => await import("@libsql/client"));

const dbFile = join(mkdtempSync(join(tmpdir(), "pfai-")), "test.db");
Object.assign(process.env, { TURSO_DATABASE_URL: `file:${dbFile}`, DEV_MODE: "true", ANTHROPIC_API_KEY: "", TURNSTILE_SECRET_KEY: "" });

const inputs = { ...golden[0]!.inputs, industry: "Home Services", businessName: "Acme Plumbing" };
const post = (path: string, body: unknown, ip = "203.0.113.7") =>
  new Request(`https://example.test${path}`, {
    method: "POST",
    headers: { "content-type": "application/json", "x-real-ip": ip },
    body: JSON.stringify(body),
  });
const get = (path: string) => new Request(`https://example.test${path}`);

beforeAll(async () => {
  const { createClient } = await import("@libsql/client");
  const db = createClient({ url: `file:${dbFile}` });
  await db.executeMultiple(readFileSync("migrations/0001_init.sql", "utf8"));
  db.close();
});

describe("API on Vercel + Turso", () => {
  let reportId = "";

  it("saves a lead and recalculates results server-side", async () => {
    const { POST } = await import("../api/submit-lead.js");
    const res = await POST(post("/api/submit-lead", { name: "Sam Lee", email: "Sam@Example.com", inputs }));
    expect(res.status).toBe(200);
    const body = (await res.json()) as { reportId: string; results: { totalLeakage: number } };
    expect(body.reportId).toMatch(/^[0-9a-f-]{36}$/);
    expect(body.results.totalLeakage).toBe(golden[0]!.expected.totalLeakage);
    reportId = body.reportId;
  });

  it("serves the saved report without the email address", async () => {
    const { GET } = await import("../api/report/[id].js");
    const res = await GET(get(`/api/report/${reportId}`));
    expect(res.status).toBe(200);
    const report = (await res.json()) as Record<string, unknown>;
    expect(report.name).toBe("Sam Lee");
    expect(JSON.stringify(report)).not.toContain("example.com");
    expect((await GET(get("/api/report/not-a-uuid"))).status).toBe(404);
    // Shape Vercel uses after routing the dynamic segment.
    expect((await GET(get(`/api/report/[id]?id=${reportId}`))).status).toBe(200);
  });

  it("stores one diagnosis and returns it cached afterwards", async () => {
    const { POST } = await import("../api/ai-diagnosis.js");
    const first = (await (await POST(post("/api/ai-diagnosis", { reportId }))).json()) as { diagnosis: string; source: string };
    expect(first.source).toBe("fallback");
    expect(first.diagnosis.length).toBeGreaterThan(50);
    const second = (await (await POST(post("/api/ai-diagnosis", { reportId }))).json()) as { diagnosis: string; source: string };
    expect(second).toEqual({ diagnosis: first.diagnosis, source: "cached" });
  });

  it("rate-limits leads per IP", async () => {
    const { POST } = await import("../api/submit-lead.js");
    const statuses = [];
    for (let i = 0; i < 6; i++)
      statuses.push((await POST(post("/api/submit-lead", { name: "Sam Lee", email: "sam@example.com", inputs }, "198.51.100.9"))).status);
    expect(statuses).toEqual([200, 200, 200, 200, 200, 429]);
  });

  it("marks research failed without an API key and reports it via status", async () => {
    const { POST } = await import("../api/research-industry.js");
    const { GET } = await import("../api/research-status/[key].js");
    const res = await POST(post("/api/research-industry", { industry: "Home Services", country: "AU" }));
    const { key, status } = (await res.json()) as { key: string; status: string };
    expect(status).toBe("pending");
    await vi.waitFor(async () => {
      const s = (await (await GET(get(`/api/research-status/${encodeURIComponent(key)}`))).json()) as { status: string };
      expect(s.status).toBe("failed");
    });
    expect((await GET(get(`/api/research-status/[key]?key=${encodeURIComponent(key)}`))).status).toBe(200);
    expect((await GET(get("/api/research-status/bad%20key"))).status).toBe(400);
  });
});
