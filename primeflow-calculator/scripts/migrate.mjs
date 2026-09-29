// Applies every migrations/*.sql file not yet recorded in _migrations, in order.
//   npm run db:migrate
// Also runs at the start of every build (with --optional), so deploys create new tables themselves.
import { readdirSync, readFileSync } from "node:fs";
import { db } from "./db.mjs";

await db.execute("CREATE TABLE IF NOT EXISTS _migrations (name TEXT PRIMARY KEY, applied_at TEXT NOT NULL DEFAULT (datetime('now')))");
const done = new Set((await db.execute("SELECT name FROM _migrations")).rows.map((r) => r.name));
const files = readdirSync("migrations").filter((f) => f.endsWith(".sql")).sort();

for (const file of files) {
  if (done.has(file)) continue;
  const sql = readFileSync(`migrations/${file}`, "utf8");
  await db.executeMultiple(`BEGIN;\n${sql}\nINSERT INTO _migrations (name) VALUES ('${file.replace(/'/g, "''")}');\nCOMMIT;`);
  console.log(`applied ${file}`);
}
console.log("Database is up to date.");
