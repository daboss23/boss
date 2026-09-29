/**
 * AI diagnosis prompt + template fallback. Pure, shared by the server (which
 * builds the prompt, never the browser) and the client (offline fallback).
 */
import { scoreGrade } from "./calcResults.js";
import { fmt, fmtFull, fmtInt } from "./formatters.js";
import { siteGapLines, topOpportunities } from "./actionPlans.js";
import type { CalculatorInputs, CalculatorResults, PublicResearch, SiteScan } from "./types.js";

export const DIAGNOSIS_SYSTEM = `You are a sharp revenue growth advisor at PrimeFlowAI, speaking directly to a business owner who just ran a pipeline audit.

Write exactly 4 sentences of plain prose. No bullets, no headings, no lists, no em dashes, no exclamation marks, no greeting, no sign-off.
- Use the business name and industry if they are given.
- Quote at least 3 of their specific numbers exactly as provided.
- Name their single biggest leak (the first item under "Ranked leaks").
- If website findings are provided, reference at least one specific detected gap.
- If industry figures are provided, you may compare against one of them.
- End with urgency tied to their own numbers, not generic hype.
- Never invent numbers, statistics or facts that are not in the data.`;

export function buildDiagnosisPrompt(
  i: CalculatorInputs,
  r: CalculatorResults,
  scan: SiteScan | null,
  research: PublicResearch | null,
): string {
  const g = scoreGrade(r.score);
  const ranked = topOpportunities(r, i);
  const lines = [
    `Business name: ${i.businessName ?? "not given"}`,
    `Industry: ${i.industry ?? "not given"}`,
    `Average sale value: ${fmtFull(r.sym, r.saleVal)}`,
    `Monthly leads: ${fmtInt(r.monthlyLeads)}`,
    `Monthly marketing spend: ${fmtFull(r.sym, r.monthlySpend)}`,
    `Conversion rate: ${+(r.convRate * 100).toFixed(1)}%`,
    `Lead response time: ${r.rt.label} (${Math.round(r.rt.multiplier * 100)}% of optimal conversion)`,
    `Weekly coverage: ${r.coveragePct}% of 168 hours; peak buying windows covered: ${r.highConvCoverage}%`,
    `Missed calls: ${fmtInt(i.missedCallsWeekly)} a week, ${fmtInt(r.annualMissed)} a year`,
    `Follow-up: ${i.followUpAttempts} attempts via ${i.followUpChannels.join(", ") || "no channels selected"}`,
    `Dormant leads in database: ${fmtInt(r.prospects)}`,
    `Total annual revenue leakage: ${fmtFull(r.sym, r.totalLeakage)} (${r.leakPct}% of potential revenue)`,
    `Pipeline health: ${r.score}/100, grade ${g.grade} (${g.label})`,
    `Ranked leaks (biggest first):`,
    ...ranked.map((o, n) => `  ${n + 1}. ${o.title}: ${fmtFull(r.sym, o.value)} a year. ${o.line}`),
  ];
  if (scan) {
    const gaps = siteGapLines(scan).filter((x) => !x.ok);
    lines.push(`Website findings for ${scan.domain}:`);
    lines.push(...(gaps.length ? gaps.map((g2) => `  - ${g2.text}`) : ["  - No major conversion gaps detected"]));
  }
  if (research?.stats?.length) {
    lines.push(`Industry figures for ${research.segment ?? research.industry} in ${research.country}:`);
    for (const s of research.stats.slice(0, 6)) lines.push(`  - ${s.metric}: ${s.value} ${s.unit} (${s.context})`);
  }
  return `Pipeline audit data:\n${lines.join("\n")}\n\nWrite the 4-sentence diagnosis now.`;
}

/** Template diagnosis that still uses their real numbers. Never an error state. */
export function fallbackDiagnosis(i: CalculatorInputs, r: CalculatorResults, scan: SiteScan | null = null): string {
  const g = scoreGrade(r.score);
  const top = topOpportunities(r, i)[0]!;
  const who = i.businessName ? `${i.businessName} is` : "Your pipeline is";
  const gap = scan ? siteGapLines(scan).find((x) => !x.ok) : undefined;
  const s1 = `${who} leaking an estimated ${fmt(r.sym, r.totalLeakage)} a year, a pipeline health grade of ${g.grade} at ${r.score}/100.`;
  const s2 =
    top.key === "speed"
      ? `Your biggest leak is speed: answering leads in ${r.rt.label} costs about ${fmt(r.sym, r.speedLeakage)} a year compared with replying inside a minute.`
      : top.key === "missed"
        ? `Your biggest leak is the phone: ${fmtInt(i.missedCallsWeekly)} missed calls a week adds up to ${fmtInt(r.annualMissed)} a year and about ${fmt(r.sym, r.revLostMissed)} in lost sales.`
        : `Your biggest leak is the ${fmtInt(r.prospects)} dormant leads in your database, worth about ${fmt(r.sym, r.reactRevenue)} if even a small share is reactivated.`;
  const s3 = gap
    ? `On ${scan!.domain} we found a gap that feeds this directly: ${gap.text.charAt(0).toLowerCase()}${gap.text.slice(1)}.`
    : `You cover ${r.coveragePct}% of the week and ${r.highConvCoverage}% of the peak buying windows, so leads that arrive outside those hours wait.`;
  const s4 = `Recovering just 20% of this is ${fmt(r.sym, r.totalLeakage * 0.2)} a year, and every week it waits costs roughly ${fmt(r.sym, r.totalLeakage / 52)}.`;
  return [s1, s2, s3, s4].join(" ");
}

/** Normalises model output: plain prose, no em dashes, collapsed whitespace. */
export function cleanDiagnosis(text: string): string {
  return text
    .replace(/^#+\s.*$/gm, "")
    .replace(/^\s*[-*•]\s+/gm, "")
    .replace(/\s*[—–]\s*/g, ", ")
    .replace(/\s+/g, " ")
    .trim();
}
