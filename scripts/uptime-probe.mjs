/* global console, process, fetch */

import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";

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

function expectedMigrationTarget() {
  const health = readFileSync(join(root, "src/app/api/setup/health/route.ts"), "utf8");
  const match = health.match(/MIGRATION_TARGET\s*=\s*(\d+)/);
  return match ? Number(match[1]) : null;
}

async function main() {
  loadEnvFile(".env.local");
  loadEnvFile(".env");

  const baseUrl = (process.env.ZIGO_HEALTH_URL ?? process.env.NEXT_PUBLIC_SITE_URL ?? "http://127.0.0.1:3000")
    .trim()
    .replace(/\/$/, "");
  const target = expectedMigrationTarget();
  const url = `${baseUrl}/api/setup/health`;

  try {
    const response = await fetch(url, { signal: AbortSignal.timeout(8000) });
    if (!response.ok) {
      console.error(`FAIL uptime probe HTTP ${response.status} from ${url}`);
      process.exit(1);
    }

    const payload = await response.json();
    const data = payload?.data;
    const migrationTarget = data?.migrationTarget;
    const status = data?.status;

    if (target !== null && migrationTarget !== target) {
      console.error(`FAIL uptime probe migrationTarget=${migrationTarget} expected ${target}`);
      process.exit(1);
    }

    if (!status) {
      console.error("FAIL uptime probe missing status field");
      process.exit(1);
    }

    console.log(`PASS uptime probe status=${status} migrationTarget=${migrationTarget} url=${url}`);
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    console.error(`FAIL uptime probe could not reach ${url}: ${message}`);
    console.error("Start the dev server or set ZIGO_HEALTH_URL to a hosted deployment.");
    process.exit(1);
  }
}

main();
