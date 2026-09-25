import type { INDUSTRIES, CURRENCIES, FOLLOW_UP_OPTIONS, CHANNELS } from "./constants";

export type Currency = (typeof CURRENCIES)[number];
export type Industry = (typeof INDUSTRIES)[number];
export type FollowUpAttempts = (typeof FOLLOW_UP_OPTIONS)[number];
export type Channel = (typeof CHANNELS)[number];

/** Validated, typed inputs. The engine only ever runs on this shape. */
export interface CalculatorInputs {
  businessName?: string;
  industry?: Industry;
  websiteUrl?: string;
  currency: Currency;
  avgSaleValue: number;
  monthlyLeadVolume: number;
  monthlyMarketingSpend: number;
  /** Index into RESPONSE_TIMES (0 = ≤1 min … 8 = 1 day). */
  responseTimeIdx: number;
  /** Hour of day, 0–23. */
  workStart: number;
  /** Hour of day, 0–23. Must be after workStart. */
  workEnd: number;
  /** Mon → Sun. */
  activeDays: boolean[];
  missedCallsWeekly: number;
  /** Percent, 0.1–100. */
  conversionRate: number;
  followUpAttempts: FollowUpAttempts;
  followUpChannels: Channel[];
  /** Percent. */
  reactResponseRate: number;
  reactQualRate: number;
  reactCloseRate: number;
}

/** Raw form state: number fields are strings so inputs can be empty. */
export type FormState = Omit<
  CalculatorInputs,
  | "avgSaleValue"
  | "monthlyLeadVolume"
  | "monthlyMarketingSpend"
  | "missedCallsWeekly"
  | "conversionRate"
  | "reactResponseRate"
  | "reactQualRate"
  | "reactCloseRate"
  | "industry"
> & {
  industry: Industry | "";
  avgSaleValue: string;
  monthlyLeadVolume: string;
  monthlyMarketingSpend: string;
  missedCallsWeekly: string;
  conversionRate: string;
  reactResponseRate: string;
  reactQualRate: string;
  reactCloseRate: string;
};

export interface ResponseTime {
  label: string;
  minutes: number;
  multiplier: number;
}

export interface LeakageSegment {
  key: "speed" | "missed" | "reactivation";
  label: string;
  value: number;
  pct: number;
}

export interface CalculatorResults {
  sym: Currency;
  saleVal: number;
  monthlyLeads: number;
  monthlySpend: number;
  convRate: number;
  annualRevenue: number;
  annualWaste: number;
  cpa: number;
  potentialCPA: number;
  rt: ResponseTime;
  rtIdx: number;
  speedLeakage: number;
  optimalRevenue: number;
  coveragePct: number;
  weeklyHours: number;
  industryAvgCoverage: number;
  highConvCoverage: number;
  annualMissed: number;
  revLostMissed: number;
  recoverableRev: number;
  prospects: number;
  acquisitionCostSpent: number;
  reactivationData: { rate: string; revenue: number }[];
  reactStep1: number;
  reactStep2: number;
  reactStep3: number;
  reactRevenue: number;
  reactivationResponseRate: number;
  reactivationQualRate: number;
  reactivationCloseRate: number;
  score: number;
  costPerLead: number;
  activeDays: number;
  totalLeakage: number;
  leakageBreakdown: LeakageSegment[];
  reactivationOpportunity: number;
  /** Share of potential revenue lost: total / (annual + total). */
  leakPct: number;
}

export interface Grade {
  grade: "A" | "B" | "C" | "D" | "F";
  label: string;
  color: string;
}

export type SignalKey =
  | "liveChat"
  | "onlineBooking"
  | "clickToCall"
  | "smsWhatsapp"
  | "leadForm"
  | "trackingPixels";

export interface SiteSignal {
  key: SignalKey;
  label: string;
  present: boolean;
  /** Vendors or evidence detected, e.g. ["Intercom"] or ["Meta Pixel", "GA4"]. */
  detail: string[];
}

export interface SiteHours {
  /** Mon → Sun. */
  days: boolean[];
  start: number;
  end: number;
}

/** Output of /api/analyze-site. Never contains guesses presented as facts. */
export interface SiteScan {
  url: string;
  domain: string;
  businessName: string | null;
  industry: Industry | null;
  /** Short plural business type, e.g. "physiotherapy clinics". Keys industry research. */
  segment: string | null;
  location: { city: string | null; country: string | null } | null;
  services: string[];
  hours: SiteHours | null;
  priceSignals: { label: string; amount: number; currency: string | null }[];
  reviewCount: number | null;
  rating: number | null;
  phone: string | null;
  signals: SiteSignal[];
  /** After-hours coverage derived from listed hours vs high-conversion windows. */
  afterHoursGap: boolean | null;
  confidence: "high" | "medium" | "low";
}

export type FieldSource = "site" | "industry" | "research";

export interface ResearchComparison {
  metric: "avg_sale_value" | "conversion_rate" | "missed_call_share" | "cost_per_lead" | "response_time_minutes";
  label: string;
  yours: number;
  industry: number;
  unit: "currency" | "percent" | "minutes";
  higherIsBetter: boolean;
  gapValue: number | null;
}

/** Public, source-stripped research payload. */
export interface PublicResearch {
  key: string;
  status: "pending" | "ready" | "failed";
  industry?: string;
  segment?: string;
  country?: string;
  city?: string | null;
  stats?: { metric: string; value: number; unit: string; context: string; year: number }[];
  trends?: string[];
  researched_at?: string;
}

export interface SavedReport {
  id: string;
  createdAt: string;
  name: string;
  inputs: CalculatorInputs;
  results: CalculatorResults;
  diagnosis: string | null;
  siteScan: SiteScan | null;
  research: PublicResearch | null;
}
