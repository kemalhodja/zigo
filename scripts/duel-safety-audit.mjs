/* global console, process */

import { readFileSync } from "node:fs";
import { join } from "node:path";

const root = process.cwd();
const failures = [];

const migration = readFileSync(join(root, "supabase/migrations/044_product_scope_hardening.sql"), "utf8");
const duelCard = readFileSync(join(root, "src/components/safe-duel-card.tsx"), "utf8");
const schema = readFileSync(join(root, "src/lib/domain/learning/schemas.ts"), "utf8");

if (!migration.includes("p_area_id")) {
  failures.push("duel RPC missing p_area_id area gate");
}
if (!schema.includes("areaId")) {
  failures.push("completeSafeDuelSchema missing areaId");
}
if (duelCard.includes("/api/messages")) {
  failures.push("safe duel card must not call messaging APIs");
}
if (
  !duelCard.includes("direct message") &&
  !duelCard.includes("d.noDm") &&
  !duelCard.includes("d.topicDesc")
) {
  failures.push("safe duel card must document no DM");
}

if (failures.length > 0) {
  console.error("FAIL duel safety audit");
  for (const failure of failures) console.error(`- ${failure}`);
  process.exit(1);
}

console.log("PASS duel safety audit");
