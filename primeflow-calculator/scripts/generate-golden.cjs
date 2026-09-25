// Runs the legacy engine (verbatim extract) over varied inputs and writes the
// golden fixtures the new engine must match to the cent.
//   node scripts/generate-golden.cjs
const fs = require("fs");
const path = require("path");
const { calcResults } = require("./legacy-calc.cjs");

const WEEKDAYS = [true, true, true, true, true, false, false];
const ALL = [true, true, true, true, true, true, true];
const ONE = [false, false, true, false, false, false, false];

const base = {
  currency: "$", avgSaleValue: 2500, monthlyLeadVolume: 50, monthlyMarketingSpend: 3000,
  responseTimeIdx: 4, workStart: 9, workEnd: 17, activeDays: WEEKDAYS,
  missedCallsWeekly: 8, conversionRate: 15, followUpAttempts: "3",
  followUpChannels: ["Phone", "Email"], reactResponseRate: 12, reactQualRate: 60, reactCloseRate: 25,
};

const cases = [
  ["baseline", {}],
  ["tiny business, 5 leads/month", { monthlyLeadVolume: 5, avgSaleValue: 800, monthlyMarketingSpend: 250, conversionRate: 20, missedCallsWeekly: 2 }],
  ["large business, 2000 leads/month", { monthlyLeadVolume: 2000, avgSaleValue: 450, monthlyMarketingSpend: 60000, conversionRate: 6, missedCallsWeekly: 45, responseTimeIdx: 6 }],
  ["1-minute response", { responseTimeIdx: 0, followUpAttempts: "6+", conversionRate: 32 }],
  ["1-day response", { responseTimeIdx: 8, followUpAttempts: "1", conversionRate: 4 }],
  ["zero missed calls", { missedCallsWeekly: 0, responseTimeIdx: 2 }],
  ["one active day", { activeDays: ONE, workStart: 10, workEnd: 14 }],
  ["24/7 coverage, pounds", { currency: "£", activeDays: ALL, workStart: 0, workEnd: 23, responseTimeIdx: 1 }],
  ["high-ticket consulting, euros", { currency: "€", avgSaleValue: 18000, monthlyLeadVolume: 12, monthlyMarketingSpend: 4500, conversionRate: 25, missedCallsWeekly: 1, responseTimeIdx: 5, followUpAttempts: "2" }],
  ["custom reactivation assumptions", { reactResponseRate: 5, reactQualRate: 40, reactCloseRate: 15, responseTimeIdx: 3 }],
  ["zero marketing spend, early start", { monthlyMarketingSpend: 0, workStart: 6, workEnd: 19, missedCallsWeekly: 11, responseTimeIdx: 7 }],
  ["decimal inputs", { avgSaleValue: 1234.56, monthlyLeadVolume: 37, monthlyMarketingSpend: 2890.5, conversionRate: 12.5, missedCallsWeekly: 3.5, followUpAttempts: "4" }],
];

// Legacy form state held strings; feed it the same way.
const asLegacyForm = (i) => ({
  ...i,
  avgSaleValue: String(i.avgSaleValue), monthlyLeadVolume: String(i.monthlyLeadVolume),
  monthlyMarketingSpend: String(i.monthlyMarketingSpend), missedCallsWeekly: String(i.missedCallsWeekly),
  conversionRate: String(i.conversionRate), reactResponseRate: String(i.reactResponseRate),
  reactQualRate: String(i.reactQualRate), reactCloseRate: String(i.reactCloseRate),
});

const fixtures = cases.map(([name, over]) => {
  const inputs = { ...base, ...over };
  const out = calcResults(asLegacyForm(inputs));
  return { name, inputs, expected: out };
});

const target = path.join(__dirname, "..", "src", "lib", "__fixtures__", "legacy-golden.json");
fs.writeFileSync(target, JSON.stringify(fixtures, null, 2) + "\n");
console.log(`wrote ${fixtures.length} fixtures to ${path.relative(process.cwd(), target)}`);
