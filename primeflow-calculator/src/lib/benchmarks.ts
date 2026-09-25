/**
 * Industry defaults used to pre-fill fields the prospect hasn't entered.
 *
 * OWNER-SUPPLIED NUMBERS ONLY. Never generate or "improve" these with AI.
 * The AI classifies the industry; this table supplies the numbers, so every
 * default is consistent and defensible.
 *
 * ⚠ PLACEHOLDERS: every value below is marked `placeholder: true` until the
 * owner approves or replaces it. They are shown to prospects as
 * "Industry average" and are always editable.
 */
import type { Industry } from "./types";

export interface Benchmark {
  avgSaleValue: number;
  conversionRate: number;
  missedCallsWeekly: number;
  reactResponseRate: number;
  reactQualRate: number;
  reactCloseRate: number;
  /** True until the owner signs off on this row. */
  placeholder: boolean;
}

export const BENCHMARKS: Record<Industry, Benchmark> = {
  "Home Services": {
    avgSaleValue: 650,
    conversionRate: 18,
    missedCallsWeekly: 12,
    reactResponseRate: 12,
    reactQualRate: 60,
    reactCloseRate: 25,
    placeholder: true,
  },
  "Trades & Construction": {
    avgSaleValue: 4500,
    conversionRate: 15,
    missedCallsWeekly: 10,
    reactResponseRate: 10,
    reactQualRate: 55,
    reactCloseRate: 22,
    placeholder: true,
  },
  "Health & Wellness": {
    avgSaleValue: 180,
    conversionRate: 22,
    missedCallsWeekly: 15,
    reactResponseRate: 14,
    reactQualRate: 65,
    reactCloseRate: 30,
    placeholder: true,
  },
  "Real Estate": {
    avgSaleValue: 9000,
    conversionRate: 3,
    missedCallsWeekly: 8,
    reactResponseRate: 8,
    reactQualRate: 50,
    reactCloseRate: 15,
    placeholder: true,
  },
  "Finance & Insurance": {
    avgSaleValue: 1800,
    conversionRate: 10,
    missedCallsWeekly: 6,
    reactResponseRate: 10,
    reactQualRate: 55,
    reactCloseRate: 20,
    placeholder: true,
  },
  Legal: {
    avgSaleValue: 3500,
    conversionRate: 12,
    missedCallsWeekly: 7,
    reactResponseRate: 9,
    reactQualRate: 50,
    reactCloseRate: 20,
    placeholder: true,
  },
  "Coaching & Consulting": {
    avgSaleValue: 2500,
    conversionRate: 15,
    missedCallsWeekly: 3,
    reactResponseRate: 12,
    reactQualRate: 60,
    reactCloseRate: 25,
    placeholder: true,
  },
  Ecommerce: {
    avgSaleValue: 95,
    conversionRate: 3,
    missedCallsWeekly: 2,
    reactResponseRate: 6,
    reactQualRate: 70,
    reactCloseRate: 35,
    placeholder: true,
  },
  Other: {
    avgSaleValue: 1500,
    conversionRate: 15,
    missedCallsWeekly: 8,
    reactResponseRate: 12,
    reactQualRate: 60,
    reactCloseRate: 25,
    placeholder: true,
  },
};

/** Hard sanity bounds applied to researched numbers before any use. */
export const RESEARCH_BOUNDS = {
  conversionRate: { min: 0.1, max: 80 },
  /** Average sale value must be within this factor of the benchmark row. */
  avgSaleValueFactor: 20,
  missedCallShare: { min: 1, max: 80 },
  responseTimeMinutes: { min: 0.5, max: 60 * 24 * 7 },
} as const;
