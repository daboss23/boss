export interface Env {
  DB: D1Database;
  /** Cloudflare Browser Rendering binding (optional). */
  BROWSER?: Fetcher;
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

export type Ctx = EventContext<Env, string, Record<string, unknown>>;
