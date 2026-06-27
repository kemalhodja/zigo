/* global console, process */

import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";

const root = process.cwd();

function read(relativePath) {
  const filePath = join(root, relativePath);
  if (!existsSync(filePath)) {
    throw new Error(`Missing file: ${relativePath}`);
  }
  return readFileSync(filePath, "utf8");
}

const failures = [];

const moderation = read("src/lib/domain/moderation.ts");
const moderationAi = read("src/lib/domain/moderation-ai.ts");
const interactions = read("src/lib/domain/social/interactions.ts");
const reportsRoute = read("src/app/api/social/reports/route.ts");
const keywords = read("src/lib/domain/moderation-keywords.ts");
const migration043 = read("supabase/migrations/043_content_moderation_publish_rls.sql");
const contentSafetyDoc = read("docs/content-safety.md");
const packageJson = read("package.json");

const moderationPolicy = read("src/lib/domain/moderation-policy.ts");
const migration053 = read("supabase/migrations/053_moderation_strikes.sql");

const required = [
  [moderation.includes("moderateTextForPublish"), "moderateTextForPublish helper exists"],
  [moderation.includes("resolveModerationPublishStatus"), "resolveModerationPublishStatus exists"],
  [moderationAi.includes("needsReview"), "AI moderation supports needsReview"],
  [
    interactions.includes("runModeratedPublishAction") || interactions.includes("moderateTextForPublish"),
    "comments/replies use moderated publish policy",
  ],
  [moderationPolicy.includes("recordModerationStrike"), "strike + admin alert policy exists"],
  [migration053.includes("record_moderation_violation"), "DB strike function migration exists"],
  [reportsRoute.includes("updateContentReportStatus"), "reports PATCH updates status"],
  [
    reportsRoute.includes("export async function PATCH") || reportsRoute.includes("export const PATCH"),
    "reports route exports PATCH",
  ],
  [keywords.includes("KEYWORD_LIST_VERSION"), "keyword list version constant exists"],
  [migration043.includes("moderation_status in ('approved', 'pending')"), "RLS allows pending for non-students"],
  [migration043.includes("Platform admins can update content reports"), "report update RLS for admins"],
  [contentSafetyDoc.includes("moderateTextForPublish") || contentSafetyDoc.includes("moderation-policy"), "content safety doc references moderation"],
  [packageJson.includes('"audit:moderation"'), "audit:moderation script wired"],
];

for (const [ok, label] of required) {
  if (!ok) failures.push(label);
}

if (failures.length > 0) {
  console.error("FAIL moderation production audit");
  for (const failure of failures) {
    console.error(`- ${failure}`);
  }
  process.exit(1);
}

console.log("PASS moderation production audit");
