import { stripSources, type ResearchDoc } from "../../src/lib/research.js";
import { getEnv } from "../../server/env.js";
import { badRequest, json } from "../../server/http.js";

/** GET /api/research-status/:key → PublicResearch. Source fields are always stripped. */
export async function GET(request: Request): Promise<Response> {
  const env = getEnv();
  const url = new URL(request.url);
  // Vercel passes the [key] segment as ?key= (already decoded); fall back to the path.
  const key = url.searchParams.get("key") ?? decodeURIComponent(url.pathname.split("/").pop() ?? "");
  if (!/^[a-z0-9-]+\|[a-z0-9-]+\|[A-Z]{2}(\|[a-z0-9-]+)?$/.test(key)) return badRequest("Invalid key.");
  const row = await env.DB.prepare("SELECT status, research_json FROM industry_research WHERE key = ?1")
    .bind(key)
    .first<{ status: "pending" | "ready" | "failed"; research_json: string | null }>();
  if (!row) return json({ key, status: "failed" }, 404);
  const doc = row.status === "ready" && row.research_json ? (JSON.parse(row.research_json) as ResearchDoc) : null;
  return json(stripSources(key, row.status, doc));
}
