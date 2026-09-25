import type { Benchmark } from "./lib/benchmarks";
import type { CalculatorInputs, CalculatorResults, PublicResearch, SavedReport, SiteScan } from "./lib/types";

/**
 * Client for /api. `ApiUnavailable` means the backend isn't reachable (local
 * `vite` dev, outage): callers fall back to local calculation so the prospect
 * never sees a broken screen. `ApiError` is a real, user-facing rejection.
 */
export class ApiUnavailable extends Error {}
export class ApiError extends Error {
  constructor(
    message: string,
    public status: number,
    public fields?: Record<string, string>,
  ) {
    super(message);
  }
}

async function call<T>(path: string, init?: RequestInit & { timeoutMs?: number }): Promise<T> {
  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), init?.timeoutMs ?? 20_000);
  let res: Response;
  try {
    res = await fetch(path, {
      ...init,
      signal: ctrl.signal,
      headers: { "content-type": "application/json", ...(init?.headers ?? {}) },
    });
  } catch {
    throw new ApiUnavailable("network");
  } finally {
    clearTimeout(timer);
  }
  const isJson = (res.headers.get("content-type") ?? "").includes("application/json");
  if (!isJson || res.status === 404 || res.status === 405 || res.status >= 500) {
    if (isJson && res.status === 404) {
      const body = (await res.json().catch(() => ({}))) as { error?: string };
      throw new ApiError(body.error ?? "Not found.", 404);
    }
    throw new ApiUnavailable(String(res.status));
  }
  const body = (await res.json()) as T & { error?: string; fields?: Record<string, string> };
  if (!res.ok) throw new ApiError(body.error ?? "Something went wrong.", res.status, body.fields);
  return body;
}

const post = <T>(path: string, body: unknown, timeoutMs?: number) =>
  call<T>(path, { method: "POST", body: JSON.stringify(body), timeoutMs });

export const api = {
  analyzeSite: (url: string, turnstileToken: string) =>
    post<{ scan: SiteScan; benchmark: Benchmark | null; cached: boolean }>("/api/analyze-site", { url, turnstileToken }, 45_000),

  researchIndustry: (p: { industry: string; segment?: string | null; country: string; city?: string | null; turnstileToken: string }) =>
    post<PublicResearch>("/api/research-industry", p),

  researchStatus: (key: string) => call<PublicResearch>(`/api/research-status/${encodeURIComponent(key)}`),

  submitLead: (p: { name: string; email: string; turnstileToken: string; inputs: CalculatorInputs; researchKey: string | null }) =>
    post<{ reportId: string; results: CalculatorResults }>("/api/submit-lead", p),

  aiDiagnosis: (reportId: string) => post<{ diagnosis: string; source: string }>("/api/ai-diagnosis", { reportId }, 30_000),

  report: (id: string) => call<SavedReport>(`/api/report/${encodeURIComponent(id)}`),
};
