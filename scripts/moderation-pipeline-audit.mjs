/* global console, process */

import { readFileSync, readdirSync, statSync } from "node:fs";
import { join } from "node:path";

const root = process.cwd();
const domainDir = join(root, "src/lib/domain");

const REQUIRED_ASYNC = [
  {
    file: "social/interactions.ts",
    markers: ["runModeratedPublishAction", "runModeratedFieldsAction", "runModeratedOptionalTextAction"],
  },
  {
    file: "questions/mutations.ts",
    markers: ["runModeratedSafeTextAction", "runModeratedFieldsAction"],
  },
  { file: "feed/mutations.ts", markers: ["assertSafeStudentTextAsync"] },
  { file: "learning/quiz.ts", markers: ["assertSafeStudentTextAsync"] },
  { file: "study-moments.ts", markers: ["assertSafeStudentTextAsync"] },
];

const MODERATION_HELPERS = [
  "moderateTextForPublish",
  "assertSafeStudentTextAsync",
  "runModeratedPublishAction",
  "runModeratedSafeTextAction",
  "runModeratedFieldsAction",
  "runModeratedOptionalTextAction",
];

const failures = [];

for (const item of REQUIRED_ASYNC) {
  const filePath = join(domainDir, item.file);
  const source = readFileSync(filePath, "utf8");
  for (const marker of item.markers) {
    if (!source.includes(marker)) {
      failures.push(`${item.file} missing ${marker}`);
    }
  }
}

function walk(dir, files = []) {
  for (const name of readdirSync(dir)) {
    const fullPath = join(dir, name);
    const stats = statSync(fullPath);
    if (stats.isDirectory()) {
      if (name.endsWith(".test.ts") || name === "node_modules") continue;
      walk(fullPath, files);
    } else if (name.endsWith(".ts") && !name.endsWith(".test.ts")) {
      files.push(fullPath);
    }
  }
  return files;
}

const riskyPatterns = [
  /\.from\(["']post_comments["']\)[\s\S]{0,400}\.insert\(/,
  /\.from\(["']story_replies["']\)[\s\S]{0,400}\.insert\(/,
];

for (const filePath of walk(domainDir)) {
  const relative = filePath.replace(`${domainDir}${join.sep}`, "").replaceAll("\\", "/");
  if (relative === "social/interactions.ts" || relative.endsWith("/moderation-policy.ts")) continue;
  const source = readFileSync(filePath, "utf8");
  const hasModerationHelper = MODERATION_HELPERS.some((marker) => source.includes(marker));
  for (const pattern of riskyPatterns) {
    if (pattern.test(source) && !hasModerationHelper) {
      failures.push(`${relative} inserts social text without moderation helper`);
    }
  }
}

if (failures.length > 0) {
  console.error("FAIL moderation pipeline audit");
  for (const failure of failures) {
    console.error(`- ${failure}`);
  }
  process.exit(1);
}

console.log(`PASS moderation pipeline audit (${REQUIRED_ASYNC.length} required modules checked)`);
