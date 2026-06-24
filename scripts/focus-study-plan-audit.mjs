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

const focusRoutes = [
  "src/app/api/learning/focus/start/route.ts",
  "src/app/api/learning/focus/complete/route.ts",
  "src/app/api/learning/focus/active/route.ts",
  "src/app/api/learning/focus/analytics/route.ts",
  "src/app/api/learning/focus/share/route.ts",
];

for (const route of focusRoutes) {
  read(route);
}

const studyPlan = read("src/app/api/learning/study-plan/route.ts");
const focusPage = read("src/app/focus/page.tsx");
const migration030 = read("supabase/migrations/030_focus_study_with_me.sql");
const migration031 = read("supabase/migrations/031_focus_analytics_and_plans.sql");
const focusAnalytics = read("src/lib/domain/focus-analytics.ts");

if (!studyPlan.includes("402")) {
  failures.push("study-plan route must return 402 without Zigo Plus");
}
if (!studyPlan.includes("isPremium")) {
  failures.push("study-plan route must check subscription.isPremium");
}
if (!focusPage.includes("Focus") && !focusPage.includes("focus")) {
  failures.push("focus page must expose Pomodoro UI");
}
if (!migration030.includes("start_focus_session") || !migration030.includes("complete_focus_session")) {
  failures.push("migration 030 must define focus session RPCs");
}
if (!migration031.includes("upsert_study_plan") || !migration031.includes("get_active_focus_session")) {
  failures.push("migration 031 must define study plan and active session RPCs");
}
if (!focusAnalytics.includes("get_student_focus_analytics")) {
  failures.push("focus-analytics must call get_student_focus_analytics RPC");
}

if (failures.length > 0) {
  console.error("FAIL focus study plan audit");
  for (const failure of failures) console.error(`- ${failure}`);
  process.exit(1);
}

console.log("PASS focus study plan audit");
