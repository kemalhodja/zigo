/* global console, process */

import { readFileSync } from "node:fs";
import { join } from "node:path";

const root = process.cwd();
const failures = [];

const migration = readFileSync(join(root, "supabase/migrations/044_product_scope_hardening.sql"), "utf8");
const socialSchema = readFileSync(join(root, "src/lib/domain/social/schemas.ts"), "utf8");
const learningSchema = readFileSync(join(root, "src/lib/domain/learning/schemas.ts"), "utf8");
const reelRpc = readFileSync(join(root, "supabase/migrations/026_fix_reel_award_ambiguous_points.sql"), "utf8");

if (!migration.includes("is_verified")) {
  failures.push("complete_video_post must require verified teacher");
}
if (!migration.includes("seconds_watched < 60")) {
  failures.push("complete_video_post must require 60 seconds");
}
if (!socialSchema.includes("min(60)")) {
  failures.push("social reel schema must require min 60 seconds");
}
if (!learningSchema.includes("min(60)")) {
  failures.push("learning video schema must require min 60 seconds");
}
if (!reelRpc.includes("is_verified = true")) {
  failures.push("reel award RPC must require verified teacher");
}

if (failures.length > 0) {
  console.error("FAIL micro lesson gates audit");
  for (const failure of failures) console.error(`- ${failure}`);
  process.exit(1);
}

console.log("PASS micro lesson gates audit");
