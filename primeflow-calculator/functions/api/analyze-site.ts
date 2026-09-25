import { BENCHMARKS } from "../../src/lib/benchmarks";
import { INDUSTRIES } from "../../src/lib/constants";
import {
  afterHoursGap,
  detectSignals,
  extractHours,
  extractJsonLd,
  extractPhone,
  htmlToText,
  metaContent,
  normalizeSiteUrl,
  usefulInternalLinks,
} from "../../src/lib/siteSignals";
import type { Industry, SiteHours, SiteScan } from "../../src/lib/types";
import { claude, DEFAULT_MODEL } from "../_lib/claude";
import type { Env } from "../_lib/env";
import { badRequest, hashIp, json, rateLimit, readJson, tooMany, verifyTurnstile } from "../_lib/http";

const UA =
  "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/128.0 Safari/537.36";
const FETCH_TIMEOUT_MS = 6_000;
const MAX_HTML_BYTES = 1_500_000;
const CACHE_DAYS = 7;
const MIN_VISIBLE_TEXT = 400;

const FAIL_MESSAGE = "We couldn't read that site, no problem, just fill in the details below.";

/**
 * POST { url, turnstileToken } → { scan, benchmark } | { error }
 *
 * Code detects conversion-gap signals. Claude only extracts what is explicitly
 * on the page (null otherwise). Benchmarks come from the owner's table.
 */
export const onRequestPost: PagesFunction<Env> = async ({ request, env }) => {
  const body = await readJson(request, 4_000);
  if (!body) return badRequest("Invalid request.");
  const norm = normalizeSiteUrl(String(body.url ?? ""));
  if (!norm.ok) return badRequest(norm.reason);

  if (!(await verifyTurnstile(env, body.turnstileToken, request)))
    return json({ error: "We couldn't verify you're human. Refresh and try again." }, 403);
  if (!(await rateLimit(env, "scan", await hashIp(request), 10))) return tooMany();

  const url = norm.url;
  const domain = url.hostname.replace(/^www\./, "");

  const cached = await env.DB.prepare(
    `SELECT scan_json FROM site_scans WHERE domain = ?1 AND scanned_at > datetime('now', ?2)`,
  )
    .bind(domain, `-${CACHE_DAYS} days`)
    .first<{ scan_json: string }>();
  if (cached) return respond(JSON.parse(cached.scan_json) as SiteScan, true);

  try {
    const home = await fetchHtml(url.href);
    let html = home?.html ?? "";
    const finalUrl = home?.finalUrl ? new URL(home.finalUrl) : url;

    // JavaScript-rendered sites: retry with Browser Rendering.
    if (htmlToText(html).length < MIN_VISIBLE_TEXT && env.BROWSER) {
      const rendered = await renderWithBrowser(env.BROWSER, url.href).catch((err) => {
        console.error("browser rendering failed", err);
        return null;
      });
      if (rendered) html = rendered;
    }
    if (!html) return json({ error: FAIL_MESSAGE }, 422);

    const extra = await Promise.all(
      usefulInternalLinks(html, finalUrl, 2).map((u) => fetchHtml(u).then((r) => r?.html ?? "").catch(() => "")),
    );
    const allHtml = [html, ...extra].join("\n");

    const signals = detectSignals(allHtml);
    const ld = extractJsonLd(allHtml);
    const ldHours = extractHours(ld);
    const ldBiz = ld.find((n) => typeof n.name === "string" && /Business|Organization|Store|Clinic|Dentist|Service|Restaurant|Agent|Contractor|Physician|Attorney|Store/i.test(String(n["@type"] ?? "")));

    const pages = [html, ...extra].map((h) => htmlToText(h));
    const text = pages.join("\n\n---\n\n").slice(0, 15_000);
    const title = html.match(/<title[^>]*>([^<]*)<\/title>/i)?.[1]?.trim() ?? "";
    const description = metaContent(html, "description") ?? metaContent(html, "og:description") ?? "";

    const ai = await extractWithClaude(env, { domain, title, description, text }).catch((err) => {
      console.error("site extraction failed", err);
      return null;
    });

    const rating = ldBiz?.aggregateRating as Record<string, unknown> | undefined;
    const hours: SiteHours | null = ldHours ?? ai?.hours ?? null;
    const scan: SiteScan = {
      url: finalUrl.href,
      domain,
      businessName: (typeof ldBiz?.name === "string" ? ldBiz.name : null) ?? ai?.businessName ?? null,
      industry: ai?.industry ?? null,
      segment: ai?.segment ?? null,
      location: ai?.location ?? null,
      services: ai?.services ?? [],
      hours,
      priceSignals: ai?.priceSignals ?? [],
      reviewCount: numOrNull(rating?.reviewCount ?? rating?.ratingCount) ?? ai?.reviewCount ?? null,
      rating: numOrNull(rating?.ratingValue) ?? ai?.rating ?? null,
      phone: extractPhone(allHtml),
      signals,
      afterHoursGap: afterHoursGap(hours),
      confidence: ai?.confidence ?? "low",
    };

    await env.DB.prepare(
      `INSERT INTO site_scans (domain, scan_json) VALUES (?1, ?2)
       ON CONFLICT(domain) DO UPDATE SET scan_json = excluded.scan_json, scanned_at = datetime('now')`,
    )
      .bind(domain, JSON.stringify(scan))
      .run();

    return respond(scan, false);
  } catch (err) {
    console.error("analyze-site failed", err);
    return json({ error: FAIL_MESSAGE }, 422);
  }
};

