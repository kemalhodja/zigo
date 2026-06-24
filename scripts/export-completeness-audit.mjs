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

const migration = read("supabase/migrations/033_compliance_and_demo_child.sql");
const exportRoute = read("src/app/api/account/export/route.ts");
const deleteRoute = read("src/app/api/account/delete-request/route.ts");
const compliance = read("src/lib/domain/account-compliance.ts");
const types = read("src/lib/supabase/database.types.ts");

const exportKeys = ["profile", "interests", "learning_events", "child_profiles", "exported_at"];
for (const key of exportKeys) {
  if (!migration.includes(`'${key}'`)) {
    failures.push(`export_user_data migration missing payload key: ${key}`);
  }
}

const requiredMigration = [
  "export_user_data",
  "request_account_deletion",
  "account_deletion_requests",
];
for (const marker of requiredMigration) {
  if (!migration.includes(marker)) {
    failures.push(`migration 033 missing ${marker}`);
  }
}

const requiredWiring = [
  [exportRoute.includes("exportUserData"), "export route calls exportUserData"],
  [deleteRoute.includes("requestAccountDeletion"), "delete-request route calls requestAccountDeletion"],
  [compliance.includes("export_user_data"), "account-compliance uses export_user_data RPC"],
  [compliance.includes("request_account_deletion"), "account-compliance uses request_account_deletion RPC"],
  [types.includes("export_user_data"), "database.types includes export_user_data"],
  [types.includes("request_account_deletion"), "database.types includes request_account_deletion"],
];

for (const [ok, label] of requiredWiring) {
  if (!ok) failures.push(label);
}

if (failures.length > 0) {
  console.error("FAIL export completeness audit");
  for (const failure of failures) console.error(`- ${failure}`);
  process.exit(1);
}

console.log(`PASS export completeness audit (${exportKeys.length} payload keys)`);
