import type Anthropic from "@anthropic-ai/sdk";
import { INDUSTRIES } from "../../src/lib/constants";
import { countryName, RESEARCH_METRICS, researchKey, sanitizeResearch, stripSources, type ResearchDoc } from "../../src/lib/research";
import type { Industry } from "../../src/lib/types";
import { claude, DEFAULT_RESEARCH_MODEL, lastJsonObject } from "../_lib/claude";
import type { Env } from "../_lib/env";
import { badRequest, hashIp, json, rateLimit, readJson, tooMany, verifyTurnstile } from "../_lib/http";

const FRESH_DAYS = 30;
/** A pending row older than this is treated as abandoned and may be re-run. */
const PENDING_STALE_MINUTES = 5;

/**
 * POST { industry, segment?, country, city?, turnstileToken }
 * → PublicResearch ({ key, status, ...numbers }) — never any source fields.
 *
 * Cached by industry + segment + country (+ city) for 30 days. Uncached runs
 * start in the background and the client polls /api/research-status/:key.
 */
export const onRequestPost: PagesFunction<Env> = async ({ request, env, waitUntil }) => {
  const body = await readJson(request, 4_000);
  if (!body) return badRequest("Invalid request.");

  const industry = String(body.industry ?? "") as Industry;
  if (!INDUSTRIES.includes(industry)) return badRequest("Unknown industry.");
  const country = String(body.country ?? "").toUpperCase();
  if (!/^[A-Z]{2}$/.test(country)) return badRequest("Unknown country.");
  const segment = typeof body.segment === "string" ? body.segment.trim().slice(0, 80) || null : null;
  const city = typeof body.city === "string" ? body.city.trim().slice(0, 60) || null : null;

  const warm = Boolean(env.RESEARCH_WARM_TOKEN) && request.headers.get("x-warm-token") === env.RESEARCH_WARM_TOKEN;
  if (!warm) {
    if (!(await verifyTurnstile(env, body.turnstileToken, request)))
      return json({ error: "We couldn't verify you're human." }, 403);
    if (!(await rateLimit(env, "research", await hashIp(request), 20))) return tooMany();
  }

  const key = researchKey({ industry, segment, country, city });
  const row = await env.DB.prepare(
    `SELECT status, research_json,
            updated_at > datetime('now', ?2) AS fresh,
            updated_at > datetime('now', ?3) AS recent
       FROM industry_research WHERE key = ?1`,
  )
    .bind(key, `-${FRESH_DAYS} days`, `-${PENDING_STALE_MINUTES} minutes`)
    .first<{ status: string; research_json: string | null; fresh: number; recent: number }>();

  if (row?.status === "ready" && row.fresh && row.research_json)
    return json(stripSources(key, "ready", JSON.parse(row.research_json) as ResearchDoc));
  if (row?.status === "pending" && row.recent) return json({ key, status: "pending" });

  // Global daily cap on uncached runs.
  const cap = Number(env.MAX_RESEARCH_PER_DAY || "100");
  if (!(await rateLimit(env, "research-global", "all", cap, 86_400))) return json({ key, status: "failed" });

  await env.DB.prepare(
    `INSERT INTO industry_research (key, status) VALUES (?1, 'pending')
     ON CONFLICT(key) DO UPDATE SET status = 'pending', updated_at = datetime('now')`,
  )
    .bind(key)
    .run();

  waitUntil(runResearch(env, key, { industry, segment, country, city }));
  return json({ key, status: "pending" });
};

const RESEARCH_SYSTEM = `You are a meticulous market researcher. You find real, citable statistics about how businesses in a specific industry and country handle and convert inbound leads.

Rules:
- Every statistic must come from a page you actually opened in search results, with its URL, the publisher's name and the year of the figure.
- Prefer primary sources: industry associations, government statistics, published studies, regulators, and company annual reports.
- Skip statistics you can only find on vendor or marketing blogs, and skip widely recycled claims you cannot trace to an original study (for example "78% of customers buy from the first responder").
- Only include a statistic that describes the requested industry (and country, if available). If a figure is national or global rather than local, say so in "context".
- Money values are in the local currency of the country, with the ISO currency code as the unit.
- Percentages are numbers from 0 to 100 with unit "%".
- If you cannot find a trustworthy figure for a metric, leave it out. Fewer, solid numbers beat many weak ones.`;

