/* global console, process */

import { readFileSync } from "node:fs";
import { join } from "node:path";

const root = process.cwd();
const failures = [];

const gamification = readFileSync(join(root, "src/app/api/gamification/award/route.ts"), "utf8");
const reelRpc = readFileSync(join(root, "supabase/migrations/026_fix_reel_award_ambiguous_points.sql"), "utf8");
const duelRpc = readFileSync(join(root, "supabase/migrations/028_duel_and_quiz_learning_events.sql"), "utf8");
const storeMigration = readFileSync(join(root, "supabase/migrations/004_zigo_store.sql"), "utf8");

if (!gamification.includes("410")) {
  failures.push("gamification award route must remain disabled");
}
if (!reelRpc.includes("p_points <> 10")) {
  failures.push("reel award RPC must enforce 10 points");
}
if (!duelRpc.includes("'duel_win'") || !duelRpc.includes(", 25)")) {
  failures.push("duel award must use 25 points");
}
if (!storeMigration.includes("price_points > 0")) {
  failures.push("store products must enforce positive price_points");
}

if (failures.length > 0) {
  console.error("FAIL store economy audit");
  for (const failure of failures) console.error(`- ${failure}`);
  process.exit(1);
}

console.log("PASS store economy audit");
