// Exports every lead to leads-YYYY-MM-DD.csv.
//   npm run leads:export
import { writeFileSync } from "node:fs";
import { db } from "./db.mjs";

const sql =
  "SELECT id, created_at, name, email, business_name, industry, currency, total_leakage, grade, website_url, diagnosis FROM leads ORDER BY created_at DESC";
const { rows } = await db.execute(sql);
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
