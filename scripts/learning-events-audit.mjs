/* global console, process */

import { readFileSync } from "node:fs";
import { join } from "node:path";

const root = process.cwd();
const failures = [];

const migration032 = readFileSync(join(root, "supabase/migrations/032_launch_gaps_closure.sql"), "utf8");
const migration028 = readFileSync(join(root, "supabase/migrations/028_duel_and_quiz_learning_events.sql"), "utf8");
const migration011 = readFileSync(join(root, "supabase/migrations/011_learning_events.sql"), "utf8");
const progress = readFileSync(join(root, "src/lib/domain/learning/progress.ts"), "utf8");
const awardRoute = readFileSync(join(root, "src/app/api/gamification/award/route.ts"), "utf8");

const actionTypes = ["reel_watch", "quiz_complete", "duel_win", "focus_session", "store_visit"];
for (const action of actionTypes) {
  if (!migration032.includes(`'${action}'`)) {
    failures.push(`learning_events must include action_type ${action} (migration 032)`);
  }
}

if (!migration011.includes("'reel_watch'")) {
  failures.push("migration 011 must define reel_watch events");
}
if (!migration028.includes("'quiz_complete'") || !migration028.includes("'duel_win'")) {
  failures.push("migration 028 must wire quiz and duel learning events");
}
if (!progress.includes("learning_events")) {
  failures.push("learning/progress must read learning_events");
}
if (!awardRoute.includes("410")) {
  failures.push("gamification award route must stay disabled (410)");
}

if (failures.length > 0) {
  console.error("FAIL learning events audit");
  for (const failure of failures) console.error(`- ${failure}`);
  process.exit(1);
}

console.log(`PASS learning events audit (${actionTypes.length} action types)`);
