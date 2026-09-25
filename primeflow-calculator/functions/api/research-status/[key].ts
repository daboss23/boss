import { stripSources, type ResearchDoc } from "../../../src/lib/research";
import type { Env } from "../../_lib/env";
import { badRequest, json } from "../../_lib/http";

/** GET /api/research-status/:key → PublicResearch. Source fields are always stripped. */
export const onRequestGet: PagesFunction<Env> = async ({ params, env }) => {
  const key = decodeURIComponent(String(params.key ?? ""));
  if (!/^[a-z0-9-]+\|[a-z0-9-]+\|[A-Z]{2}(\|[a-z0-9-]+)?$/.test(key)) return badRequest("Invalid key.");
  const row = await env.DB.prepare("SELECT status, research_json FROM industry_research WHERE key = ?1")
    .bind(key)
    .first<{ status: "pending" | "ready" | "failed"; research_json: string | null }>();
  if (!row) return json({ key, status: "failed" }, 404);
  const doc = row.status === "ready" && row.research_json ? (JSON.parse(row.research_json) as ResearchDoc) : null;
  return json(stripSources(key, row.status, doc));
};
