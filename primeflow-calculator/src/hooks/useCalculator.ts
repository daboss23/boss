import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { api, ApiError, ApiUnavailable } from "../api";
import { BENCHMARKS, type Benchmark } from "../lib/benchmarks";
import { calcResults } from "../lib/calcResults";
import { DEFAULT_RESPONSE_TIME_IDX, REACTIVATION_DEFAULTS } from "../lib/constants";
import { fallbackDiagnosis } from "../lib/diagnosis";
import { currencyForCode, currencyForCountry, guessCountry } from "../lib/locale";
import { countryName, researchPrefills } from "../lib/research";
import { normalizeSiteUrl } from "../lib/siteSignals";
import type { CalculatorInputs, CalculatorResults, FieldSource, FormState, Industry, PublicResearch, SiteScan } from "../lib/types";
import { isValid, toInputs, validateLead, validateStep1, validateStep2, type FieldErrors } from "../lib/validation";
import { useTurnstile } from "./useTurnstile";

export type Stage = "scan" | "business" | "pipeline" | "gate" | "thinking" | "results";
export type ScanStatus = "idle" | "scanning" | "done" | "failed";

export const SCAN_FAIL_MESSAGE = "We couldn't read that site, no problem, just fill in the details below.";

export const INITIAL_FORM: FormState = {
  businessName: "",
  industry: "",
  websiteUrl: "",
  currency: "$",
  avgSaleValue: "",
  monthlyLeadVolume: "",
  monthlyMarketingSpend: "",
  responseTimeIdx: DEFAULT_RESPONSE_TIME_IDX,
  workStart: 9,
  workEnd: 17,
  activeDays: [true, true, true, true, true, false, false],
  missedCallsWeekly: "",
  conversionRate: "",
  followUpAttempts: "3",
  followUpChannels: ["Phone", "Email"],
  reactResponseRate: String(REACTIVATION_DEFAULTS.response),
  reactQualRate: String(REACTIVATION_DEFAULTS.qualified),
  reactCloseRate: String(REACTIVATION_DEFAULTS.close),
};

type Key = keyof FormState;
type Sources = Partial<Record<Key | "hours", FieldSource>>;

const BENCH_FIELDS = [
  "avgSaleValue",
  "conversionRate",
  "missedCallsWeekly",
  "reactResponseRate",
  "reactQualRate",
  "reactCloseRate",
] as const satisfies readonly (keyof Benchmark & Key)[];

const REACT_DEFAULTS: Partial<Record<Key, string>> = {
  reactResponseRate: String(REACTIVATION_DEFAULTS.response),
  reactQualRate: String(REACTIVATION_DEFAULTS.qualified),
  reactCloseRate: String(REACTIVATION_DEFAULTS.close),
};

const median = (xs: number[]) => {
  const s = [...xs].sort((a, b) => a - b);
  const m = Math.floor(s.length / 2);
  return s.length % 2 ? s[m]! : (s[m - 1]! + s[m]!) / 2;
};

export interface Diagnosis {
  status: "idle" | "loading" | "ready";
  text: string;
}

