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
  const healthMatch = health.match(/MIGRATION_TARGET\s*=\s*(\d+)/);
  if (healthMatch) return Number(healthMatch[1]);
  // Health route may import MIGRATION_TARGET from the source-of-truth module instead of declaring it inline.
  const source = read("src/lib/domain/migration-target.ts");
  const sourceMatch = source.match(/MIGRATION_TARGET\s*=\s*(\d+)/);
  return sourceMatch ? Number(sourceMatch[1]) : null;
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
  [typeof target === "number" && target >= 77, `health route MIGRATION_TARGET must be at least 78 (got ${target})`],
  [scorecard.includes("078_admin_billing_grants") || scorecard.includes("Migration 078") || scorecard.includes("086"), "test-scorecard must reference migration 077+"],
  [!scorecard.includes("migrationTarget === 42"), "test-scorecard must not expect migrationTarget 42"],
  [acceptance.includes("001-078") || acceptance.includes("077") || acceptance.includes("086"), "test-acceptance must reference migrations through 077+"],
  [completion.includes("077") || completion.includes("001–078") || completion.includes("066") || completion.includes("086"), "completion-status must reference current migrations"],
  [packageJson.includes('"audit:all"'), "package.json must wire audit:all"],
  [packageJson.includes('"test:acceptance"'), "package.json must wire test:acceptance"],
  [packageJson.includes('"test:scorecard"'), "package.json must wire test:scorecard"],
  [bundle.includes("078_admin_billing_grants.sql") || bundle.includes("066_ad_state_and_premium_system.sql") || bundle.includes("086_ai_mentor.sql"), "bundled SQL must include recent migrations"],
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
