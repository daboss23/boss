import type { CalculatorInputs, CalculatorResults, PublicResearch, SiteScan } from "../../src/lib/types";
import { stripSources, type ResearchDoc } from "../../src/lib/research";
import type { Env } from "./env";

export interface LeadRow {
  id: string;
  created_at: string;
  name: string;
  email: string;
  inputs_json: string;
  results_json: string;
  diagnosis: string | null;
  site_scan_json: string | null;
  research_key: string | null;
}

export const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export async function loadLead(env: Env, id: string): Promise<LeadRow | null> {
  if (!UUID_RE.test(id)) return null;
  return env.DB.prepare(
    "SELECT id, created_at, name, email, inputs_json, results_json, diagnosis, site_scan_json, research_key FROM leads WHERE id = ?1",
  )
    .bind(id)
    .first<LeadRow>();
}

export async function loadPublicResearch(env: Env, key: string | null): Promise<PublicResearch | null> {
  if (!key) return null;
  const row = await env.DB.prepare("SELECT status, research_json FROM industry_research WHERE key = ?1")
    .bind(key)
    .first<{ status: string; research_json: string | null }>();
  if (!row || row.status !== "ready" || !row.research_json) return null;
  return stripSources(key, "ready", JSON.parse(row.research_json) as ResearchDoc);
}

export function parseLead(row: LeadRow) {
  return {
    inputs: JSON.parse(row.inputs_json) as CalculatorInputs,
    results: JSON.parse(row.results_json) as CalculatorResults,
    siteScan: row.site_scan_json ? (JSON.parse(row.site_scan_json) as SiteScan) : null,
  };
}