export function useCalculator() {
  const getToken = useTurnstile();

  const [stage, setStage] = useState<Stage>("scan");
  const [form, setForm] = useState<FormState>(INITIAL_FORM);
  const [touched, setTouched] = useState<Set<Key | "hours">>(new Set());
  const [sources, setSources] = useState<Sources>({});

  const [scanStatus, setScanStatus] = useState<ScanStatus>("idle");
  const [scanError, setScanError] = useState<string | null>(null);
  const [scan, setScan] = useState<SiteScan | null>(null);

  const [research, setResearch] = useState<PublicResearch | null>(null);
  const researchStarted = useRef<string | null>(null);
  const [toast, setToast] = useState<string | null>(null);

  const [lead, setLead] = useState<{ name: string } | null>(null);
  const [reportId, setReportId] = useState<string | null>(null);
  const [results, setResults] = useState<CalculatorResults | null>(null);
  const [inputs, setInputs] = useState<CalculatorInputs | null>(null);
  const [diagnosis, setDiagnosis] = useState<Diagnosis>({ status: "idle", text: "" });
  const [offline, setOffline] = useState(false);

  // Latest values for async callbacks.
  const live = useRef({ form, touched, sources });
  live.current = { form, touched, sources };

  /* ── Field edits ───────────────────────────────────────────────────── */

  const setField = useCallback(<K extends Key>(key: K, value: FormState[K]) => {
    setForm((f) => ({ ...f, [key]: value }));
    setTouched((t) => new Set(t).add(key));
    // Once the prospect edits a value, it is theirs: drop the source badge.
    setSources((s) => {
      if (!s[key]) return s;
      const next = { ...s };
      delete next[key];
      return next;
    });
  }, []);

  const setHours = useCallback((patch: Partial<Pick<FormState, "workStart" | "workEnd" | "activeDays">>) => {
    setForm((f) => ({ ...f, ...patch }));
    setTouched((t) => new Set(t).add("hours"));
    setSources((s) => {
      const next = { ...s };
      delete next.hours;
      return next;
    });
  }, []);

  /** Fills fields the prospect hasn't typed, with a source badge. Never overwrites user input. */
  const prefill = useCallback((values: Partial<Record<Key, string>>, source: FieldSource, canReplace: FieldSource[] = []) => {
    const { form: f, touched: t, sources: s } = live.current;
    const patch: Partial<FormState> = {};
    const srcPatch: Sources = {};
    for (const [k, v] of Object.entries(values) as [Key, string][]) {
      if (v === undefined || t.has(k)) continue;
      const current = String(f[k] ?? "");
      const isDefault = REACT_DEFAULTS[k] !== undefined && current === REACT_DEFAULTS[k];
      const existing = s[k];
      if (current === "" || isDefault || (existing && canReplace.includes(existing))) {
        (patch as Record<string, unknown>)[k] = v;
        srcPatch[k] = source;
      }
    }
    if (Object.keys(patch).length) {
      // Keep the ref current so back-to-back prefills in one tick see each other.
      live.current = { ...live.current, form: { ...f, ...patch }, sources: { ...s, ...srcPatch } };
      setForm((prev) => ({ ...prev, ...patch }));
      setSources((prev) => ({ ...prev, ...srcPatch }));
    }
    return Object.keys(patch).length;
  }, []);

  const applyBenchmark = useCallback(
    (industry: Industry, benchmark?: Benchmark | null) => {
      const b = benchmark ?? BENCHMARKS[industry];
      if (!b) return;
      const values: Partial<Record<Key, string>> = {};
      for (const k of BENCH_FIELDS) values[k] = String(b[k]);
      prefill(values, "industry", ["industry"]);
    },
    [prefill],
  );

  /* ── Industry research (background) ────────────────────────────────── */

  const startResearch = useCallback(
    async (p: { industry: Industry; segment?: string | null; country?: string | null; city?: string | null }) => {
      const country = (p.country || guessCountry()).toUpperCase();
      const sig = `${p.industry}|${p.segment ?? ""}|${country}|${p.city ?? ""}`;
      if (researchStarted.current === sig) return;
      researchStarted.current = sig;
      try {
        const token = await getToken();
        const r = await api.researchIndustry({ industry: p.industry, segment: p.segment, country, city: p.city, turnstileToken: token });
        if (researchStarted.current === sig) setResearch(r);
      } catch {
        /* Research is optional; benchmarks already cover the defaults. */
      }
    },
    [getToken],
  );

  // Poll while pending.
  useEffect(() => {
    if (research?.status !== "pending") return;
    let tries = 0;
    const key = research.key;
    const id = window.setInterval(async () => {
      tries++;
      try {
        const r = await api.researchStatus(key);
        if (r.status !== "pending") {
          setResearch(r);
          window.clearInterval(id);
        }
      } catch {
        /* keep polling */
      }
      if (tries > 60) {
        window.clearInterval(id);
        setResearch((cur) => (cur?.key === key ? { key, status: "failed" } : cur));
      }
    }, 3000);
    return () => window.clearInterval(id);
  }, [research?.status, research?.key]);

  // When research lands, fill still-empty (or benchmark-filled) fields.
  const appliedResearch = useRef<string | null>(null);
  useEffect(() => {
    if (research?.status !== "ready" || appliedResearch.current === research.key) return;
    appliedResearch.current = research.key;
    const filled = prefill(researchPrefills(research, live.current.form.currency), "research", ["industry"]);
    if (stage !== "results" && stage !== "thinking") {
      const seg = research.segment ?? research.industry ?? "your industry";
      setToast(`Industry data loaded for ${seg} in ${countryName(research.country)}${filled ? "" : ". Your numbers are unchanged"}`);
    }
  }, [research, prefill, stage]);

  /* ── Step 0: website scan ──────────────────────────────────────────── */

  const scanWebsite = useCallback(
    async (url: string) => {
      const norm = normalizeSiteUrl(url);
      if (!norm.ok) {
        setScanError(norm.reason);
        return;
      }
      setScanError(null);
      setScanStatus("scanning");
      setForm((f) => ({ ...f, websiteUrl: norm.url.href }));
      try {
        const token = await getToken();
        const res = await api.analyzeSite(norm.url.href, token);
        applyScan(res.scan, res.benchmark);
        setScan(res.scan);
        setScanStatus("done");
      } catch (err) {
        setScanError(err instanceof ApiError && err.status !== 422 ? err.message : SCAN_FAIL_MESSAGE);
        setScanStatus("failed");
      }
    },
    // applyScan only uses stable callbacks.
    [getToken],
  );

  function applyScan(s: SiteScan, benchmark: Benchmark | null) {
    const values: Partial<Record<Key, string>> = {};
    if (s.businessName) values.businessName = s.businessName;
    if (s.industry) values.industry = s.industry;
    prefill(values, "site");

    const { touched: t } = live.current;
    // Currency: from published prices first, then country.
    const priceCurrency = s.priceSignals.map((p) => currencyForCode(p.currency)).find(Boolean) ?? null;
    const cur = priceCurrency ?? currencyForCountry(s.location?.country);
    if (cur && !t.has("currency")) {
      setForm((f) => ({ ...f, currency: cur }));
      if (priceCurrency) setSources((p) => ({ ...p, currency: "site" }));
    }

    if (s.hours && !t.has("hours")) {
      const h = s.hours;
      setForm((f) => ({ ...f, workStart: h.start, workEnd: h.end, activeDays: [...h.days] }));
      setSources((p) => ({ ...p, hours: "site" }));
    }

    // Published prices → average sale value (labelled as found).
    const amounts = s.priceSignals
      .filter((p) => !p.currency || currencyForCode(p.currency) === (cur ?? live.current.form.currency))
      .map((p) => p.amount)
      .filter((n) => n > 0);
    if (amounts.length) prefill({ avgSaleValue: String(Math.round(median(amounts))) }, "site");

    if (s.industry) {
      applyBenchmark(s.industry, benchmark);
      void startResearch({ industry: s.industry, segment: s.segment, country: s.location?.country, city: s.location?.city });
    }
  }

  /** Picking an industry manually loads defaults for empty fields and starts research. */
  const chooseIndustry = useCallback(
    (industry: Industry | "") => {
      setField("industry", industry);
      if (!industry) return;
      applyBenchmark(industry);
      void startResearch({ industry, segment: scan?.segment ?? null, country: scan?.location?.country, city: scan?.location?.city });
    },
    [setField, applyBenchmark, startResearch, scan],
  );

  /* ── Validation ────────────────────────────────────────────────────── */

  const step1Errors = useMemo(() => validateStep1(form), [form]);
  const step2Errors = useMemo(() => validateStep2(form), [form]);
  const canContinue1 = isValid(step1Errors);
  const canContinue2 = isValid(step2Errors);

  /** Errors shown inline: only for fields the prospect has touched or that hold a value. */
  const visibleErrors = useCallback(
    (errors: FieldErrors): FieldErrors => {
      const out: FieldErrors = {};
      for (const [k, v] of Object.entries(errors) as [keyof FieldErrors, string][]) {
        const val = (form as unknown as Record<string, unknown>)[k];
        if (touched.has(k as Key) || (typeof val === "string" && val !== "") || k === "hours" || k === "activeDays") out[k] = v;
      }
      return out;
    },
    [form, touched],
  );

  const preview = useMemo(() => (canContinue1 && canContinue2 ? calcResults(toInputs(form)) : null), [form, canContinue1, canContinue2]);

  /* ── Lead gate ─────────────────────────────────────────────────────── */

  const requestDiagnosis = useCallback(async (id: string, i: CalculatorInputs, r: CalculatorResults, s: SiteScan | null) => {
    setDiagnosis({ status: "loading", text: "" });
    try {
      const d = await api.aiDiagnosis(id);
      setDiagnosis({ status: "ready", text: d.diagnosis });
    } catch {
      setDiagnosis({ status: "ready", text: fallbackDiagnosis(i, r, s) });
    }
  }, []);

  const submitLead = useCallback(
    async (name: string, email: string): Promise<FieldErrors | null> => {
      const errs = validateLead(name, email);
      if (!isValid(errs)) return errs;
      const i = toInputs(live.current.form);
      const local = calcResults(i);
      try {
        const token = await getToken();
        const res = await api.submitLead({ name: name.trim(), email: email.trim(), turnstileToken: token, inputs: i, researchKey: research?.key ?? null });
        setReportId(res.reportId);
        setResults(res.results);
        setInputs(i);
        setLead({ name: name.trim() });
        window.history.replaceState(null, "", `/r/${res.reportId}`);
        void requestDiagnosis(res.reportId, i, res.results, scan);
      } catch (err) {
        if (err instanceof ApiError) return { ...(err.fields ?? {}), email: err.fields?.email ?? err.message };
        if (!(err instanceof ApiUnavailable)) console.error(err);
        // Backend unreachable: never block the prospect. Show their report locally.
        console.warn("Lead API unavailable; showing a local report.");
        setOffline(true);
        setResults(local);
        setInputs(i);
        setLead({ name: name.trim() });
        setDiagnosis({ status: "ready", text: fallbackDiagnosis(i, local, scan) });
      }
      setStage("thinking");
      return null;
    },
    [getToken, research?.key, requestDiagnosis, scan],
  );

  const go = useCallback((s: Stage) => {
    setStage(s);
    window.scrollTo({ top: 0, behavior: window.matchMedia("(prefers-reduced-motion: reduce)").matches ? "auto" : "smooth" });
  }, []);

  return {
    stage,
    go,
    form,
    setField,
    setHours,
    sources,
    chooseIndustry,
    scanStatus,
    scanError,
    scan,
    scanWebsite,
    skipScan: () => go("business"),
    research,
    toast,
    dismissToast: () => setToast(null),
    step1Errors: visibleErrors(step1Errors),
    step2Errors: visibleErrors(step2Errors),
    rawStep1Errors: step1Errors,
    rawStep2Errors: step2Errors,
    canContinue1,
    canContinue2,
    preview,
    submitLead,
    lead,
    reportId,
    results,
    inputs,
    diagnosis,
    offline,
  };
}

export type Calculator = ReturnType<typeof useCalculator>;
