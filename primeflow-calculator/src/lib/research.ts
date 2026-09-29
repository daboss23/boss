/**
 * Live industry research: shared schema, sanity bounds, source stripping and
 * "How You Compare" maths. Research informs; the prospect's inputs drive the
 * core formulas. Sources are internal only and never reach the browser.
 */
import { BENCHMARKS, RESEARCH_BOUNDS } from "./benchmarks.js";
import { RESPONSE_TIMES } from "./constants.js";
import type { CalculatorInputs, CalculatorResults, Industry, PublicResearch, ResearchComparison } from "./types.js";

export const RESEARCH_METRICS = [
  "avg_sale_value",
  "conversion_rate",
  "response_time_minutes",
  "cost_per_lead",
  "customer_acquisition_cost",
  "customer_lifetime_value",
  "repeat_rate",
  "missed_call_share",
] as const;
export type ResearchMetric = (typeof RESEARCH_METRICS)[number];

export interface ResearchStat {
  metric: ResearchMetric;
  value: number;
  unit: string;
  context: string;
  source_title: string;
  source_publisher: string;
  source_url: string;
  year: number;
}

export interface ResearchDoc {
  industry: string;
  segment: string;
  country: string;
  city?: string | null;
  stats: ResearchStat[];
  trends: { text: string; source_url: string }[];
  researched_at: string;
}

const slug = (s: string) =>
  s
    .toLowerCase()
    .replace(/&/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 48);

export function researchKey(p: { industry: string; segment?: string | null; country: string; city?: string | null }): string {
  return [slug(p.industry), slug(p.segment || p.industry), p.country.toUpperCase().slice(0, 2), p.city ? slug(p.city) : ""]
    .filter((x, i) => i < 3 || x)
    .join("|");
}

const DOLLAR_CODES = new Set(["USD", "AUD", "CAD", "NZD", "SGD", "HKD"]);
export function currencySymbolFor(code: string): "$" | "£" | "€" | null {
  const c = code.toUpperCase();
  if (DOLLAR_CODES.has(c)) return "$";
  if (c === "GBP") return "£";
  if (c === "EUR") return "€";
  return null;
}

const PERCENT_METRICS: ResearchMetric[] = ["conversion_rate", "repeat_rate", "missed_call_share"];
const MONEY_METRICS: ResearchMetric[] = ["avg_sale_value", "cost_per_lead", "customer_acquisition_cost", "customer_lifetime_value"];

/**
 * Hard bounds in code. Anything outside is dropped (and reported so the caller
 * can log it). Stats without a source URL, publisher and year are dropped too.
 */
