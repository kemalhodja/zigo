/* global console, process */

import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";

const root = process.cwd();
const failures = [];

function read(relativePath) {
  const filePath = join(root, relativePath);
  if (!existsSync(filePath)) {
    failures.push(`missing file: ${relativePath}`);
    return "";
  }
  return readFileSync(filePath, "utf8");
}

const packageJson = read("package.json");
const launchDoc = read("docs/final-launch.md");
const productionChecklist = read("docs/production-checklist.md");

const required = [
  [packageJson.includes('"audit:launch"'), "audit:launch script wired"],
  [packageJson.includes('"test:ci"'), "test:ci alias wired"],
  [launchDoc.includes("audit:all"), "final-launch doc references audit:all"],
  [launchDoc.includes("migrationTarget: 44"), "final-launch doc references health migration 44"],
  [productionChecklist.includes("test:release") || productionChecklist.includes("staging:preflight"), "production-checklist links launch gates"],
  [existsSync(join(root, "scripts/ci-alignment-audit.mjs")), "ci-alignment-audit.mjs exists"],
  [existsSync(join(root, "scripts/hosted-launch-audit.mjs")), "hosted-launch-audit.mjs exists"],
  [existsSync(join(root, ".github/workflows/ci.yml")), "CI workflow exists"],
];

for (const [ok, label] of required) {
  if (!ok) failures.push(label);
}

if (failures.length > 0) {
  console.error("FAIL final launch check");
  for (const failure of failures) console.error(`- ${failure}`);
  process.exit(1);
}

console.log("PASS final launch check");
