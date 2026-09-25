/**
 * Profit Recovery Engine: calculation core.
 *
 * Pure functions, no React, no I/O. Runs identically in the browser and in
 * Cloudflare Functions (the server recalculates from inputs and never trusts
 * client numbers). Ported line-for-line from legacy/index.html `calcResults()`
 * and verified against golden fixtures in calcResults.test.ts.
 *
 * Findings from the port (reported to the owner, behaviour unchanged):
 *
 * 1. Pipeline Health Score (legacy formula, documented here for the first time):
 *      start at 100
 *      − (responseTimeIdx / 8) × 30          slower response costs up to 30
 *      − ((100 − coverage%) / 100) × 25      uncovered hours cost up to 25
 *      − 20 if missed calls/wk > 10, 12 if > 5, 6 if > 0
 *      − 15 if conversion < 10%, 8 if < 20%
 *      − 10 if follow-up attempts < 3
 *      clamp to 0–100 and round.
 *
 * 2. Marketing Waste vs Total Leakage: in the legacy file the teaser bar and the
 *    results bar are both built from `leakageBreakdown`, whose three segments are
 *    Slow Response, Missed Calls and Dead Leads. Marketing Waste is NOT a
 *    segment and is not in Total Leakage. The two figures are consistent; the
 *    waste figure is shown separately as a metric card only.
 *
 * 3. dormantProspects (`prospects`) = leads not converted over the last
 *    12 months: max(0, monthlyLeads × 12 − monthlyLeads × convRate × 12).
 *
 * Other legacy behaviours kept for parity:
 * - Reactivation rates of 0 fall back to the defaults (12 / 60 / 25), because
 *   legacy used `parseFloat(x) || default`. Validation now blocks 0.
 * - "6+" follow-up attempts parses to 6.
 */
import { HIGH_CONV_HOURS, MISSED_CALL_RECOVERABLE_SHARE, REACTIVATION_DEFAULTS, RESPONSE_TIMES } from "./constants";
import type { CalculatorInputs, CalculatorResults, Grade, LeakageSegment } from "./types";

export function scoreGrade(score: number): Grade {
  if (score >= 85) return { grade: "A", label: "Excellent", color: "#22c55e" };
  if (score >= 70) return { grade: "B", label: "Good", color: "#84cc16" };
  if (score >= 55) return { grade: "C", label: "Average", color: "#eab308" };
  if (score >= 40) return { grade: "D", label: "Poor", color: "#f97316" };
  return { grade: "F", label: "Critical", color: "#ef4444" };
}

/** Legacy `parseFloat(x) || fallback`: NaN and 0 both fall back. */
const orDefault = (n: number, fallback: number) => (Number.isFinite(n) && n !== 0 ? n : fallback);

