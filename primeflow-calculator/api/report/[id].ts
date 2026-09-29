import type { SavedReport } from "../../src/lib/types.js";
import { getEnv } from "../../server/env.js";
import { json } from "../../server/http.js";
import { loadLead, loadPublicResearch, parseLead } from "../../server/reports.js";

/** GET /api/report/:id → saved report for /r/:id. Never returns the email address. */
export async function GET(request: Request): Promise<Response> {
  const env = getEnv();
  const url = new URL(request.url);
  // Vercel passes the [id] segment as ?id=; fall back to the path.
  const id = url.searchParams.get("id") ?? url.pathname.split("/").pop() ?? "";
  const row = await loadLead(env, id);
  if (!row) return json({ error: "Report not found." }, 404);
  const { inputs, results, siteScan } = parseLead(row);
  const report: SavedReport = {
    id: row.id,
    createdAt: row.created_at,
    name: row.name,
    inputs,
    results,
    diagnosis: row.diagnosis,
    siteScan,
    research: await loadPublicResearch(env, row.research_key),
  };
  return json(report);
}
