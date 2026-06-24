/* global console, process */

import { readFileSync } from "node:fs";
import { join } from "node:path";

const root = process.cwd();
const failures = [];

const migration041 = readFileSync(join(root, "supabase/migrations/041_quiz_questions_and_attempts.sql"), "utf8");
const quizDomain = readFileSync(join(root, "src/lib/domain/learning/quiz.ts"), "utf8");
const feedQueries = readFileSync(join(root, "src/lib/domain/feed/queries.ts"), "utf8");

if (!migration041.includes("current_user_has_area(quizzes.area_id)")) {
  failures.push("get_matched_quizzes must gate by current_user_has_area");
}
if (!migration041.includes("get_child_matched_quizzes")) {
  failures.push("migration 041 must define get_child_matched_quizzes");
}
if (!quizDomain.includes("get_matched_quizzes") || !quizDomain.includes("get_child_matched_quizzes")) {
  failures.push("learning/quiz must call matched quiz RPCs");
}
if (!feedQueries.includes("user_interests") || !feedQueries.includes("area_id")) {
  failures.push("feed/queries must filter posts by user_interests area_id");
}

if (failures.length > 0) {
  console.error("FAIL area matched learning audit");
  for (const failure of failures) console.error(`- ${failure}`);
  process.exit(1);
}

console.log("PASS area matched learning audit");
