/* global console, process */

import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { spawnSync } from "node:child_process";

const root = process.cwd();
const siteUrl = "https://zigo-kohl.vercel.app";

function run(command, args, options = {}) {
  const result = spawnSync(command, args, {
    cwd: root,
    encoding: "utf8",
    shell: process.platform === "win32",
    stdio: options.inherit ? "inherit" : "pipe",
    env: { ...process.env, ...options.env },
  });

  if (result.status !== 0) {
    const output = `${result.stdout ?? ""}${result.stderr ?? ""}`.trim();
    throw new Error(output || `${command} ${args.join(" ")} failed`);
  }

  return result.stdout ?? "";
}

function loadEnvFile(name) {
  for (const fileName of [name, ".env.vercel.production", ".env.local"]) {
    const filePath = join(root, fileName);
    if (!existsSync(filePath)) continue;

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
}

function normalizeSupabaseEnv() {
  if (!process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.SUPABASE_URL) {
    process.env.NEXT_PUBLIC_SUPABASE_URL = process.env.SUPABASE_URL;
  }
  if (!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY && process.env.SUPABASE_ANON_KEY) {
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = process.env.SUPABASE_ANON_KEY;
  }
  if (!process.env.SUPABASE_DB_URL && process.env.POSTGRES_URL) {
    process.env.SUPABASE_DB_URL = process.env.POSTGRES_URL;
  }
}

function setVercelEnv(name, value) {
  run("npx", ["vercel", "env", "add", name, "production", "--value", value, "--force", "--yes"]);
  console.log(`PASS Vercel env ${name}`);
}

async function main() {
  loadEnvFile(".env.local");
  normalizeSupabaseEnv();

  const required = [
    "NEXT_PUBLIC_SUPABASE_URL",
    "NEXT_PUBLIC_SUPABASE_ANON_KEY",
    "SUPABASE_SERVICE_ROLE_KEY",
  ];

  const missing = required.filter((key) => !process.env[key]?.trim());
  if (missing.length > 0) {
    console.error(`Missing: ${missing.join(", ")}`);
    console.error("Run: npx vercel install supabase --name zigo-db -m region=fra1 -e production");
    process.exit(1);
  }

  console.log("Syncing Vercel production env...");
  for (const key of [
    "NEXT_PUBLIC_SUPABASE_URL",
    "NEXT_PUBLIC_SUPABASE_ANON_KEY",
    "SUPABASE_SERVICE_ROLE_KEY",
    "NEXT_PUBLIC_SITE_URL",
    "CAPACITOR_SERVER_URL",
    "ZIGO_HEALTH_URL",
    "NEXT_PUBLIC_LOCALE",
    "ZIGO_BILLING_DEV_BYPASS",
    "NEXT_PUBLIC_ZIGO_BILLING_DEV_BYPASS",
  ]) {
    const value =
      key === "NEXT_PUBLIC_SITE_URL" || key === "CAPACITOR_SERVER_URL"
        ? siteUrl
        : key === "ZIGO_HEALTH_URL"
          ? `${siteUrl}/api/setup/health`
          : key === "NEXT_PUBLIC_LOCALE"
            ? "tr"
            : key.startsWith("ZIGO_BILLING") || key.startsWith("NEXT_PUBLIC_ZIGO_BILLING")
              ? "true"
              : process.env[key];
    if (value) setVercelEnv(key, value);
  }

  console.log("Bundling migrations...");
  run("npm", ["run", "migrations:bundle"], { inherit: true });

  if (process.env.SUPABASE_DB_URL?.trim()) {
    console.log("Applying cloud migrations...");
    run("npm", ["run", "migrations:cloud"], { inherit: true });
  } else {
    console.log("SKIP migrations:cloud — set SUPABASE_DB_URL or POSTGRES_URL, then rerun.");
  }

  console.log("Deploying production...");
  run("npx", ["vercel", "--prod", "--yes"], { inherit: true });

  console.log("");
  console.log("Done. Verify:");
  console.log(`- ${siteUrl}/api/setup/health`);
  console.log(`- Supabase Auth redirect: ${siteUrl}/auth/callback`);
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : error);
  process.exit(1);
});