function respond(scan: SiteScan, cached: boolean) {
  const benchmark = scan.industry ? BENCHMARKS[scan.industry] : null;
  return json({ scan, benchmark, cached });
}

const numOrNull = (v: unknown) => {
  const n = typeof v === "number" ? v : typeof v === "string" ? Number(v) : NaN;
  return Number.isFinite(n) ? n : null;
};

async function fetchHtml(href: string): Promise<{ html: string; finalUrl: string } | null> {
  const ctrl = new AbortController();
  const t = setTimeout(() => ctrl.abort(), FETCH_TIMEOUT_MS);
  try {
    const res = await fetch(href, {
      signal: ctrl.signal,
      redirect: "follow",
      headers: { "user-agent": UA, accept: "text/html,application/xhtml+xml", "accept-language": "en" },
    });
    if (!res.ok) return null;
    // Re-check the host after redirects.
    if (!normalizeSiteUrl(res.url || href).ok) return null;
    if (!/html|xml/i.test(res.headers.get("content-type") ?? "")) return null;
    const reader = res.body?.getReader();
    if (!reader) return null;
    const chunks: Uint8Array[] = [];
    let size = 0;
    for (;;) {
      const { done, value } = await reader.read();
      if (done) break;
      size += value.byteLength;
      chunks.push(value);
      if (size > MAX_HTML_BYTES) {
        await reader.cancel();
        break;
      }
    }
    const buf = new Uint8Array(size > MAX_HTML_BYTES ? MAX_HTML_BYTES : size);
    let off = 0;
    for (const c of chunks) {
      const take = Math.min(c.byteLength, buf.byteLength - off);
      buf.set(c.subarray(0, take), off);
      off += take;
      if (off >= buf.byteLength) break;
    }
    return { html: new TextDecoder().decode(buf), finalUrl: res.url || href };
  } catch {
    return null;
  } finally {
    clearTimeout(t);
  }
}

async function renderWithBrowser(binding: Fetcher, href: string): Promise<string | null> {
  const puppeteer = await import("@cloudflare/puppeteer");
  const browser = await puppeteer.default.launch(binding);
  try {
    const page = await browser.newPage();
    await page.setUserAgent(UA);
    await page.goto(href, { waitUntil: "networkidle0", timeout: 12_000 });
    return await page.content();
  } finally {
    await browser.close();
  }
}

interface Extraction {
  businessName: string | null;
  industry: Industry | null;
  segment: string | null;
  location: { city: string | null; country: string | null } | null;
  services: string[];
  hours: SiteHours | null;
  priceSignals: { label: string; amount: number; currency: string | null }[];
  reviewCount: number | null;
  rating: number | null;
  confidence: "high" | "medium" | "low";
}

const nullable = (schema: Record<string, unknown>) => ({ anyOf: [schema, { type: "null" }] });

