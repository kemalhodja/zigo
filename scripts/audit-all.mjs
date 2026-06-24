/* global console, process */

import { join } from "node:path";
import { spawnSync } from "node:child_process";

const root = process.cwd();

function run(script) {
  const result = spawnSync(process.execPath, [join(root, "scripts", script)], {
    cwd: root,
    stdio: "inherit",
    env: process.env,
  });
  return result.status === 0;
}

const audits = [
  "typescript-audit.mjs",
  "dependency-audit.mjs",
  "dead-code-audit.mjs",
  "auth-production-check.mjs",
  "moderation-keyword-sync-check.mjs",
  "moderation-pipeline-audit.mjs",
  "moderation-production-check.mjs",
  "env-leak-audit.mjs",
  "cors-security-audit.mjs",
  "operational-security-check.mjs",
  "match-feed-invariant-audit.mjs",
  "no-student-dm-audit.mjs",
  "teacher-verification-audit.mjs",
  "store-parent-approval-audit.mjs",
  "store-economy-audit.mjs",
  "duel-safety-audit.mjs",
  "micro-lesson-gates-audit.mjs",
  "quiz-multi-flow-audit.mjs",
  "child-profile-switch-audit.mjs",
  "product-scope-production-check.mjs",
  "accessibility-audit.mjs",
  "ux-polish-audit.mjs",
  "monitoring-health-audit.mjs",
  "production-readiness-check.mjs",
  "legal-pages-audit.mjs",
  "export-completeness-audit.mjs",
  "compliance-production-check.mjs",
  "learning-events-audit.mjs",
  "focus-study-plan-audit.mjs",
  "learn-hub-audit.mjs",
  "area-matched-learning-audit.mjs",
  "education-production-check.mjs",
  "social-shell-audit.mjs",
  "release-scorecard-audit.mjs",
  "platform-quality-check.mjs",
  "ci-alignment-audit.mjs",
  "hosted-launch-audit.mjs",
  "final-launch-check.mjs",
  "stale-docs-audit.mjs",
  "roadmap-consolidation-check.mjs",
];

const failed = [];
for (const script of audits) {
  const ok = run(script);
  if (!ok) failed.push(script);
}

if (failed.length > 0) {
  console.error(`FAIL audit:all (${failed.length} scripts)`);
  for (const name of failed) console.error(`- ${name}`);
  process.exit(1);
}

console.log(`PASS audit:all (${audits.length} scripts)`);