export function sanitizeResearch(
  raw: unknown,
  industry: Industry | string,
): { doc: ResearchDoc | null; rejected: { metric?: string; value?: number; reason: string }[] } {
  const rejected: { metric?: string; value?: number; reason: string }[] = [];
  if (!raw || typeof raw !== "object") return { doc: null, rejected: [{ reason: "not an object" }] };
  const r = raw as Record<string, unknown>;
  const bench = BENCHMARKS[industry as Industry] ?? BENCHMARKS.Other;
  const nowYear = new Date().getUTCFullYear();
  const stats: ResearchStat[] = [];

  for (const s of (Array.isArray(r.stats) ? r.stats : []) as Record<string, unknown>[]) {
    const metric = s.metric as ResearchMetric;
    const value = typeof s.value === "number" ? s.value : Number(s.value);
    const reject = (reason: string) => rejected.push({ metric: String(s.metric), value, reason });
    if (!RESEARCH_METRICS.includes(metric)) {
      reject("unknown metric");
      continue;
    }
    if (!Number.isFinite(value) || value <= 0) {
      reject("not a positive number");
      continue;
    }
    const url = String(s.source_url ?? "");
    if (!/^https?:\/\/[^\s]+\.[^\s]+/.test(url) || !s.source_publisher || !s.year) {
      reject("missing source, publisher or year");
      continue;
    }
    const year = Number(s.year);
    if (!(year >= nowYear - 8 && year <= nowYear)) {
      reject("source too old or undated");
      continue;
    }
    const unit = String(s.unit ?? "").slice(0, 12);
    if (PERCENT_METRICS.includes(metric)) {
      const b = metric === "conversion_rate" ? RESEARCH_BOUNDS.conversionRate : RESEARCH_BOUNDS.missedCallShare;
      const max = metric === "repeat_rate" ? 100 : b.max;
      if (value < b.min || value > max) {
        reject(`outside ${b.min}–${max}%`);
        continue;
      }
    }
    if (MONEY_METRICS.includes(metric) && !currencySymbolFor(unit)) {
      reject("unsupported currency unit");
      continue;
    }
    if (metric === "avg_sale_value") {
      const f = RESEARCH_BOUNDS.avgSaleValueFactor;
      if (value > bench.avgSaleValue * f || value < bench.avgSaleValue / f) {
        reject(`not within ${f}x of benchmark ${bench.avgSaleValue}`);
        continue;
      }
    }
    if (metric === "response_time_minutes") {
      const b = RESEARCH_BOUNDS.responseTimeMinutes;
      if (value < b.min || value > b.max) {
        reject("response time out of bounds");
        continue;
      }
    }
    stats.push({
      metric,
      value,
      unit,
      context: String(s.context ?? "").slice(0, 160),
      source_title: String(s.source_title ?? "").slice(0, 200),
      source_publisher: String(s.source_publisher).slice(0, 120),
      source_url: url.slice(0, 500),
      year,
    });
  }

  const trends = ((Array.isArray(r.trends) ? r.trends : []) as Record<string, unknown>[])
    .filter((t) => typeof t.text === "string" && /^https?:\/\//.test(String(t.source_url ?? "")))
    .slice(0, 3)
    .map((t) => ({ text: String(t.text).slice(0, 240), source_url: String(t.source_url).slice(0, 500) }));

  if (!stats.length && !trends.length) return { doc: null, rejected };
  return {
    doc: {
      industry: String(r.industry ?? industry).slice(0, 60),
      segment: String(r.segment ?? industry).slice(0, 80),
      country: String(r.country ?? "").slice(0, 2).toUpperCase(),
      city: typeof r.city === "string" ? r.city.slice(0, 60) : null,
      stats,
      trends,
      researched_at: new Date().toISOString(),
    },
    rejected,
  };
}

/** Removes every source_* field. Everything sent to the browser goes through this. */
export function stripSources(key: string, status: PublicResearch["status"], doc: ResearchDoc | null): PublicResearch {
  if (!doc) return { key, status };
  return {
    key,
    status,
    industry: doc.industry,
    segment: doc.segment,
    country: doc.country,
    city: doc.city ?? null,
    stats: doc.stats.map(({ metric, value, unit, context, year }) => ({ metric, value, unit, context, year })),
    trends: doc.trends.map((t) => t.text),
    researched_at: doc.researched_at,
  };
}

const COUNTRY_NAMES: Record<string, string> = {
  AU: "Australia",
  US: "the United States",
  GB: "the United Kingdom",
  UK: "the United Kingdom",
  CA: "Canada",
  NZ: "New Zealand",
  IE: "Ireland",
  SG: "Singapore",
  ZA: "South Africa",
};
export const countryName = (code?: string) => (code ? (COUNTRY_NAMES[code.toUpperCase()] ?? code.toUpperCase()) : "your market");

function stat(research: PublicResearch, metric: ResearchMetric) {
  return research.stats?.find((s) => s.metric === metric);
}

/**
 * Field pre-fills from research, respecting currency. Only returns values
 * the caller may use for fields the prospect has NOT typed.
 */
export function researchPrefills(research: PublicResearch, currency: CalculatorInputs["currency"]) {
  const out: Partial<Record<"avgSaleValue" | "conversionRate", string>> = {};
  const asv = stat(research, "avg_sale_value");
  if (asv && currencySymbolFor(asv.unit) === currency) out.avgSaleValue = String(Math.round(asv.value));
  const cr = stat(research, "conversion_rate");
  if (cr) out.conversionRate = String(+cr.value.toFixed(1));
  return out;
}

/** "How You Compare": their number next to the industry number, with the value of closing half the gap. */
export function compareToIndustry(i: CalculatorInputs, r: CalculatorResults, research: PublicResearch | null): ResearchComparison[] {
  if (!research?.stats?.length) return [];
  const out: ResearchComparison[] = [];

  const cr = stat(research, "conversion_rate");
  if (cr) {
    const yours = r.convRate * 100;
    const gap = cr.value - yours;
    out.push({
      metric: "conversion_rate",
      label: "Conversion rate",
      yours,
      industry: cr.value,
      unit: "percent",
      higherIsBetter: true,
      // Closing half the gap on the same lead volume and sale value.
      gapValue: gap > 0 ? r.monthlyLeads * 12 * (gap / 2 / 100) * r.saleVal : null,
    });
  }

  const asv = stat(research, "avg_sale_value");
  if (asv && currencySymbolFor(asv.unit) === i.currency) {
    const gap = asv.value - r.saleVal;
    out.push({
      metric: "avg_sale_value",
      label: "Average sale value",
      yours: r.saleVal,
      industry: asv.value,
      unit: "currency",
      higherIsBetter: true,
      gapValue: gap > 0 ? r.monthlyLeads * r.convRate * 12 * (gap / 2) : null,
    });
  }

  const cpl = stat(research, "cost_per_lead");
  if (cpl && currencySymbolFor(cpl.unit) === i.currency && r.costPerLead > 0) {
    const gap = r.costPerLead - cpl.value;
    out.push({
      metric: "cost_per_lead",
      label: "Cost per lead",
      yours: r.costPerLead,
      industry: cpl.value,
      unit: "currency",
      higherIsBetter: false,
      gapValue: gap > 0 ? r.monthlyLeads * 12 * (gap / 2) : null,
    });
  }

  const rtm = stat(research, "response_time_minutes");
  if (rtm) {
    const yours = r.rt.minutes;
    // Value of moving to the band nearest the industry figure, halved.
    const target = RESPONSE_TIMES.reduce((best, b) =>
      Math.abs(b.minutes - rtm.value) < Math.abs(best.minutes - rtm.value) ? b : best,
    );
    const gain = target.multiplier > r.rt.multiplier ? (r.annualRevenue / r.rt.multiplier) * (target.multiplier - r.rt.multiplier) : 0;
    out.push({
      metric: "response_time_minutes",
      label: "Lead response time",
      yours,
      industry: rtm.value,
      unit: "minutes",
      higherIsBetter: false,
      gapValue: gain > 0 ? gain / 2 : null,
    });
  }

  return out;
}
