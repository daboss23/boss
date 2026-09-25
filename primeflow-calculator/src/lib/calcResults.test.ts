import { describe, expect, it } from "vitest";
import golden from "./__fixtures__/legacy-golden.json";
import { calcResults, scoreGrade } from "./calcResults";
import type { CalculatorInputs } from "./types";

/**
 * Golden tests: every fixture was produced by running the verbatim legacy
 * engine (scripts/legacy-calc.cjs) over the same inputs. See
 * scripts/generate-golden.cjs. The new engine must match every number.
 */
const NUMERIC_KEYS = [
  "saleVal",
  "monthlyLeads",
  "monthlySpend",
  "convRate",
  "annualRevenue",
  "annualWaste",
  "cpa",
  "potentialCPA",
  "speedLeakage",
  "optimalRevenue",
  "coveragePct",
  "weeklyHours",
  "industryAvgCoverage",
  "highConvCoverage",
  "annualMissed",
  "revLostMissed",
  "recoverableRev",
  "prospects",
  "acquisitionCostSpent",
  "reactStep1",
  "reactStep2",
  "reactStep3",
  "reactRevenue",
  "reactivationResponseRate",
  "reactivationQualRate",
  "reactivationCloseRate",
  "score",
  "costPerLead",
  "activeDays",
  "totalLeakage",
  "reactivationOpportunity",
] as const;

const cents = (n: number) => Math.round(n * 100);

describe("calcResults matches legacy golden fixtures", () => {
  it("has 12 fixtures", () => {
    expect(golden).toHaveLength(12);
  });

  for (const fx of golden) {
    it(fx.name, () => {
      const out = calcResults(fx.inputs as unknown as CalculatorInputs);
      const expected = fx.expected as Record<string, unknown>;

      for (const key of NUMERIC_KEYS) {
        const want = expected[key] as number;
        const got = out[key] as number;
        expect(cents(got), `${key}`).toBe(cents(want));
      }

      expect(out.sym).toBe(expected.sym);
      expect(out.rt).toEqual(expected.rt);
      expect(out.reactivationData).toEqual(expected.reactivationData);
      expect(out.leakageBreakdown.map(({ label, value, pct }) => ({ label, value: cents(value), pct }))).toEqual(
        (expected.leakageBreakdown as { label: string; value: number; pct: number }[]).map(({ label, value, pct }) => ({
          label,
          value: cents(value),
          pct,
        })),
      );
    });
  }
});

describe("grades", () => {
  it.each([
    [100, "A"],
    [85, "A"],
    [84, "B"],
    [70, "B"],
    [69, "C"],
    [55, "C"],
    [54, "D"],
    [40, "D"],
    [39, "F"],
    [0, "F"],
  ])("score %i → %s", (score, grade) => {
    expect(scoreGrade(score).grade).toBe(grade);
  });
});

describe("specificity", () => {
  it("two different businesses never get the same numbers", () => {
    const a = calcResults(golden[0]!.inputs as unknown as CalculatorInputs);
    const b = calcResults(golden[1]!.inputs as unknown as CalculatorInputs);
    expect(a.totalLeakage).not.toBe(b.totalLeakage);
  });

  it("has no floor: a tiny business gets a small real number", () => {
    const tiny = calcResults({
      ...(golden[0]!.inputs as unknown as CalculatorInputs),
      avgSaleValue: 40,
      monthlyLeadVolume: 3,
      missedCallsWeekly: 0,
      responseTimeIdx: 0,
    });
    expect(tiny.totalLeakage).toBeGreaterThan(0);
    expect(tiny.totalLeakage).toBeLessThan(15000);
  });
});
