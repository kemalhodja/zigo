/* global console, process */

import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";

import pg from "pg";

const root = process.cwd();
const targetFile = process.argv[2];

if (!targetFile) {
  console.error("Usage: node scripts/apply-migration-once.mjs <migration-file.sql>");
  process.exit(1);
}

function loadEnvFile(name) {
  const filePath = join(root, name);
  if (!existsSync(filePath)) return;
  for (const line of readFileSync(filePath, "utf8").split("\n")) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const eq = trimmed.indexOf("=");
    if (eq === -1) continue;
    const key = trimmed.slice(0, eq).trim();
    const value = trimmed.slice(eq + 1).trim().replace(/^['"]|['"]$/g, "");
    if (!process.env[key]) process.env[key] = value;
  }
}

for (const file of [
  ".env.local",
  ".env.vercel.production.local",
  ".env.vercel.production",
  ".env.check",
  ".env",
]) {
  loadEnvFile(file);
}

function resolveDbUrl() {
  const password = process.env.POSTGRES_PASSWORD?.trim();
  const host = process.env.POSTGRES_HOST?.trim();

  if (password && host) {
    const user = process.env.POSTGRES_USER?.trim() || "postgres";
    const database = process.env.POSTGRES_DATABASE?.trim() || "postgres";
    return `postgresql://${user}:${encodeURIComponent(password)}@${host}:5432/${database}`;
  }

  return (
    process.env.POSTGRES_URL_NON_POOLING?.trim() ||
    process.env.SUPABASE_DB_URL?.trim() ||
    process.env.POSTGRES_URL?.trim() ||
    null
  );
}

const dbUrl = resolveDbUrl();

if (!dbUrl) {
  console.error("Database URL not found.");
  process.exit(1);
}

const sql = readFileSync(join(root, "supabase", "migrations", targetFile), "utf8");
const client = new pg.Client({ connectionString: dbUrl, ssl: { rejectUnauthorized: false } });

await client.connect();
try {
  await client.query(sql);
  console.log(`PASS ${targetFile}`);
} finally {
  await client.end();
}
