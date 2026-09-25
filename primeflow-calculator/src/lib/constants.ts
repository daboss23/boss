import type { ResponseTime } from "./types";

export const CURRENCIES = ["$", "£", "€"] as const;
export const CURRENCY_CODES: Record<(typeof CURRENCIES)[number], string> = { $: "USD", "£": "GBP", "€": "EUR" };

export const INDUSTRIES = [
  "Home Services",
  "Trades & Construction",
  "Health & Wellness",
  "Real Estate",
  "Finance & Insurance",
  "Legal",
  "Coaching & Consulting",
  "Ecommerce",
  "Other",
] as const;

export const FOLLOW_UP_OPTIONS = ["1", "2", "3", "4", "5", "6+"] as const;
export const CHANNELS = ["Phone", "Email", "SMS", "WhatsApp"] as const;

/** Conversion multiplier by response band. ≤1 min is the optimal baseline. */
export const RESPONSE_TIMES: readonly ResponseTime[] = [
  { label: "≤1 min", minutes: 1, multiplier: 1.0 },
  { label: "5 min", minutes: 5, multiplier: 0.92 },
  { label: "10 min", minutes: 10, multiplier: 0.82 },
  { label: "30 min", minutes: 30, multiplier: 0.68 },
  { label: "1 hr", minutes: 60, multiplier: 0.52 },
  { label: "3 hrs", minutes: 180, multiplier: 0.38 },
  { label: "6 hrs", minutes: 360, multiplier: 0.26 },
  { label: "12 hrs", minutes: 720, multiplier: 0.17 },
  { label: "1 day", minutes: 1440, multiplier: 0.1 },
];

export const DEFAULT_RESPONSE_TIME_IDX = 4;

/** 6–9am and 4–7pm. */
export const HIGH_CONV_HOURS = [6, 7, 8, 16, 17, 18] as const;

export const DAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"] as const;

export const HOURS = Array.from({ length: 24 }, (_, i) => {
  const h = i % 12 === 0 ? 12 : i % 12;
  return { value: i, label: `${h}:00 ${i < 12 ? "AM" : "PM"}` };
});

export const REACTIVATION_DEFAULTS = { response: 12, qualified: 60, close: 25 } as const;

/** Missed calls: share assumed recoverable by instant text-back / AI reception. */
export const MISSED_CALL_RECOVERABLE_SHARE = 0.3;

/** ROI flip scenario. */
export const ROI_SCENARIO_SHARE = 0.2;

