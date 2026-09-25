import { calcResults, scoreGrade } from "../../src/lib/calcResults";
import { fmtFull } from "../../src/lib/formatters";
import { isValid, parseInputs, validateLead } from "../../src/lib/validation";
import { normalizeSiteUrl } from "../../src/lib/siteSignals";
import type { Env } from "../_lib/env";
import { badRequest, hashIp, json, rateLimit, readJson, tooMany, verifyTurnstile } from "../_lib/http";

/**
 * POST { name, email, turnstileToken, inputs, researchKey? }
 * → { reportId, results }
 *
 * Results are always recalculated here from validated inputs; numbers sent by
 * the browser are ignored.
 */
export const onRequestPost: PagesFunction<Env> = async ({ request, env, waitUntil }) => {
  const body = await readJson(request);
  if (!body) return badRequest("Invalid request.");

  if (!(await verifyTurnstile(env, body.turnstileToken, request)))
    return json({ error: "We couldn't verify you're human. Refresh and try again." }, 403);

  const name = typeof body.name === "string" ? body.name.trim() : "";
  const email = typeof body.email === "string" ? body.email.trim().toLowerCase() : "";
  const leadErrors = validateLead(name, email);
  if (!isValid(leadErrors)) return badRequest("Check your details.", { fields: leadErrors });

  const parsed = parseInputs(body.inputs);
  if (!parsed.ok) return badRequest("Some inputs need another look.", { fields: parsed.errors });
  const inputs = parsed.inputs;

  const ipHash = await hashIp(request);
  if (!(await rateLimit(env, "lead", ipHash, 5))) return tooMany();

  const results = calcResults(inputs);
  const grade = scoreGrade(results.score);
  const id = crypto.randomUUID();

  // Attach the cached site scan server-side (never trusted from the client).
  let siteScanJson: string | null = null;
  let websiteUrl: string | null = null;
  if (inputs.websiteUrl) {
    const norm = normalizeSiteUrl(inputs.websiteUrl);
    if (norm.ok) {
      websiteUrl = norm.url.href;
      const domain = norm.url.hostname.replace(/^www\./, "");
      const row = await env.DB.prepare("SELECT scan_json FROM site_scans WHERE domain = ?1").bind(domain).first<{ scan_json: string }>();
      siteScanJson = row?.scan_json ?? null;
    }
  }

  const researchKey = typeof body.researchKey === "string" && body.researchKey.length <= 200 ? body.researchKey : null;

  await env.DB.prepare(
    `INSERT INTO leads (id, name, email, business_name, industry, currency, inputs_json, results_json,
                        total_leakage, grade, ip_hash, website_url, site_scan_json, research_key)
     VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7, ?8, ?9, ?10, ?11, ?12, ?13, ?14)`,
  )
    .bind(
      id,
      name,
      email,
      inputs.businessName ?? null,
      inputs.industry ?? null,
      inputs.currency,
      JSON.stringify(inputs),
      JSON.stringify(results),
      results.totalLeakage,
      grade.grade,
      ipHash,
      websiteUrl,
      siteScanJson,
      researchKey,
    )
    .run();

  if (env.RESEND_API_KEY && env.NOTIFY_EMAIL) {
    const origin = env.PUBLIC_ORIGIN || new URL(request.url).origin;
    waitUntil(
      notifyOwner(env, {
        name,
        email,
        business: inputs.businessName ?? "—",
        industry: inputs.industry ?? "—",
        leakage: fmtFull(results.sym, results.totalLeakage),
        grade: `${grade.grade} (${results.score}/100)`,
        link: `${origin}/r/${id}`,
      }).catch((err) => console.error("lead notification failed", err)),
    );
  }

  return json({ reportId: id, results });
};

const esc = (s: string) => s.replace(/[&<>"']/g, (c) => `&#${c.charCodeAt(0)};`);

async function notifyOwner(
  env: Env,
  lead: { name: string; email: string; business: string; industry: string; leakage: string; grade: string; link: string },
) {
  const rows = [
    ["Name", lead.name],
    ["Email", lead.email],
    ["Business", lead.business],
    ["Industry", lead.industry],
    ["Total leakage", lead.leakage],
    ["Grade", lead.grade],
  ]
    .map(([k, v]) => `<tr><td style="padding:4px 12px 4px 0;color:#64748b">${k}</td><td style="padding:4px 0"><strong>${esc(v!)}</strong></td></tr>`)
    .join("");
  const res = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: { authorization: `Bearer ${env.RESEND_API_KEY}`, "content-type": "application/json" },
    body: JSON.stringify({
      from: env.NOTIFY_FROM || "PrimeFlowAI <onboarding@resend.dev>",
      to: [env.NOTIFY_EMAIL],
      reply_to: lead.email,
      subject: `New lead: ${lead.name} (${lead.business}), ${lead.leakage} leakage`,
      html: `<table style="font-family:Inter,Arial,sans-serif;font-size:14px">${rows}</table><p><a href="${esc(lead.link)}">Open report</a></p>`,
    }),
  });
  if (!res.ok) throw new Error(`Resend ${res.status}: ${await res.text()}`);
}
