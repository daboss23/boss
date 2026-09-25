// Pre-runs industry research for every industry in AU, US and UK so common
// cases are always cached. Requires RESEARCH_WARM_TOKEN to be set as a server
// secret and passed here, plus the deployed origin.
//   SITE=https://audit.primeflowai.com RESEARCH_WARM_TOKEN=... npm run research:warm
const SITE = process.env.SITE;
const TOKEN = process.env.RESEARCH_WARM_TOKEN;
if (!SITE || !TOKEN) {
  console.error("Set SITE and RESEARCH_WARM_TOKEN.");
  process.exit(1);
}
const INDUSTRIES = [
  "Home Services", "Trades & Construction", "Health & Wellness", "Real Estate",
  "Finance & Insurance", "Legal", "Coaching & Consulting", "Ecommerce",
];
const COUNTRIES = ["AU", "US", "GB"];

for (const country of COUNTRIES) {
  for (const industry of INDUSTRIES) {
    const res = await fetch(`${SITE}/api/research-industry`, {
      method: "POST",
      headers: { "content-type": "application/json", "x-warm-token": TOKEN },
      body: JSON.stringify({ industry, country }),
    });
    const body = await res.json().catch(() => ({}));
    console.log(`${country}  ${industry.padEnd(24)} ${res.status} ${body.status ?? body.error ?? ""}`);
    // Uncached runs happen in the background; pace requests to stay polite.
    await new Promise((r) => setTimeout(r, body.status === "pending" ? 4000 : 200));
  }
}
console.log("Done. Pending runs finish in the background; re-run to confirm they are 'ready'.");
