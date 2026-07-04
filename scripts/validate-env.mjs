/* global console, process */

import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";

const root = process.cwd();

function loadEnvFile(name) {
  const filePath = join(root, name);
  if (!existsSync(filePath)) return false;

  for (const line of readFileSync(filePath, "utf8").split("\n")) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const separator = trimmed.indexOf("=");
    if (separator === -1) continue;
    const key = trimmed.slice(0, separator).trim();
    const value = trimmed.slice(separator + 1).trim().replace(/^['"]|['"]$/g, "");
    if (!process.env[key]) process.env[key] = value;
  }

  return true;
}

function check(name, ok, message = "") {
  return { name, ok, message };
}

function isSet(value) {
  return Boolean(value?.trim());
}

function main() {
  const hasLocal = loadEnvFile(".env.local");
  loadEnvFile(".env");

  const checks = [
    check(".env.local exists", hasLocal, hasLocal ? "" : "Run npm run setup:env first"),
    check(
      "NEXT_PUBLIC_SUPABASE_URL",
      isSet(process.env.NEXT_PUBLIC_SUPABASE_URL),
      process.env.NEXT_PUBLIC_SUPABASE_URL?.trim() || "Missing project URL",
    ),
    check(
      "NEXT_PUBLIC_SUPABASE_ANON_KEY",
      isSet(process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY),
      isSet(process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) ? "Configured" : "Missing anon key",
    ),
    check(
      "NEXT_PUBLIC_SITE_URL",
      isSet(process.env.NEXT_PUBLIC_SITE_URL),
      process.env.NEXT_PUBLIC_SITE_URL?.trim() || "Use http://localhost:3000 for local dev",
    ),
    check(
      "SUPABASE_SERVICE_ROLE_KEY",
      isSet(process.env.SUPABASE_SERVICE_ROLE_KEY),
      isSet(process.env.SUPABASE_SERVICE_ROLE_KEY) ? "Configured" : "Needed for npm run test:live",
    ),
    check(
      "NEXT_PUBLIC_VIDEO_CDN_BASE (optional)",
      true,
      isSet(process.env.NEXT_PUBLIC_VIDEO_CDN_BASE) ? "CDN configured" : "Optional — uses Supabase storage URLs",
    ),
    check(
      "NEXT_PUBLIC_PUSH_VAPID_KEY (optional)",
      true,
      isSet(process.env.NEXT_PUBLIC_PUSH_VAPID_KEY) ? "Push scaffold ready" : "Optional — in-app panel shows setup hint",
    ),
  ];

  const failed = checks.filter((item) => !item.ok);
  for (const item of checks) {
    console.log(`${item.ok ? "PASS" : "FAIL"} ${item.name}${item.message ? `: ${item.message}` : ""}`);
  }

  if (failed.length > 0) {
    console.log("");
    console.log("Next steps:");
    console.log("1. npm run setup:env");
    console.log("2. Paste Supabase keys into .env.local");
    console.log("3. npm run migrations:bundle");
    console.log("4. npm run test:live");
  }

  process.exit(failed.length > 0 ? 1 : 0);
}

main();
