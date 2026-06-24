/* global console, process */

import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { spawnSync } from "node:child_process";

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

loadEnvFile(".env.local");
loadEnvFile(".env");
const bundlePath = join(root, "supabase", "zigo-full-migrations.sql");
const dbUrl = process.env.SUPABASE_DB_URL?.trim();

function main() {
  if (!existsSync(bundlePath)) {
    console.error("Missing supabase/zigo-full-migrations.sql — run npm run migrations:bundle first.");
    process.exit(1);
  }

  if (!dbUrl) {
    console.log("SUPABASE_DB_URL is not set.");
    console.log("");
    console.log("Option A — Supabase Dashboard:");
    console.log("1. Open SQL Editor");
    console.log(`2. Paste contents of ${bundlePath}`);
    console.log("3. Run");
    console.log("");
    console.log("Option B — psql CLI:");
    console.log("Set SUPABASE_DB_URL from Supabase → Settings → Database → Connection string");
    console.log("Then re-run: npm run migrations:cloud");
    process.exit(1);
  }

  console.log("Applying bundled migrations to cloud database...");
  const result = spawnSync("psql", [dbUrl, "-v", "ON_ERROR_STOP=1", "-f", bundlePath], {
    cwd: root,
    stdio: "inherit",
    shell: process.platform === "win32",
  });

  if (result.status !== 0) {
    console.error("Migration apply failed. Use Supabase SQL Editor if psql is unavailable.");
    process.exit(result.status ?? 1);
  }

  console.log("PASS Cloud migrations applied.");
}

main();
