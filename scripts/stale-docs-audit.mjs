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

function expectedMigrationTarget() {
  const health = read("src/app/api/setup/health/route.ts");
  const match = health.match(/MIGRATION_TARGET\s*=\s*(\d+)/);
  return match ? Number(match[1]) : null;
}

const target = expectedMigrationTarget();
const stalePattern = /001[–-]042\b/;

const docsToScan = [
  "README.md",
  "docs/manual-qa-checklist.md",
  "docs/rls-policy-inventory.md",
  "src/components/hosted-deploy-card.tsx",
];

for (const doc of docsToScan) {
  const content = read(doc);
  if (stalePattern.test(content)) {
    failures.push(`${doc} still references migrations 001-042 (expected through ${target})`);
  }
  if (target !== null && content.includes("migrationTarget: 42")) {
    failures.push(`${doc} still references migrationTarget 42`);
  }
}

if (target !== null) {
  const readme = read("README.md");
  if (!readme.includes(String(target)) && !readme.includes("044")) {
    failures.push("README must reference current migration 044");
  }
}

if (failures.length > 0) {
  console.error("FAIL stale docs audit");
  for (const failure of failures) console.error(`- ${failure}`);
  process.exit(1);
}

console.log(`PASS stale docs audit (migration target ${target})`);