export function calcResults(d: CalculatorInputs): CalculatorResults {
  const sym = d.currency;
  const saleVal = orDefault(d.avgSaleValue, 0);
  const monthlyLeads = orDefault(d.monthlyLeadVolume, 0);
  const monthlySpend = orDefault(d.monthlyMarketingSpend, 0);
  const convRate = orDefault(d.conversionRate, 0) / 100;
  const missedCallsWeekly = orDefault(d.missedCallsWeekly, 0);
  const followUpAttempts = parseInt(d.followUpAttempts, 10) || 1;
  const rtIdx = d.responseTimeIdx ?? 4;
  const rt = RESPONSE_TIMES[rtIdx] ?? RESPONSE_TIMES[4]!;

  // Annual revenue (current performance)
  const monthlyCustomers = monthlyLeads * convRate;
  const annualRevenue = monthlyCustomers * saleVal * 12;

  // Marketing waste
  const costPerLead = monthlyLeads > 0 ? monthlySpend / monthlyLeads : 0;
  const unconvertedLeads = monthlyLeads * (1 - convRate);
  const annualWaste = unconvertedLeads * costPerLead * 12;

  // CPA
  const cpa = monthlyCustomers > 0 ? monthlySpend / monthlyCustomers : 0;
  const potentialCPA = cpa * rt.multiplier;

  // Speed to lead: revenue at the optimal (≤1 min) band minus current revenue
  const optimalRevenue = annualRevenue / rt.multiplier;
  const speedLeakage = optimalRevenue - annualRevenue;

  // Coverage
  const startH = d.workStart ?? 9;
  const endH = d.workEnd ?? 17;
  const activeDays = d.activeDays ? d.activeDays.filter(Boolean).length : 5;
  const dailyCoveredHours = Math.max(0, endH - startH);
  const weeklyHours = dailyCoveredHours * activeDays;
  const coveragePct = Math.round((weeklyHours / 168) * 100);
  const industryAvgCoverage = 35;
  const highConvCoveredHours = HIGH_CONV_HOURS.filter((h) => h >= startH && h < endH).length * activeDays;
  const totalHighConvHours = HIGH_CONV_HOURS.length * 7;
  const highConvCoverage = Math.round((highConvCoveredHours / totalHighConvHours) * 100);

  // Missed calls
  const annualMissed = missedCallsWeekly * 52;
  const revLostMissed = annualMissed * saleVal;
  const recoverableRev = revLostMissed * MISSED_CALL_RECOVERABLE_SHARE;

  // Dormant leads / reactivation (4-step formula)
  const monthsAccumulated = 12;
  const prospects = Math.max(0, monthlyLeads * monthsAccumulated - monthlyLeads * convRate * monthsAccumulated);
  const acquisitionCostSpent = prospects * costPerLead;

  const reactivationResponseRate = orDefault(d.reactResponseRate, REACTIVATION_DEFAULTS.response) / 100;
  const reactivationQualRate = orDefault(d.reactQualRate, REACTIVATION_DEFAULTS.qualified) / 100;
  const reactivationCloseRate = orDefault(d.reactCloseRate, REACTIVATION_DEFAULTS.close) / 100;
  const reactStep1 = prospects * reactivationResponseRate;
  const reactStep2 = reactStep1 * reactivationQualRate;
  const reactStep3 = reactStep2 * reactivationCloseRate;
  const reactRevenue = reactStep3 * saleVal;
  const reactivationData = [1, 2, 3, 5, 8].map((rr) => ({
    rate: `${rr}%`,
    revenue: Math.round(prospects * (rr / 100) * reactivationQualRate * reactivationCloseRate * saleVal),
  }));

  // Pipeline health score (see header comment)
  let score = 100;
  score -= (rtIdx / 8) * 30;
  score -= ((100 - coveragePct) / 100) * 25;
  if (missedCallsWeekly > 10) score -= 20;
  else if (missedCallsWeekly > 5) score -= 12;
  else if (missedCallsWeekly > 0) score -= 6;
  if (convRate < 0.1) score -= 15;
  else if (convRate < 0.2) score -= 8;
  if (followUpAttempts < 3) score -= 10;
  score = Math.max(0, Math.min(100, Math.round(score)));

  // Total money left on the table
  const reactivationOpportunity = reactRevenue;
  const totalLeakage = speedLeakage + revLostMissed + reactivationOpportunity;
  const safeTotalLeakage = totalLeakage || 1;
  const leakageBreakdown: LeakageSegment[] = [
    { key: "speed", label: "Slow Response", value: speedLeakage, pct: Math.round((speedLeakage / safeTotalLeakage) * 100) },
    { key: "missed", label: "Missed Calls", value: revLostMissed, pct: Math.round((revLostMissed / safeTotalLeakage) * 100) },
    {
      key: "reactivation",
      label: "Dead Leads",
      value: reactivationOpportunity,
      pct: Math.round((reactivationOpportunity / safeTotalLeakage) * 100),
    },
  ];
  const leakPct = annualRevenue > 0 ? Math.round((totalLeakage / (annualRevenue + totalLeakage)) * 100) : 0;

  return {
    sym,
    saleVal,
    monthlyLeads,
    monthlySpend,
    convRate,
    annualRevenue,
    annualWaste,
    cpa,
    potentialCPA,
    rt,
    rtIdx,
    speedLeakage,
    optimalRevenue,
    coveragePct,
    weeklyHours,
    industryAvgCoverage,
    highConvCoverage,
    annualMissed,
    revLostMissed,
    recoverableRev,
    prospects,
    acquisitionCostSpent,
    reactivationData,
    reactStep1,
    reactStep2,
    reactStep3,
    reactRevenue,
    reactivationResponseRate,
    reactivationQualRate,
    reactivationCloseRate,
    score,
    costPerLead,
    activeDays,
    totalLeakage,
    leakageBreakdown,
    reactivationOpportunity,
    leakPct,
  };
}

/** Revenue by response band, anchored on the prospect's current band. */
export function speedCurve(r: CalculatorResults) {
  return RESPONSE_TIMES.map((rt, i) => ({
    name: rt.label,
    revenue: Math.round((r.annualRevenue / r.rt.multiplier) * rt.multiplier),
    current: i === r.rtIdx,
  }));
}

/** Whether a given (dayIndex, hour) is inside working hours. */
export function isCovered(activeDays: boolean[], start: number, end: number, day: number, hour: number) {
  return Boolean(activeDays[day]) && hour >= start && hour < end;
}
