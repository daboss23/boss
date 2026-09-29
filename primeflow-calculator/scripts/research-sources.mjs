// Prints every stored stat with its source, for the owner to audit.
// Sources are internal only and never sent to the browser.
//   npm run research:sources -- "health-wellness"   (key prefix)
import { db } from "./db.mjs";

const prefix = process.argv.slice(2).find((a) => !a.startsWith("--")) ?? "";
const { rows } = await db.execute({
  sql: "SELECT key, status, research_json, input_tokens, output_tokens, searches_used, updated_at FROM industry_research WHERE key LIKE ?1 ORDER BY key",
  args: [`${prefix}%`],
});
if (!rows.length) console.log(`No research rows match "${prefix}".`);
for (const r of rows) {
  console.log(`\n■ ${r.key}  [${r.status}]  updated ${r.updated_at}  tokens ${r.input_tokens ?? 0} in / ${r.output_tokens ?? 0} out, ${r.searches_used ?? 0} searches`);
  if (!r.research_json) continue;
  const doc = JSON.parse(r.research_json);
  for (const s of doc.stats ?? []) {
    console.log(`  ${s.metric.padEnd(26)} ${String(s.value).padStart(8)} ${s.unit.padEnd(5)} ${s.context}`);
    console.log(`  ${"".padEnd(26)} ↳ ${s.source_publisher} (${s.year}) ${s.source_title}\n  ${"".padEnd(28)}${s.source_url}`);
  }
  for (const t of doc.trends ?? []) console.log(`  trend: ${t.text}\n         ↳ ${t.source_url}`);
}
