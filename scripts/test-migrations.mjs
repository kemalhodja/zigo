/* global console, process */

import { existsSync, readdirSync } from "node:fs";
import { join } from "node:path";

const root = process.cwd();
const migrationsDir = join(root, "supabase", "migrations");

function getExpectedMigrations() {
  if (!existsSync(migrationsDir)) return [];
  const files = readdirSync(migrationsDir).filter((name) => name.endsWith(".sql")).sort();
  return files;
}

const expected = getExpectedMigrations();
const REQUIRED_CHECKPOINTS = [
  "001_initial_schema.sql",
  "023_moderation_audit_log.sql",
  "055_demo_social_interactions_reset.sql",
  "066_ad_state_and_premium_system.sql",
  "077_moderation_report_resolved_at.sql",
  "078_admin_billing_grants.sql",
  "079_update_own_account_kind.sql",
];

function check(name, ok, message = "") {
  return { name, ok, message };
}

function main() {
  const checks = [];

  checks.push(check("Migrations directory exists", existsSync(migrationsDir)));

  const files = existsSync(migrationsDir)
    ? readdirSync(migrationsDir).filter((name) => name.endsWith(".sql")).sort()
    : [];

  for (const fileName of expected) {
    checks.push(check(`Migration present: ${fileName}`, files.includes(fileName)));
  }

  const onlyExpected = expected.filter((name) => files.includes(name));
  checks.push(
    check(
      "Migration manifest order is intact",
      JSON.stringify(onlyExpected) === JSON.stringify(expected),
      onlyExpected.join(", "),
    ),
  );
  checks.push(
    check(
      "Required checkpoints are present",
      REQUIRED_CHECKPOINTS.every((cp) => files.includes(cp)),
      REQUIRED_CHECKPOINTS.join(", "),
    ),
  );

  checks.push(
    check(
      "Bundle script exists",
      existsSync(join(root, "scripts", "bundle-migrations.mjs")),
    ),
  );

  const failed = checks.filter((item) => !item.ok);
  for (const item of checks) {
    console.log(`${item.ok ? "PASS" : "FAIL"} ${item.name}${item.message ? `: ${item.message}` : ""}`);
  }

  process.exit(failed.length > 0 ? 1 : 0);
}

main();
