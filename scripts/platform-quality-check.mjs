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
const platformDoc = read("docs/platform-quality.md");
const polishRoadmap = read("docs/social-polish-roadmap.md");

const required = [
  [packageJson.includes('"audit:platform"'), "audit:platform script wired"],
  [platformDoc.includes("test:acceptance"), "platform-quality doc references acceptance gate"],
  [platformDoc.includes("migrationTarget: 55") || platformDoc.includes("migrationTarget: 49"), "platform-quality doc references health migration target"],
  [polishRoadmap.includes("safe-instagram-feel-checklist"), "social-polish roadmap links safe feel checklist"],
  [existsSync(join(root, "scripts/social-shell-audit.mjs")), "social-shell-audit.mjs exists"],
  [existsSync(join(root, "scripts/release-scorecard-audit.mjs")), "release-scorecard-audit.mjs exists"],
  [existsSync(join(root, "docs/visual-regression-checklist.md")), "visual-regression-checklist.md exists"],
];

for (const [ok, label] of required) {
  if (!ok) failures.push(label);
}

if (failures.length > 0) {
  console.error("FAIL platform quality check");
  for (const failure of failures) console.error(`- ${failure}`);
  process.exit(1);
}

console.log("PASS platform quality check");
