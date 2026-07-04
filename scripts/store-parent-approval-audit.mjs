/* global console, process */

import { readFileSync } from "node:fs";
import { join } from "node:path";

const root = process.cwd();
const failures = [];

const migration = readFileSync(join(root, "supabase/migrations/044_product_scope_hardening.sql"), "utf8");
const store = readFileSync(join(root, "src/lib/domain/store.ts"), "utf8");
const route = readFileSync(join(root, "src/app/api/store/redemptions/[id]/route.ts"), "utf8");
const queue = readFileSync(join(root, "src/components/parent-approval-queue.tsx"), "utf8");

if (!migration.includes("parent_update_store_redemption_status")) {
  failures.push("migration 044 missing parent_update_store_redemption_status");
}
if (!store.includes("updateParentStoreRedemption")) {
  failures.push("store.ts missing updateParentStoreRedemption");
}
if (!route.includes("PATCH")) {
  failures.push("store redemptions API missing PATCH");
}
if (
  (!queue.includes("Approve") && !queue.includes("q.approve") && !queue.includes("decide(item.id, \"approved\")")) ||
  !queue.includes("/api/store/redemptions/")
) {
  failures.push("parent approval queue missing approve actions");
}

if (failures.length > 0) {
  console.error("FAIL store parent approval audit");
  for (const failure of failures) console.error(`- ${failure}`);
  process.exit(1);
}

console.log("PASS store parent approval audit");
