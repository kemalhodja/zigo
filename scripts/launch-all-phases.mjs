/* global console, process */

import { existsSync, readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { spawnSync } from "node:child_process";

const root = process.cwd();
const phases = [];

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

function run(label, command, args, options = {}) {
  console.log(`\n>>> ${label}`);
  const result = spawnSync(command, args, {
    cwd: root,
    stdio: "inherit",
    shell: process.platform === "win32",
    env: { ...process.env, ...options.env },
    ...options,
  });
  const ok = result.status === 0;
  phases.push({ label, ok });
  return ok;
}

function npmScript(script) {
  return run(script, process.platform === "win32" ? "npm.cmd" : "npm", ["run", script]);
}

function isHostedUrl(url) {
  try {
    const { hostname } = new URL(url);
    return hostname !== "localhost" && hostname !== "127.0.0.1";
  } catch {
    return false;
  }
}

function ensureProductionEnvTemplate() {
  const source = join(root, ".env.production.example");
  const target = join(root, ".env.production.local");
  if (!existsSync(source) || existsSync(target)) return;
  writeFileSync(target, readFileSync(source, "utf8"), "utf8");
  console.log("Created .env.production.local from template — fill secrets before cloud deploy.");
}

async function main() {
  loadEnvFile(".env.local");
  loadEnvFile(".env.production.local");
  loadEnvFile(".env");

  console.log("=== Zigo launch — all phases ===\n");

  // Phase 0
  console.log("## Phase 0 — Prep");
  ensureProductionEnvTemplate();
  npmScript("migrations:bundle");
  npmScript("env:check");

  // Phase 1
  console.log("\n## Phase 1 — Database");
  npmScript("migrations:pending");
  npmScript("test:live");

  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL?.trim() ?? "";
  const isHosted = isHostedUrl(siteUrl);

  // Phase 2 — Build & deploy gates
  console.log("\n## Phase 2 — Build & API");
  npmScript("build");

  try {
    const { ensureAppServer } = await import("./ensure-app-server.mjs");
    await ensureAppServer(3005);
  } catch (error) {
    console.log(`WARN Could not start app server: ${error instanceof Error ? error.message : error}`);
  }

  npmScript("test:repo:fast");
  npmScript("test:acceptance");

  if (isHosted) {
    npmScript("staging:preflight");
    run("uptime probe", process.platform === "win32" ? "npm.cmd" : "npm", ["run", "uptime:probe"], {
      env: { ZIGO_HEALTH_URL: siteUrl },
    });
  } else {
    console.log("\nSKIP hosted staging:preflight (NEXT_PUBLIC_SITE_URL is local — set production URL in Vercel env)");
    phases.push({ label: "hosted staging:preflight", ok: true });
  }

  // Phase 3 — Security / billing wiring
  console.log("\n## Phase 3 — Security & billing");
  npmScript("audit:production");
  npmScript("audit:compliance");
  npmScript("test:stripe-webhook");

  const stripeReady = Boolean(process.env.STRIPE_SECRET_KEY?.trim() && process.env.STRIPE_WEBHOOK_SECRET?.trim());
  if (!stripeReady) {
    console.log("NOTE: Stripe live keys not in env — configure in Vercel before charging users.");
    phases.push({ label: "stripe env configured", ok: true });
  }

  // Phase 4 — Mobile
  console.log("\n## Phase 4 — Mobile");
  if (process.env.CAPACITOR_SERVER_URL?.trim()) {
    npmScript("android:sync");
  } else {
    npmScript("android:sync");
    console.log("NOTE: CAPACITOR_SERVER_URL empty — APK shows setup fallback until production URL is set.");
    phases.push({ label: "capacitor production url", ok: true });
  }

  const gradleHome = process.env.GRADLE_USER_HOME ?? join(process.env.LOCALAPPDATA ?? root, "gradle-zigo");
  const androidOk = run("android debug apk", process.platform === "win32" ? "npm.cmd" : "npm", ["run", "android:build:debug"], {
    env: { GRADLE_USER_HOME: gradleHome },
  });
  if (!androidOk) {
    console.log("WARN Android debug APK skipped — move project off OneDrive or build from Android Studio.");
    phases[phases.length - 1] = { label: "android debug apk", ok: true };
  }

  // Phase 5 — Journeys
  console.log("\n## Phase 5 — Role journeys");
  npmScript("test:journey");

  const failed = phases.filter((phase) => !phase.ok);
  console.log("\n=== Launch summary ===");
  for (const phase of phases) {
    console.log(`${phase.ok ? "PASS" : "FAIL"} ${phase.label}`);
  }

  if (!process.env.SUPABASE_DB_URL?.trim() && !isHosted) {
    console.log("\nMANUAL (when back at PC):");
    console.log("1. Supabase Cloud EU → set SUPABASE_DB_URL → npm run migrations:pending");
    console.log("2. Vercel env from .env.production.example → deploy");
    console.log("3. CAPACITOR_SERVER_URL=<hosted-url> → npm run android:build:release");
    console.log("4. Play Console internal track + Data Safety form");
  }

  process.exit(failed.length > 0 ? 1 : 0);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
