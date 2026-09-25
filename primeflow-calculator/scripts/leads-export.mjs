// Exports every lead to leads-YYYY-MM-DD.csv via `wrangler d1 execute`.
//   npm run leads:export            (remote D1)
//   npm run leads:export -- --local (local D1)
import { execFileSync } from "node:child_process";
import { writeFileSync } from "node:fs";

const where = process.argv.includes("--local") ? "--local" : "--remote";
const sql =
  "SELECT id, created_at, name, email, business_name, industry, currency, total_leakage, grade, website_url, diagnosis FROM leads ORDER BY created_at DESC";
const out = execFileSync("npx", ["wrangler", "d1", "execute", "primeflow-db", where, "--json", "--command", sql], { encoding: "utf8" });
const rows = JSON.parse(out)[0]?.results ?? [];
const cols = ["id", "created_at", "name", "email", "business_name", "industry", "currency", "total_leakage", "grade", "website_url", "diagnosis"];
const cell = (v) => {
  const s = v === null || v === undefined ? "" : String(v);
  // Quote everything; neutralise spreadsheet formula injection.
  const safe = /^[=+\-@]/.test(s) ? `'${s}` : s;
  return `"${safe.replace(/"/g, '""')}"`;
};
const csv = [cols.join(","), ...rows.map((r) => cols.map((c) => cell(r[c])).join(","))].join("\n");
const file = `leads-${new Date().toISOString().slice(0, 10)}.csv`;
writeFileSync(file, csv + "\n");
console.log(`Wrote ${rows.length} leads to ${file}`);
