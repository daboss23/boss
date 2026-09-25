# PrimeFlowAI: Profit Recovery Engine

Lead-magnet calculator rebuilt from the single-file `legacy/index.html` onto Vite + React 18 + TypeScript (strict) + Tailwind v4, with Cloudflare Pages Functions and D1.

`legacy/index.html` is reference only and is never deployed.

## Run it

```bash
npm install
npm test            # golden tests + site-signal tests
npm run dev         # UI only. With no backend, the flow still completes and shows a local report.
npm run dev:full    # build + wrangler pages dev: Functions + local D1
```

First time with local D1: `npm run db:migrate:local`, and create `.dev.vars` with `DEV_MODE=true` (skips Turnstile locally; never set it in production).

## Deploy (Cloudflare Pages)

1. `npx wrangler d1 create primeflow-db`, then paste the id into `wrangler.toml`.
2. `npm run db:migrate:remote`
3. Connect the repo in Pages. Root directory `primeflow-calculator`, build `npm run build`, output `dist`.
4. Bindings: D1 `DB`. Optional Browser Rendering `BROWSER` (uncomment in `wrangler.toml`).
5. Environment variables:

| Variable | Where | Purpose |
|---|---|---|
| `ANTHROPIC_API_KEY` | secret | Diagnosis, site extraction, research |
| `ANTHROPIC_MODEL` | var | Default `claude-haiku-4-5` (diagnosis + extraction) |
| `ANTHROPIC_RESEARCH_MODEL` | var | Default `claude-sonnet-5` (research with web search) |
| `TURNSTILE_SECRET_KEY` | secret | Bot check. Without it every protected endpoint fails closed |
| `VITE_TURNSTILE_SITE_KEY` | build var | Invisible Turnstile widget |
| `VITE_BOOKING_URL` | build var | "Book a free live demo" (defaults to primeflowai.com/freedemo) |
| `RESEND_API_KEY`, `NOTIFY_EMAIL`, `NOTIFY_FROM` | optional | New-lead email to the owner |
| `PUBLIC_ORIGIN` | optional | Origin used in lead-alert links |
| `MAX_RESEARCH_PER_DAY` | var | Global cap on uncached research runs (default 100) |
| `RESEARCH_WARM_TOKEN` | secret, optional | Lets `npm run research:warm` bypass Turnstile |

No secret may be prefixed `VITE_`.

## Scripts

- `npm run leads:export`: all leads to CSV (`-- --local` for local D1).
- `SITE=https://… RESEARCH_WARM_TOKEN=… npm run research:warm`: pre-caches research for every industry in AU, US, UK.
- `npm run research:sources -- health-wellness`: prints every stored stat with its source for the owner to audit. Sources never reach the browser.

## Layout

```
src/lib/        pure logic shared by client and Functions (calc engine, validation, plans, research, site signals)
src/components/ UI; sections/ are the results page, pdf/ is lazy-loaded @react-pdf
functions/api/  submit-lead, ai-diagnosis, report/[id], analyze-site, research-industry, research-status/[key]
migrations/     D1 schema
scripts/        golden fixture generator (+ verbatim legacy engine), ops scripts
```

## Findings for the owner (Section 4 of the brief)

These are reported, not changed. The engine reproduces the legacy file exactly (12 golden fixtures, to the cent).

1. **Pipeline Health Score**, extracted from legacy and documented in `src/lib/calcResults.ts`: start at 100; subtract `(responseBand/8)×30`, `((100−coverage%)/100)×25`, 20/12/6 for missed calls >10/>5/>0 a week, 15/8 for conversion <10%/<20%, 10 for fewer than 3 follow-ups; clamp 0–100.
2. **Marketing Waste vs Total Leakage**: there is no mismatch in the legacy file. The teaser and results bars both use Slow Response + Missed Calls + Dead Leads. Marketing Waste is only a metric card and is not in Total Leakage. The brief's assumption that it's a bar segment doesn't match the code.
3. **dormantProspects** = leads not converted over 12 months: `monthlyLeads × 12 × (1 − conversion)`.

Other legacy behaviours worth a decision:

- **Missed calls dominate small-ticket businesses.** Revenue lost = every missed call × full average sale value (no close-rate applied). For the baseline fixture that's 82% of the total. Legacy behaviour, kept as is.
- Reactivation rates of 0 fell back to the defaults (`parseFloat(x) || 12`). Kept for parity; validation now requires ≥ 0.1%.
- The legacy speed card said "vs. ≤5 min response" but the maths compares to ≤1 min. The copy now says "vs. replying inside a minute" so it matches the number.
- The legacy heatmap shaded the first N days, not the selected days. The new heatmap uses the actual days (display only; the numbers are unchanged).
- The ROI line "typically recover 30–60% … within 90 days" is kept verbatim. Make sure you can back it up.

## Known limits

- Research runs inside `waitUntil()` as the brief specifies. Pages Functions only keep a request alive for a limited window after the response, and a web-search run can take 20–60 s. If runs show up as stuck `pending` in D1, move `runResearch` to a Queue consumer Worker. `research:warm` keeps common keys cached either way.
- The site scanner's detection is unit-tested against representative markup. It has not yet been run against live sites (the build sandbox blocks outbound web traffic). Do that on the first preview deploy.

## Needed from the owner

- Logo re-export on solid black with the new "AI SYSTEMS THAT DRIVE REVENUE" lockup. `public/brand/` currently holds the lockup extracted from the legacy file (transparent PNG) plus a cropped emblem and favicons.
- Approve or replace every placeholder in `src/lib/benchmarks.ts` (all rows are marked `placeholder: true`).
- Booking URL, Anthropic key, Cloudflare access (D1 + Turnstile), and whether to turn on lead emails.
