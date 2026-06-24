/* global console, process */

import { readFileSync } from "node:fs";
import { join } from "node:path";

const root = process.cwd();
const failures = [];

const learnPage = readFileSync(join(root, "src/app/learn/page.tsx"), "utf8");
const missions = readFileSync(join(root, "src/components/daily-missions-card.tsx"), "utf8");
const quizCard = readFileSync(join(root, "src/components/learn-quiz-card.tsx"), "utf8");

const requiredLinks = ["/focus", "/micro", "/duels", "/store"];
for (const href of requiredLinks) {
  if (!learnPage.includes(href) && !missions.includes(href)) {
    failures.push(`learn hub must link to ${href}`);
  }
}

const requiredImports = ["getMatchedQuizzes", "DailyMissionsCard", "LearnQuizCard"];
for (const symbol of requiredImports) {
  if (!learnPage.includes(symbol)) {
    failures.push(`learn page must import/use ${symbol}`);
  }
}

if (!missions.includes("watch-reel") || !missions.includes("safe-duel") || !missions.includes("focus-pomodoro")) {
  failures.push("daily missions must include watch, duel, and focus mission ids");
}
if (!quizCard.includes("submit")) {
  failures.push("learn-quiz-card must submit quiz attempts");
}

if (failures.length > 0) {
  console.error("FAIL learn hub audit");
  for (const failure of failures) console.error(`- ${failure}`);
  process.exit(1);
}

console.log("PASS learn hub audit");
