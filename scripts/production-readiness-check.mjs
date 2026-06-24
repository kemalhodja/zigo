/* global console, process */

import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";

const root = process.cwd();

function read(relativePath) {
  const filePath = join(root, relativePath);
  if (!existsSync(filePath)) throw new Error(`Missing file: ${relativePath}`);
  return readFileSync(filePath, "utf8");
}

const failures = [];

const packageJson = read("package.json");
const prodDoc = read("docs/production-readiness.md");
const prodChecklist = read("docs/production-checklist.md");
const launchChecklist = read("docs/launch-checklist.md");
const stagingPreflight = read("scripts/staging-preflight.mjs");
const releaseGate = read("scripts/test-release-gate.mjs");
const bundleScript = read("scripts/bundle-migrations.mjs");

const required = [
  [packageJson.includes('"audit:production"'), "audit:production script wired"],
  [packageJson.includes('"uptime:probe"'), "uptime:probe script wired"],
  [packageJson.includes('"test:release"'), "test:release gate wired"],
  [packageJson.includes('"staging:preflight"'), "staging:preflight wired"],
  [prodDoc.includes("migrationTarget: 55") || prodDoc.includes("migrationTarget: 49"), "production-readiness doc references migration target"],
  [prodChecklist.includes("055") || prodChecklist.includes("049") || prodChecklist.includes("55"), "production-checklist references current migrations"],
  [launchChecklist.includes("staging:preflight"), "launch-checklist references staging preflight"],
  [stagingPreflight.includes("Migration bundle"), "staging preflight checks migration bundle"],
  [releaseGate.includes("test:repo"), "release gate runs test:repo"],
  [bundleScript.includes("055_demo_social_interactions_reset.sql"), "bundle includes migration 055"],
  [existsSync(join(root, ".github/workflows/live-tests-nightly.yml")), "nightly live workflow exists"],
];

for (const [ok, label] of required) {
  if (!ok) failures.push(label);
}

if (failures.length > 0) {
  console.error("FAIL production readiness check");
  for (const failure of failures) console.error(`- ${failure}`);
  process.exit(1);
}

console.log("PASS production readiness check");