function researchPrompt(p: { industry: string; segment: string | null; country: string; city: string | null }) {
  const where = p.city ? `${p.city}, ${countryName(p.country)}` : countryName(p.country);
  return `Research ${p.segment ?? p.industry} (industry: ${p.industry}) in ${where}.

Find, where trustworthy sources exist:
- avg_sale_value: average transaction, job or client value
- conversion_rate: typical lead-to-customer conversion rate (%)
- response_time_minutes: typical time to respond to an inbound lead, in minutes
- customer_lifetime_value, or repeat_rate (%)
- cost_per_lead and/or customer_acquisition_cost
- missed_call_share: share of inbound calls missed or sent to voicemail (%)
- 1 to 3 notable trends affecting how these businesses handle leads (e.g. growth of online booking)

When you are done, reply with ONLY a single fenced JSON block in exactly this shape:

\`\`\`json
{
  "industry": "${p.industry}",
  "segment": "${p.segment ?? p.industry}",
  "country": "${p.country}",
  "stats": [
    { "metric": "one of: ${RESEARCH_METRICS.join(", ")}", "value": 0, "unit": "AUD or %", "context": "what exactly the figure measures", "source_title": "", "source_publisher": "", "source_url": "https://", "year": 2025 }
  ],
  "trends": [ { "text": "", "source_url": "https://" } ]
}
\`\`\``;
}

async function runResearch(env: Env, key: string, p: { industry: Industry; segment: string | null; country: string; city: string | null }) {
  const client = claude(env, 170_000);
  let inputTokens = 0;
  let outputTokens = 0;
  let searches = 0;
  try {
    if (!client) throw new Error("ANTHROPIC_API_KEY not set");
    const messages: Anthropic.MessageParam[] = [{ role: "user", content: researchPrompt(p) }];
    let finalText = "";
    // Server tools can pause long turns; resume up to 3 times.
    for (let turn = 0; turn < 4; turn++) {
      const msg = await client.messages.create({
        model: env.ANTHROPIC_RESEARCH_MODEL || DEFAULT_RESEARCH_MODEL,
        max_tokens: 16_000,
        system: RESEARCH_SYSTEM,
        tools: [{ type: "web_search_20260209", name: "web_search", max_uses: 8 }],
        messages,
      });
      inputTokens += msg.usage.input_tokens;
      outputTokens += msg.usage.output_tokens;
      searches += msg.usage.server_tool_use?.web_search_requests ?? 0;
      if (msg.stop_reason === "pause_turn") {
        messages.push({ role: "assistant", content: msg.content });
        continue;
      }
      finalText = msg.content
        .filter((b): b is Anthropic.TextBlock => b.type === "text")
        .map((b) => b.text)
        .join("");
      break;
    }

    const { doc, rejected } = sanitizeResearch(lastJsonObject(finalText), p.industry);
    for (const r of rejected)
      await env.DB.prepare("INSERT INTO research_rejections (research_key, metric, value, reason) VALUES (?1, ?2, ?3, ?4)")
        .bind(key, r.metric ?? null, Number.isFinite(r.value) ? r.value : null, r.reason)
        .run();
    if (rejected.length) console.warn(`research ${key}: dropped ${rejected.length} stat(s)`, rejected);

    await env.DB.prepare(
      `UPDATE industry_research SET status = ?2, research_json = ?3, input_tokens = ?4, output_tokens = ?5,
              searches_used = ?6, updated_at = datetime('now') WHERE key = ?1`,
    )
      .bind(key, doc ? "ready" : "failed", doc ? JSON.stringify({ ...doc, city: p.city }) : null, inputTokens, outputTokens, searches)
      .run();
  } catch (err) {
    console.error(`research ${key} failed`, err);
    await env.DB.prepare(
      `UPDATE industry_research SET status = 'failed', input_tokens = ?2, output_tokens = ?3, searches_used = ?4,
              updated_at = datetime('now') WHERE key = ?1`,
    )
      .bind(key, inputTokens, outputTokens, searches)
      .run();
  }
}
