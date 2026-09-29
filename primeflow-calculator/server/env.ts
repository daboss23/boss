import { createDb, type Db } from "./db.js";

export interface Env {
  DB: Db;
  ANTHROPIC_API_KEY?: string;
  /** Diagnosis + site extraction. Default claude-haiku-4-5. */
  ANTHROPIC_MODEL?: string;
  /** Industry research with web search. Default claude-sonnet-5. */
  ANTHROPIC_RESEARCH_MODEL?: string;
  TURNSTILE_SECRET_KEY?: string;
  RESEND_API_KEY?: string;
  NOTIFY_EMAIL?: string;
  /** From address for lead alerts, e.g. "PrimeFlowAI <alerts@primeflowai.com>". */
  NOTIFY_FROM?: string;
  MAX_RESEARCH_PER_DAY?: string;
  /** Public site origin used in lead-alert links, e.g. https://audit.primeflowai.com */
  PUBLIC_ORIGIN?: string;
  /** Lets scripts/research-warm.mjs bypass Turnstile. Server secret. */
  RESEARCH_WARM_TOKEN?: string;
  /** Local development only: "true" skips Turnstile when no secret is set. Never set in production. */
  DEV_MODE?: string;
}

let cached: Env | null = null;

/** Reads Vercel environment variables once per function instance. */
export function getEnv(): Env {
  if (cached) return cached;
  const e = process.env;
  cached = {
    DB: createDb(e.TURSO_DATABASE_URL, e.TURSO_AUTH_TOKEN),
    ANTHROPIC_API_KEY: e.ANTHROPIC_API_KEY,
    ANTHROPIC_MODEL: e.ANTHROPIC_MODEL,
    ANTHROPIC_RESEARCH_MODEL: e.ANTHROPIC_RESEARCH_MODEL,
    TURNSTILE_SECRET_KEY: e.TURNSTILE_SECRET_KEY,
    RESEND_API_KEY: e.RESEND_API_KEY,
    NOTIFY_EMAIL: e.NOTIFY_EMAIL,
    NOTIFY_FROM: e.NOTIFY_FROM,
    MAX_RESEARCH_PER_DAY: e.MAX_RESEARCH_PER_DAY,
    PUBLIC_ORIGIN: e.PUBLIC_ORIGIN,
    RESEARCH_WARM_TOKEN: e.RESEARCH_WARM_TOKEN,
    DEV_MODE: e.DEV_MODE,
  };
  return cached;
}
