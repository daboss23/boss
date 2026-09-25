// Verbatim extract of calcResults() and its constants from legacy/index.html.
// Used only by scripts/generate-golden.cjs to produce golden fixtures. Never edit.
const CURRENCIES = { "$": "USD", "£": "GBP", "€": "EUR" };

const RESPONSE_TIMES = [
  { label: "≤1 min", minutes: 1, multiplier: 1.0 },
  { label: "5 min", minutes: 5, multiplier: 0.92 },
  { label: "10 min", minutes: 10, multiplier: 0.82 },
  { label: "30 min", minutes: 30, multiplier: 0.68 },
  { label: "1 hr", minutes: 60, multiplier: 0.52 },
  { label: "3 hrs", minutes: 180, multiplier: 0.38 },
  { label: "6 hrs", minutes: 360, multiplier: 0.26 },
  { label: "12 hrs", minutes: 720, multiplier: 0.17 },
  { label: "1 day", minutes: 1440, multiplier: 0.10 },
];

const HOURS = Array.from({ length: 24 }, (_, i) => {
  const h = i % 12 === 0 ? 12 : i % 12;
  const ampm = i < 12 ? "AM" : "PM";
  return { value: i, label: `${h}:00 ${ampm}` };
});

const DAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
const HIGH_CONV_HOURS = [6, 7, 8, 16, 17, 18]; // 6-9am, 4-7pm

function fmt(sym, n) {
  if (n >= 1000000) return `${sym}${(n / 1000000).toFixed(1)}M`;
  if (n >= 1000) return `${sym}${(n / 1000).toFixed(0)}K`;
  return `${sym}${Math.round(n).toLocaleString()}`;
}

function scoreGrade(score) {
  if (score >= 85) return { grade: "A", label: "Excellent", color: "#22c55e" };
  if (score >= 70) return { grade: "B", label: "Good", color: "#84cc16" };
  if (score >= 55) return { grade: "C", label: "Average", color: "#eab308" };
  if (score >= 40) return { grade: "D", label: "Poor", color: "#f97316" };
  return { grade: "F", label: "Critical", color: "#ef4444" };
}

function calcResults(d) {
  const sym = d.currency;
  const saleVal = parseFloat(d.avgSaleValue) || 0;
  const monthlyLeads = parseFloat(d.monthlyLeadVolume) || 0;
  const monthlySpend = parseFloat(d.monthlyMarketingSpend) || 0;
  const convRate = (parseFloat(d.conversionRate) || 0) / 100;
  const missedCallsWeekly = parseFloat(d.missedCallsWeekly) || 0;
  const followUpAttempts = parseInt(d.followUpAttempts) || 1;
  const rtIdx = d.responseTimeIdx ?? 4;
  const rt = RESPONSE_TIMES[rtIdx];

  // Annual Revenue (current performance)
  const monthlyCustomers = monthlyLeads * convRate;
  const annualRevenue = monthlyCustomers * saleVal * 12;

  // Marketing waste
  const costPerLead = monthlyLeads > 0 ? monthlySpend / monthlyLeads : 0;
  const annualSpend = monthlySpend * 12;
  const unconvertedLeads = monthlyLeads * (1 - convRate);
  const annualWaste = unconvertedLeads * costPerLead * 12;

  // CPA
  const cpa = monthlyCustomers > 0 ? monthlySpend / monthlyCustomers : 0;
  const potentialCPA = cpa * rt.multiplier;

  // Speed to lead
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
  const highConvCoveredHours = HIGH_CONV_HOURS.filter(h => h >= startH && h < endH).length * activeDays;
  const totalHighConvHours = HIGH_CONV_HOURS.length * 7;
  const highConvCoverage = Math.round((highConvCoveredHours / totalHighConvHours) * 100);

  // Missed calls
  const annualMissed = missedCallsWeekly * 52;
  const revLostMissed = annualMissed * saleVal;
  const recoverableRev = revLostMissed * 0.3;

  // Dead leads / reactivation — proper 4-step formula
  const monthsAccumulated = 12;
  const prospects = Math.max(0, monthlyLeads * monthsAccumulated - (monthlyLeads * convRate * monthsAccumulated));
  const acquisitionCostSpent = prospects * costPerLead;

  // 4-step formula with user inputs (defaults: response 12%, qualified 60%, close 25%)
  const reactivationResponseRate = (parseFloat(d.reactResponseRate) || 12) / 100;
  const reactivationQualRate = (parseFloat(d.reactQualRate) || 60) / 100;
  const reactivationCloseRate = (parseFloat(d.reactCloseRate) || 25) / 100;
  const reactStep1 = prospects * reactivationResponseRate;           // responding leads
  const reactStep2 = reactStep1 * reactivationQualRate;             // qualified prospects
  const reactStep3 = reactStep2 * reactivationCloseRate;            // closed deals
  const reactRevenue = reactStep3 * saleVal;                        // revenue
  const reactivationData = [1, 2, 3, 5, 8].map(rr => ({
    rate: `${rr}%`,
    revenue: Math.round(prospects * (rr / 100) * reactivationQualRate * reactivationCloseRate * saleVal),
  }));

  // Pipeline health score
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
  const leakageBreakdown = [
    { label: "Slow Response", value: speedLeakage, pct: Math.round((speedLeakage / safeTotalLeakage) * 100) },
    { label: "Missed Calls", value: revLostMissed, pct: Math.round((revLostMissed / safeTotalLeakage) * 100) },
    { label: "Dead Leads", value: reactivationOpportunity, pct: Math.round((reactivationOpportunity / safeTotalLeakage) * 100) },
  ];

  return {
    sym, saleVal, monthlyLeads, monthlySpend, convRate,
    annualRevenue, annualWaste, cpa, potentialCPA,
    rt, speedLeakage, optimalRevenue,
    coveragePct, weeklyHours, industryAvgCoverage, highConvCoverage,
    annualMissed, revLostMissed, recoverableRev,
    prospects, acquisitionCostSpent, reactivationData,
    reactStep1, reactStep2, reactStep3, reactRevenue,
    reactivationResponseRate, reactivationQualRate, reactivationCloseRate,
    score, costPerLead, activeDays,
    totalLeakage, leakageBreakdown, reactivationOpportunity,
  };
}
module.exports = { calcResults, RESPONSE_TIMES, scoreGrade };
