# PrimeFlowAI: Profit Recovery Engine

Lead-magnet calculator rebuilt from the single-file `legacy/index.html` onto Vite + React 18 + TypeScript (strict) + Tailwind v4, with Vercel Functions and a Turso (SQLite) database.

`legacy/index.html` is reference only and is never deployed.

## Run it

```bash
npm install
npm test            # golden tests, site-signal tests, API tests against a local SQLite file
npm run dev         # UI only. With no backend, the flow still completes and shows a local report.
npm run dev:full    # vercel dev: UI + API functions (needs `npx vercel link` and `npx vercel env pull .env.local`)
```

For local API work without Turnstile, add `DEV_MODE=true` to `.env.local` (never set it in production).

## Deploy (Vercel)

1. **Import the repo** in Vercel. Set **Root Directory** to `primeflow-calculator`. Everything else (Vite, `npm run build`, `dist`) comes from `vercel.json`.
2. **Add the database.** In the project: Storage → Marketplace → **Turso** → create a database and connect it to the project. This sets `TURSO_DATABASE_URL` and `TURSO_AUTH_TOKEN`.
3. **Tables are created automatically.** Every build runs `migrations/*.sql` that haven't been applied yet, so the first deploy after connecting Turso sets up the database.
4. **Add the environment variables** below in Settings → Environment Variables, then redeploy.

| Variable | Required | Purpose |
|---|---|---|
| `TURSO_DATABASE_URL`, `TURSO_AUTH_TOKEN` | yes | Set by the Turso integration |
| `ANTHROPIC_API_KEY` | yes | Diagnosis, site extraction, research |
| `TURNSTILE_SECRET_KEY` | yes | Bot check. Without it every protected endpoint fails closed |
| `VITE_TURNSTILE_SITE_KEY` | yes | Invisible Turnstile widget (free Cloudflare Turnstile account; works on any host) |
| `VITE_BOOKING_URL` | no | "Book a free live demo" (defaults to primeflowai.com/freedemo) |
| `ANTHROPIC_MODEL` | no | Default `claude-haiku-4-5` (diagnosis + extraction) |
| `ANTHROPIC_RESEARCH_MODEL` | no | Default `claude-sonnet-5` (research with web search) |
| `RESEND_API_KEY`, `NOTIFY_EMAIL`, `NOTIFY_FROM` | no | New-lead email to the owner |
| `PUBLIC_ORIGIN` | no | Origin used in lead-alert links |
| `MAX_RESEARCH_PER_DAY` | no | Global cap on uncached research runs (default 100) |
| `RESEARCH_WARM_TOKEN` | no | Lets `npm run research:warm` bypass Turnstile |

No secret may be prefixed `VITE_`. `VITE_` variables are baked in at build time, so redeploy after changing them.

## Scripts

The database scripts read `TURSO_DATABASE_URL` / `TURSO_AUTH_TOKEN` from `.env.local` (`npx vercel env pull .env.local`).

- `npm run db:migrate`: applies any new `migrations/*.sql` file (builds also do this automatically).
- `npm run leads:export`: all leads to CSV.
- `SITE=https://… RESEARCH_WARM_TOKEN=… npm run research:warm`: pre-caches research for every industry in AU, US, UK.
- `npm run research:sources -- health-wellness`: prints every stored stat with its source for the owner to audit. Sources never reach the browser.

## Layout

```
src/lib/        pure logic shared by client and API (calc engine, validation, plans, research, site signals)
src/components/ UI; sections/ are the results page, pdf/ is lazy-loaded @react-pdf
api/            Vercel Functions: submit-lead, ai-diagnosis, report/[id], analyze-site, research-industry, research-status/[key]
server/         shared server code: env, database, HTTP helpers, Claude client
migrations/     database schema (SQLite dialect)
scripts/        golden fixture generator (+ verbatim legacy engine), ops scripts
```

Server code and `src/lib` use explicit `.js` extensions on relative imports. Vercel runs the functions as native ES modules, which need them; `tsconfig.server.json` fails the build if one is missing.

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

- Research runs inside `waitUntil()` after the response is sent. `vercel.json` gives that function up to 300 s, which covers a 20–60 s web-search run. `research:warm` keeps common keys cached either way.
- JavaScript-only websites (no text in the HTML) can't be read by the site scanner; the visitor gets the "fill in the details below" message.
- The site scanner's detection is unit-tested against representative markup. It has not yet been run against live sites (the build sandbox blocks outbound web traffic). Do that on the first preview deploy.

## Needed from the owner

- Logo re-export on solid black with the new "AI SYSTEMS THAT DRIVE REVENUE" lockup. `public/brand/` currently holds the lockup extracted from the legacy file (transparent PNG) plus a cropped emblem and favicons.
- Approve or replace every placeholder in `src/lib/benchmarks.ts` (all rows are marked `placeholder: true`).
- Booking URL, Anthropic key, Turnstile keys, and whether to turn on lead emails.
