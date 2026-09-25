import type { SavedReport } from "../../../src/lib/types";
import type { Env } from "../../_lib/env";
import { json } from "../../_lib/http";
import { loadLead, loadPublicResearch, parseLead } from "../../_lib/reports";

/** GET /api/report/:id → saved report for /r/:id. Never returns the email address. */
export const onRequestGet: PagesFunction<Env> = async ({ params, env }) => {
  const id = String(params.id ?? "");
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
};
