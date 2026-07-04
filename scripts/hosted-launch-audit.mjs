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

const hosted = read("docs/hosted-deploy-checklist.md");
const staging = read("docs/staging-deploy.md");
const finalAcceptance = read("docs/final-acceptance-checklist.md");
const stagingPreflight = read("scripts/staging-preflight.mjs");

const required = [
  [hosted.includes("001–044") || hosted.includes("001-044"), "hosted-deploy-checklist must reference migrations 001-044"],
  [hosted.includes("staging:preflight"), "hosted-deploy-checklist must reference staging preflight"],
  [staging.includes("staging:preflight") || staging.includes("preflight"), "staging-deploy doc must mention preflight"],
  [finalAcceptance.includes("test:release"), "final-acceptance-checklist must reference test:release"],
  [stagingPreflight.includes("044_product_scope_hardening"), "staging preflight probes migration 044"],
  [stagingPreflight.includes("Hosted app health migration target"), "staging preflight checks hosted health migration"],
  [existsSync(join(root, "docs/final-launch.md")), "final-launch.md exists"],
];

for (const [ok, label] of required) {
  if (!ok) failures.push(label);
}

if (failures.length > 0) {
  console.error("FAIL hosted launch audit");
  for (const failure of failures) console.error(`- ${failure}`);
  process.exit(1);
}

console.log("PASS hosted launch audit");
