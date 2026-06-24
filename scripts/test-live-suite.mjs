/* global console, process */

import { spawnSync } from "node:child_process";
import { join } from "node:path";

import { detectAppBaseUrl, liveTestsForced, requireLivePreflight } from "./live-test-utils.mjs";

const root = process.cwd();

const STEPS = [
  { label: "test:live", script: "live-supabase-check.mjs", needsServer: false },
  { label: "test:e2e", script: "e2e-flow-check.mjs", needsServer: true },
  { label: "cross-role-matrix", script: "cross-role-matrix.mjs", needsServer: false },
  { label: "test:journey", script: "manual-full-journey.mjs", needsServer: true },
];

function runScript(relativePath) {
  const result = spawnSync(process.execPath, [join(root, "scripts", relativePath)], {
    cwd: root,
    stdio: "inherit",
    env: { ...process.env, ZIGO_RUN_LIVE_TESTS: "1" },
  });
  return result.status === 0;
}

async function main() {
  console.log("=== Zigo live integration suite ===\n");

  if (!liveTestsForced()) {
    console.log("Set ZIGO_RUN_LIVE_TESTS=1 to run release-grade live probes.\n");
  }

  const ready = await requireLivePreflight("live suite");
  if (!ready) {
    setImmediate(() => process.exit(0));
    return;
  }

  const baseUrl = await detectAppBaseUrl();
  if (!baseUrl) {
    console.log("WARN No Next.js server detected — skipping HTTP journey/e2e steps.");
    console.log("Start: npm run build:safe && npm run start -- -p 3005");
    console.log("Then:  $env:E2E_BASE_URL='http://localhost:3005'\n");
  } else {
    process.env.E2E_BASE_URL = baseUrl;
    console.log(`App server: ${baseUrl}\n`);
  }

  const outcomes = [];
  for (const step of STEPS) {
    if (step.needsServer && !baseUrl) {
      console.log(`SKIP ${step.label} (no server)\n`);
      outcomes.push({ label: step.label, ok: true, skipped: true });
      continue;
    }

    console.log(`\n========== ${step.label} ==========\n`);
    const ok = runScript(step.script);
    outcomes.push({ label: step.label, ok, skipped: false });
  }

  console.log("\n=== LIVE SUITE SUMMARY ===");
  for (const item of outcomes) {
    const status = item.skipped ? "SKIP" : item.ok ? "PASS" : "FAIL";
    console.log(`${status} ${item.label}`);
  }

  const failed = outcomes.filter((item) => !item.ok && !item.skipped);
  setImmediate(() => process.exit(failed.length > 0 ? 1 : 0));
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
