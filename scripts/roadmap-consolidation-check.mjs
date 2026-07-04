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
const roadmap = read("docs/quality-roadmap.md");

const sectionAudits = [
  "audit:ux",
  "audit:production",
  "audit:compliance",
  "audit:education",
  "audit:platform",
  "audit:launch",
  "audit:consolidation",
];

for (const script of sectionAudits) {
  if (!packageJson.includes(`"${script}"`)) {
    failures.push(`package.json missing ${script}`);
  }
}

const requiredDocs = [
  "docs/ux-quality.md",
  "docs/production-readiness.md",
  "docs/compliance.md",
  "docs/education-core.md",
  "docs/platform-quality.md",
  "docs/final-launch.md",
  "docs/quality-roadmap.md",
];

for (const doc of requiredDocs) {
  if (!existsSync(join(root, doc))) {
    failures.push(`missing roadmap doc: ${doc}`);
  }
}

const required = [
  [roadmap.includes("audit:all"), "quality-roadmap must reference audit:all"],
  [roadmap.includes("001–055") || roadmap.includes("001-055") || roadmap.includes("MIGRATION_TARGET = 55"), "quality-roadmap must reference migrations 001-055"],
  [packageJson.includes('"audit:all"'), "audit:all wired"],
  [existsSync(join(root, "scripts/stale-docs-audit.mjs")), "stale-docs-audit.mjs exists"],
];

for (const [ok, label] of required) {
  if (!ok) failures.push(label);
}

if (failures.length > 0) {
  console.error("FAIL roadmap consolidation check");
  for (const failure of failures) console.error(`- ${failure}`);
  process.exit(1);
}

console.log("PASS roadmap consolidation check");
