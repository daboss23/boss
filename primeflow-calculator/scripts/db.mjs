// Shared Turso connection for the ops scripts. Reads TURSO_DATABASE_URL and
// TURSO_AUTH_TOKEN from the environment or from .env.local
// (`npx vercel env pull .env.local` writes that file).
import { existsSync, readFileSync } from "node:fs";
import { createClient } from "@libsql/client/web";

if (existsSync(".env.local")) {
  for (const line of readFileSync(".env.local", "utf8").split("\n")) {
    const m = line.match(/^\s*([A-Z0-9_]+)\s*=\s*"?(.*?)"?\s*$/);
    if (m && !(m[1] in process.env)) process.env[m[1]] = m[2];
  }
}

const url = process.env.TURSO_DATABASE_URL;
if (!url) {
  console.error("Set TURSO_DATABASE_URL (and TURSO_AUTH_TOKEN), or run `npx vercel env pull .env.local` first.");
  process.exit(1);
}

export const db = createClient({ url, authToken: process.env.TURSO_AUTH_TOKEN });
