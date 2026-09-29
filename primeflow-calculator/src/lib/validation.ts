/**
 * Input rules shared by the client (step buttons, inline messages) and the
 * server (submit-lead). The engine never runs on anything that fails here.
 */
import { CHANNELS, CURRENCIES, FOLLOW_UP_OPTIONS, INDUSTRIES, RESPONSE_TIMES } from "./constants.js";
import type { CalculatorInputs, FormState } from "./types.js";

export type FieldErrors = Partial<Record<keyof FormState | "hours" | "name" | "email", string>>;

const num = (v: string) => (v.trim() === "" ? NaN : Number(v.replace(/,/g, "")));

type NumericRule = {
  key: keyof FormState;
  label: string;
  min: number;
  minInclusive: boolean;
  max: number;
  maxMsg: string;
};

const STEP1_RULES: NumericRule[] = [
  {
    key: "avgSaleValue",
    label: "Average sale value",
    min: 0,
    minInclusive: false,
    max: 10_000_000,
    maxMsg: "That's over 10 million per sale. Double-check for an extra zero.",
  },
  {
    key: "monthlyLeadVolume",
    label: "Monthly leads",
    min: 1,
    minInclusive: true,
    max: 1_000_000,
    maxMsg: "Over a million leads a month? Check for a typo.",
  },
  {
    key: "monthlyMarketingSpend",
    label: "Monthly marketing spend",
    min: 0,
    minInclusive: true,
    max: 100_000_000,
    maxMsg: "That spend looks like a typo. Check the number of zeros.",
  },
];

const STEP2_RULES: NumericRule[] = [
  {
    key: "missedCallsWeekly",
    label: "Missed calls",
    min: 0,
    minInclusive: true,
    max: 10_000,
    maxMsg: "Over 10,000 missed calls a week? Check for a typo.",
  },
  {
    key: "conversionRate",
    label: "Conversion rate",
    min: 0.1,
    minInclusive: true,
    max: 100,
    maxMsg: "A conversion rate can't be over 100%.",
  },
  {
    key: "reactResponseRate",
    label: "Response rate",
    min: 0.1,
    minInclusive: true,
    max: 100,
    maxMsg: "Keep this between 0.1% and 100%.",
  },
  {
    key: "reactQualRate",
    label: "Qualification rate",
    min: 0.1,
    minInclusive: true,
    max: 100,
    maxMsg: "Keep this between 0.1% and 100%.",
  },
  {
    key: "reactCloseRate",
    label: "Close rate",
    min: 0.1,
    minInclusive: true,
    max: 100,
    maxMsg: "Keep this between 0.1% and 100%.",
  },
];

function checkRules(form: FormState, rules: NumericRule[], errors: FieldErrors) {
  for (const r of rules) {
    const raw = String(form[r.key] ?? "");
    const v = num(raw);
    if (raw.trim() === "") errors[r.key] = `${r.label} is required.`;
    else if (!Number.isFinite(v)) errors[r.key] = "Enter a number.";
    else if (r.minInclusive ? v < r.min : v <= r.min)
      errors[r.key] =
        r.min === 0 && !r.minInclusive ? `${r.label} must be more than 0.` : `${r.label} must be at least ${r.min}.`;
    else if (v > r.max) errors[r.key] = r.maxMsg;
  }
}

export function validateStep1(form: FormState): FieldErrors {
  const errors: FieldErrors = {};
  checkRules(form, STEP1_RULES, errors);
  if (!CURRENCIES.includes(form.currency)) errors.currency = "Pick a currency.";
  if (form.industry && !INDUSTRIES.includes(form.industry)) errors.industry = "Pick an industry from the list.";
  if ((form.businessName ?? "").length > 120) errors.businessName = "Keep the business name under 120 characters.";
  if (!Number.isInteger(form.responseTimeIdx) || !RESPONSE_TIMES[form.responseTimeIdx])
    errors.responseTimeIdx = "Pick a response time.";
  if (!Array.isArray(form.activeDays) || form.activeDays.length !== 7 || !form.activeDays.some(Boolean))
    errors.activeDays = "Pick at least one day you're open.";
  if (!(form.workStart >= 0 && form.workStart <= 23 && form.workEnd >= 0 && form.workEnd <= 23))
    errors.hours = "Pick valid working hours.";
  else if (form.workEnd <= form.workStart) errors.hours = "Closing time needs to be after opening time.";
  return errors;
}

export function validateStep2(form: FormState): FieldErrors {
  const errors: FieldErrors = {};
  checkRules(form, STEP2_RULES, errors);
  if (!FOLLOW_UP_OPTIONS.includes(form.followUpAttempts)) errors.followUpAttempts = "Pick a number of attempts.";
  if (!Array.isArray(form.followUpChannels) || form.followUpChannels.some((c) => !CHANNELS.includes(c)))
    errors.followUpChannels = "Pick from the listed channels.";
  return errors;
}

