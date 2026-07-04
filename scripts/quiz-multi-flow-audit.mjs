/* global console, process */

import { readFileSync } from "node:fs";
import { join } from "node:path";

const root = process.cwd();
const failures = [];

const migration = readFileSync(join(root, "supabase/migrations/041_quiz_questions_and_attempts.sql"), "utf8");
const quizCard = readFileSync(join(root, "src/components/learn-quiz-card.tsx"), "utf8");
const schema = readFileSync(join(root, "src/lib/domain/learning/schemas.ts"), "utf8");
const questionsRoute = readFileSync(join(root, "src/app/api/learn/quiz/[quizId]/questions/route.ts"), "utf8");

if (!migration.includes("submit_quiz_attempt_full")) {
  failures.push("migration 041 missing multi-question submit RPC");
}
if (!schema.includes("answers")) {
  failures.push("submitQuizSchema must accept answers array");
}
if (!quizCard.includes("currentIndex") && !quizCard.includes("currentQuestion")) {
  failures.push("learn-quiz-card must step through questions");
}
if (!questionsRoute.includes("getQuizQuestionsForPlay")) {
  failures.push("quiz questions API must load play questions");
}

if (failures.length > 0) {
  console.error("FAIL quiz multi-flow audit");
  for (const failure of failures) console.error(`- ${failure}`);
  process.exit(1);
}

console.log("PASS quiz multi-flow audit");