const EXTRACTION_SCHEMA = {
  type: "object",
  additionalProperties: false,
  required: ["businessName", "industry", "segment", "location", "services", "hours", "priceSignals", "reviewCount", "rating", "confidence"],
  properties: {
    businessName: nullable({ type: "string" }),
    industry: nullable({ type: "string", enum: [...INDUSTRIES] }),
    segment: nullable({ type: "string" }),
    location: nullable({
      type: "object",
      additionalProperties: false,
      required: ["city", "country"],
      properties: { city: nullable({ type: "string" }), country: nullable({ type: "string" }) },
    }),
    services: { type: "array", items: { type: "string" } },
    hours: nullable({
      type: "object",
      additionalProperties: false,
      required: ["days", "start", "end"],
      properties: {
        days: { type: "array", items: { type: "boolean" } },
        start: { type: "integer" },
        end: { type: "integer" },
      },
    }),
    priceSignals: {
      type: "array",
      items: {
        type: "object",
        additionalProperties: false,
        required: ["label", "amount", "currency"],
        properties: { label: { type: "string" }, amount: { type: "number" }, currency: nullable({ type: "string" }) },
      },
    },
    reviewCount: nullable({ type: "integer" }),
    rating: nullable({ type: "number" }),
    confidence: { type: "string", enum: ["high", "medium", "low"] },
  },
} as const;

const EXTRACTION_SYSTEM = `You extract facts about a business from the text of its own website.

Return only what is explicitly stated on the page. If a field is not clearly stated, return null (or an empty array). Never guess, infer or estimate.
- industry: the single best match from the allowed list, or null if the text doesn't make it clear. Use "Other" only when the business clearly exists but fits none.
- segment: a short plural noun phrase for the business type, e.g. "physiotherapy clinics", "roofing contractors". Null if unclear.
- location.country: ISO 3166-1 alpha-2 code (e.g. "AU", "US", "GB") only if an address, phone format or explicit mention makes it clear.
- hours: only if opening hours are listed. days is Monday to Sunday (7 booleans); start and end are 24-hour integers of the widest daily window.
- priceSignals: only prices actually published on the page, with the ISO currency code if shown.
- reviewCount and rating: only if printed on the page.
- confidence: how much of the business profile the page states plainly.`;

async function extractWithClaude(
  env: Env,
  page: { domain: string; title: string; description: string; text: string },
): Promise<Extraction | null> {
  const client = claude(env, 20_000);
  if (!client || page.text.length < 40) return null;
  const msg = await client.messages.create({
    model: env.ANTHROPIC_MODEL || DEFAULT_MODEL,
    max_tokens: 2000,
    temperature: 0,
    system: EXTRACTION_SYSTEM,
    output_config: { format: { type: "json_schema", schema: EXTRACTION_SCHEMA as unknown as Record<string, unknown> } },
    messages: [
      {
        role: "user",
        content: `Website: ${page.domain}\nTitle: ${page.title}\nMeta description: ${page.description}\n\nPage text:\n<page>\n${page.text}\n</page>`,
      },
    ],
  });
  if (msg.stop_reason !== "end_turn") return null;
  const block = msg.content.find((b) => b.type === "text");
  if (!block || block.type !== "text") return null;
  const e = JSON.parse(block.text) as Extraction;

  // Defensive clean-up: the schema constrains shape, code constrains meaning.
  if (e.industry && !INDUSTRIES.includes(e.industry)) e.industry = null;
  if (e.hours) {
    const h = e.hours;
    const ok = Array.isArray(h.days) && h.days.length === 7 && h.start >= 0 && h.end <= 24 && h.end > h.start;
    e.hours = ok ? { days: h.days, start: h.start, end: Math.min(h.end, 23) } : null;
  }
  if (e.rating !== null && !(e.rating > 0 && e.rating <= 5)) e.rating = null;
  if (e.reviewCount !== null && !(e.reviewCount >= 0)) e.reviewCount = null;
  if (e.location?.country) e.location.country = e.location.country.toUpperCase().slice(0, 2);
  e.services = (e.services ?? []).slice(0, 8).map((s) => s.slice(0, 80));
  e.priceSignals = (e.priceSignals ?? []).filter((p) => p.amount > 0).slice(0, 6);
  return e;
}
