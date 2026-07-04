/* global console, process */

import { writeFileSync } from "node:fs";
import { join } from "node:path";
import { spawnSync } from "node:child_process";

const root = process.cwd();
const envPath = join(root, ".env.local");

function run(command, args) {
  const result = spawnSync(command, args, {
    cwd: root,
    encoding: "utf8",
    shell: process.platform === "win32",
  });

  const output = `${result.stdout ?? ""}${result.stderr ?? ""}`.trim();
  if (result.status !== 0) {
    throw new Error(output || `${command} ${args.join(" ")} failed`);
  }

  return output;
}

function parseStatusEnv(output) {
  const values = {};
  for (const line of output.split("\n")) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const separator = trimmed.indexOf("=");
    if (separator === -1) continue;
    const key = trimmed.slice(0, separator).trim();
    const value = trimmed.slice(separator + 1).trim().replace(/^['"]|['"]$/g, "");
    values[key] = value;
  }
  return values;
}

function writeEnv(values) {
  const lines = [
    `NEXT_PUBLIC_SUPABASE_URL=${values.NEXT_PUBLIC_SUPABASE_URL}`,
    `NEXT_PUBLIC_SUPABASE_ANON_KEY=${values.NEXT_PUBLIC_SUPABASE_ANON_KEY}`,
    `NEXT_PUBLIC_SITE_URL=${values.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000"}`,
    "",
    "# Server-only. Used by /api/setup/health and npm run test:live.",
    "# Never expose this key to the browser or commit it to git.",
    `SUPABASE_SERVICE_ROLE_KEY=${values.SUPABASE_SERVICE_ROLE_KEY}`,
    "",
    "# Local demo billing (set false on hosted staging).",
    "ZIGO_BILLING_DEV_BYPASS=true",
    "NEXT_PUBLIC_ZIGO_BILLING_DEV_BYPASS=true",
    "",
    "# Optional for Capacitor APK builds.",
    "# CAPACITOR_SERVER_URL=http://localhost:3000",
    "CAPACITOR_SERVER_URL=",
    "",
  ];

  writeFileSync(envPath, `${lines.join("\n")}\n`, "utf8");
}

async function main() {
  console.log("Starting local Supabase (Docker required)...");
  run("npx", ["supabase", "start"]);

  console.log("Applying migrations...");
  run("npx", ["supabase", "db", "reset", "--yes"]);

  const status = parseStatusEnv(run("npx", ["supabase", "status", "-o", "env"]));
  const url = status.API_URL ?? status.SUPABASE_URL;
  const anon = status.ANON_KEY ?? status.SUPABASE_ANON_KEY;
  const serviceRole = status.SERVICE_ROLE_KEY ?? status.SUPABASE_SERVICE_ROLE_KEY;

  if (!url || !anon || !serviceRole) {
    throw new Error("Could not read local Supabase keys from `supabase status -o env`.");
  }

  writeEnv({
    NEXT_PUBLIC_SUPABASE_URL: url,
    NEXT_PUBLIC_SUPABASE_ANON_KEY: anon,
    SUPABASE_SERVICE_ROLE_KEY: serviceRole,
    NEXT_PUBLIC_SITE_URL: "http://localhost:3000",
  });

  console.log(`PASS Wrote ${envPath}`);
  console.log("PASS Local Supabase is ready");
  console.log("Test accounts password: ZigoTest123!");
  console.log("- aylin.teacher@zigo.test");
  console.log("- mert.teacher@zigo.test");
  console.log("- parent@zigo.test");
  console.log("- student@zigo.test");
  console.log("- admin@zigo.test");
  console.log("");
  console.log("Next:");
  console.log("npm run test:live");
  console.log("npm run dev");
  console.log("npm run test:journey");
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : error);
  process.exit(1);
});
