/* global console, process */

import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import pg from "pg";

const root = process.cwd();

function loadEnvFile(name) {
  const filePath = join(root, name);
  if (!existsSync(filePath)) return;

  for (const line of readFileSync(filePath, "utf8").split("\n")) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const separator = trimmed.indexOf("=");
    if (separator === -1) continue;
    const key = trimmed.slice(0, separator).trim();
    const value = trimmed.slice(separator + 1).trim().replace(/^['"]|['"]$/g, "");
    if (!process.env[key]) process.env[key] = value;
  }
}

async function main() {
  loadEnvFile(".env.vercel.production");
  loadEnvFile(".env.local");

  const url = process.env.POSTGRES_URL_NON_POOLING?.trim() || process.env.POSTGRES_URL?.trim();
  const sqlPath = join(root, "supabase", "zigo-full-migrations.sql");

  if (!url) {
    throw new Error("POSTGRES_URL_NON_POOLING or POSTGRES_URL is missing.");
  }
  if (!existsSync(sqlPath)) {
    throw new Error("Missing supabase/zigo-full-migrations.sql — run npm run migrations:bundle first.");
  }

  const sql = readFileSync(sqlPath, "utf8");
  const directUrl =
    process.env.POSTGRES_HOST && process.env.POSTGRES_PASSWORD
      ? `postgresql://${process.env.POSTGRES_USER ?? "postgres"}:${encodeURIComponent(process.env.POSTGRES_PASSWORD)}@${process.env.POSTGRES_HOST}:5432/${process.env.POSTGRES_DATABASE ?? "postgres"}`
      : url;
  const client = new pg.Client({
    connectionString: directUrl,
    ssl: { rejectUnauthorized: false },
  });

  console.log("Connecting to cloud database...");
  await client.connect();
  console.log(`Applying migrations (${Math.round(sql.length / 1024)} KB)...`);
  await client.query(sql);
  await client.end();
  console.log("PASS Cloud migrations applied.");
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : error);
  process.exit(1);
});
