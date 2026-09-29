import { ipAddress } from "@vercel/functions";
import type { Env } from "./env.js";

const SECURITY_HEADERS = {
  "content-type": "application/json; charset=utf-8",
  "cache-control": "no-store",
  "x-content-type-options": "nosniff",
};

export function json(body: unknown, status = 200, headers: Record<string, string> = {}): Response {
  return new Response(JSON.stringify(body), { status, headers: { ...SECURITY_HEADERS, ...headers } });
}

export const badRequest = (error: string, extra: Record<string, unknown> = {}) => json({ error, ...extra }, 400);
export const tooMany = () => json({ error: "Too many requests. Please try again in a little while." }, 429);

/** Reads a JSON body with a size cap. Returns null on anything malformed. */
export async function readJson(request: Request, maxBytes = 32_000): Promise<Record<string, unknown> | null> {
  const len = Number(request.headers.get("content-length") ?? "0");
  if (len > maxBytes) return null;
  try {
    const text = await request.text();
    if (text.length > maxBytes) return null;
    const v = JSON.parse(text) as unknown;
    return v && typeof v === "object" && !Array.isArray(v) ? (v as Record<string, unknown>) : null;
  } catch {
    return null;
  }
}

/** Vercel sets x-real-ip from the connection, so clients can't spoof it. */
export function clientIp(request: Request): string {
  return ipAddress(request) ?? request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "0.0.0.0";
}

export async function sha256(text: string): Promise<string> {
  const buf = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(text));
  return [...new Uint8Array(buf)].map((b) => b.toString(16).padStart(2, "0")).join("");
}

/** IPs are only ever stored hashed. */
export const hashIp = (request: Request) => sha256(`pfai:${clientIp(request)}`);

/**
 * Verifies a Turnstile token. Fails closed: without a secret the check only
 * passes when DEV_MODE is explicitly "true" (local development).
 */
export async function verifyTurnstile(env: Env, token: unknown, request: Request): Promise<boolean> {
  if (!env.TURNSTILE_SECRET_KEY) return env.DEV_MODE === "true";
  if (typeof token !== "string" || !token || token.length > 4096) return false;
  const form = new FormData();
  form.append("secret", env.TURNSTILE_SECRET_KEY);
  form.append("response", token);
  form.append("remoteip", clientIp(request));
  try {
    const res = await fetch("https://challenges.cloudflare.com/turnstile/v0/siteverify", { method: "POST", body: form });
    const data = (await res.json()) as { success?: boolean };
    return data.success === true;
  } catch {
    return false;
  }
}

/**
 * Fixed-window rate limit backed by the database. Returns true when the request is allowed.
 * `bucket` separates endpoints; windows are keyed by the hour.
 */
export async function rateLimit(env: Env, bucket: string, ipHash: string, limit: number, windowSeconds = 3600): Promise<boolean> {
  const window = Math.floor(Date.now() / 1000 / windowSeconds);
  const key = `${bucket}:${ipHash}:${window}`;
  try {
    const row = await env.DB.prepare(
      `INSERT INTO rate_limits (key, count, expires_at) VALUES (?1, 1, ?2)
       ON CONFLICT(key) DO UPDATE SET count = count + 1
       RETURNING count`,
    )
      .bind(key, (window + 1) * windowSeconds)
      .first<{ count: number }>();
    // Opportunistic cleanup of expired windows.
    if (Math.random() < 0.02)
      await env.DB.prepare("DELETE FROM rate_limits WHERE expires_at < ?1").bind(Math.floor(Date.now() / 1000)).run();
    return (row?.count ?? 1) <= limit;
  } catch (err) {
    console.error("rate limit check failed", err);
    return true;
  }
}
