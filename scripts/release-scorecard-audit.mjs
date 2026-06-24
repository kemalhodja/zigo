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
const scorecard = read("scripts/test-scorecard.mjs");
const acceptance = read("scripts/test-acceptance.mjs");
const completion = read("docs/completion-status.md");
const packageJson = read("package.json");
const bundle = existsSync(join(root, "supabase/zigo-full-migrations.sql"))
  ? readFileSync(join(root, "supabase/zigo-full-migrations.sql"), "utf8")
  : "";

const required = [
  [target === 55, `health route MIGRATION_TARGET must be 55 (got ${target})`],
  [scorecard.includes("055_demo_social_interactions_reset"), "test-scorecard must reference migration 055"],
  [!scorecard.includes("migrationTarget === 42"), "test-scorecard must not expect migrationTarget 42"],
  [acceptance.includes("001-055") || acceptance.includes("055"), "test-acceptance must reference migrations through 055"],
  [completion.includes("055") || completion.includes("001–055") || completion.includes("049"), "completion-status must reference current migrations"],
  [packageJson.includes('"audit:all"'), "package.json must wire audit:all"],
  [packageJson.includes('"test:acceptance"'), "package.json must wire test:acceptance"],
  [packageJson.includes('"test:scorecard"'), "package.json must wire test:scorecard"],
  [bundle.includes("055_demo_social_interactions_reset.sql"), "bundled SQL must include migration 055"],
];

for (const [ok, label] of required) {
  if (!ok) failures.push(label);
}

if (failures.length > 0) {
  console.error("FAIL release scorecard audit");
  for (const failure of failures) console.error(`- ${failure}`);
  process.exit(1);
}

console.log(`PASS release scorecard audit (migration target ${target})`);