export function validateForm(form: FormState): FieldErrors {
  return { ...validateStep1(form), ...validateStep2(form) };
}

export const isValid = (e: FieldErrors) => Object.keys(e).length === 0;

/** Converts validated form state to typed engine inputs. Call only after validateForm passes. */
export function toInputs(form: FormState): CalculatorInputs {
  const n = (v: string) => num(v);
  return {
    businessName: form.businessName?.trim() || undefined,
    industry: form.industry || undefined,
    websiteUrl: form.websiteUrl?.trim() || undefined,
    currency: form.currency,
    avgSaleValue: n(form.avgSaleValue),
    monthlyLeadVolume: n(form.monthlyLeadVolume),
    monthlyMarketingSpend: n(form.monthlyMarketingSpend),
    responseTimeIdx: form.responseTimeIdx,
    workStart: form.workStart,
    workEnd: form.workEnd,
    activeDays: [...form.activeDays],
    missedCallsWeekly: n(form.missedCallsWeekly),
    conversionRate: n(form.conversionRate),
    followUpAttempts: form.followUpAttempts,
    followUpChannels: [...form.followUpChannels],
    reactResponseRate: n(form.reactResponseRate),
    reactQualRate: n(form.reactQualRate),
    reactCloseRate: n(form.reactCloseRate),
  };
}

/** Converts engine inputs back to form state (e.g. rehydrating a saved report). */
export function toForm(i: CalculatorInputs): FormState {
  return {
    ...i,
    industry: i.industry ?? "",
    avgSaleValue: String(i.avgSaleValue),
    monthlyLeadVolume: String(i.monthlyLeadVolume),
    monthlyMarketingSpend: String(i.monthlyMarketingSpend),
    missedCallsWeekly: String(i.missedCallsWeekly),
    conversionRate: String(i.conversionRate),
    reactResponseRate: String(i.reactResponseRate),
    reactQualRate: String(i.reactQualRate),
    reactCloseRate: String(i.reactCloseRate),
  };
}

/**
 * Server-side: validate an untrusted JSON body and return typed inputs, or the
 * errors. Never trusts shape, types or numbers from the browser.
 */
export function parseInputs(body: unknown): { ok: true; inputs: CalculatorInputs } | { ok: false; errors: FieldErrors } {
  if (!body || typeof body !== "object") return { ok: false, errors: { currency: "Missing inputs." } };
  const b = body as Record<string, unknown>;
  const str = (v: unknown) => (typeof v === "number" ? String(v) : typeof v === "string" ? v : "");
  const int = (v: unknown, d: number) => (typeof v === "number" && Number.isInteger(v) ? v : d);
  const form: FormState = {
    businessName: typeof b.businessName === "string" ? b.businessName.slice(0, 200) : undefined,
    industry: (typeof b.industry === "string" ? b.industry : "") as FormState["industry"],
    websiteUrl: typeof b.websiteUrl === "string" ? b.websiteUrl.slice(0, 500) : undefined,
    currency: b.currency as FormState["currency"],
    avgSaleValue: str(b.avgSaleValue),
    monthlyLeadVolume: str(b.monthlyLeadVolume),
    monthlyMarketingSpend: str(b.monthlyMarketingSpend),
    responseTimeIdx: int(b.responseTimeIdx, -1),
    workStart: int(b.workStart, -1),
    workEnd: int(b.workEnd, -1),
    activeDays: Array.isArray(b.activeDays) ? b.activeDays.map(Boolean) : [],
    missedCallsWeekly: str(b.missedCallsWeekly),
    conversionRate: str(b.conversionRate),
    followUpAttempts: b.followUpAttempts as FormState["followUpAttempts"],
    followUpChannels: (Array.isArray(b.followUpChannels) ? b.followUpChannels : []) as FormState["followUpChannels"],
    reactResponseRate: str(b.reactResponseRate),
    reactQualRate: str(b.reactQualRate),
    reactCloseRate: str(b.reactCloseRate),
  };
  const errors = validateForm(form);
  if (!isValid(errors)) return { ok: false, errors };
  return { ok: true, inputs: toInputs(form) };
}

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

export function validateLead(name: string, email: string): FieldErrors {
  const errors: FieldErrors = {};
  const n = name.trim();
  const e = email.trim();
  if (!n) errors.name = "Enter your first name.";
  else if (n.length > 80) errors.name = "Keep your name under 80 characters.";
  if (!e) errors.email = "Enter your email so we can send the report.";
  else if (e.length > 254 || !EMAIL_RE.test(e)) errors.email = "That email doesn't look right.";
  return errors;
}
