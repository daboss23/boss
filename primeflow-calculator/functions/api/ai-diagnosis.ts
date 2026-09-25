import { buildDiagnosisPrompt, cleanDiagnosis, DIAGNOSIS_SYSTEM, fallbackDiagnosis } from "../../src/lib/diagnosis";
import { claude, DEFAULT_MODEL, textOf } from "../_lib/claude";
import type { Env } from "../_lib/env";
import { badRequest, json, readJson } from "../_lib/http";
import { loadLead, loadPublicResearch, parseLead } from "../_lib/reports";

/**
 * POST { reportId } → { diagnosis, source: "ai" | "cached" | "fallback" }
 *
 * The client never sends prompt text or numbers. Everything is loaded from D1.
 * Any failure returns a template diagnosis built from the real numbers.
 */
export const onRequestPost: PagesFunction<Env> = async ({ request, env }) => {
  const body = await readJson(request, 2_000);
  const reportId = typeof body?.reportId === "string" ? body.reportId : "";
  const row = await loadLead(env, reportId);
  if (!row) return badRequest("Report not found.");
  if (row.diagnosis) return json({ diagnosis: row.diagnosis, source: "cached" });

  const { inputs, results, siteScan } = parseLead(row);
  let diagnosis = "";
  let source: "ai" | "fallback" = "fallback";

  try {
    const client = claude(env, 20_000);
    if (!client) throw new Error("ANTHROPIC_API_KEY not set");
    const research = await loadPublicResearch(env, row.research_key);
    const msg = await client.messages.create({
      model: env.ANTHROPIC_MODEL || DEFAULT_MODEL,
      max_tokens: 600,
      temperature: 0.7,
      system: DIAGNOSIS_SYSTEM,
      messages: [{ role: "user", content: buildDiagnosisPrompt(inputs, results, siteScan, research) }],
    });
    const text = cleanDiagnosis(textOf(msg));
    const sentences = text.match(/[^.!?]+[.!?]+/g) ?? [];
    if (msg.stop_reason === "end_turn" && sentences.length >= 3 && text.length > 120) {
      diagnosis = sentences.slice(0, 4).join(" ").replace(/\s+/g, " ").trim();
      source = "ai";
    }
  } catch (err) {
    console.error("ai-diagnosis failed", err);
  }

  if (!diagnosis) diagnosis = fallbackDiagnosis(inputs, results, siteScan);

  // Only the first writer stores it, so a retry never produces a second version.
  await env.DB.prepare("UPDATE leads SET diagnosis = ?1 WHERE id = ?2 AND diagnosis IS NULL").bind(diagnosis, row.id).run();
  const stored = await env.DB.prepare("SELECT diagnosis FROM leads WHERE id = ?1").bind(row.id).first<{ diagnosis: string }>();
  return json({ diagnosis: stored?.diagnosis ?? diagnosis, source });
};
