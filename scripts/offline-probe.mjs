/* global console, process */

import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";

const root = process.cwd();

function read(relativePath) {
  const path = join(root, relativePath);
  if (!existsSync(path)) throw new Error(`Missing file: ${relativePath}`);
  return readFileSync(path, "utf8");
}

function fileHas(relativePath, needle) {
  return read(relativePath).includes(needle);
}

function check(name, ok, message = "") {
  console.log(`${ok ? "PASS" : "FAIL"} ${name}${message ? `: ${message}` : ""}`);
  return { name, ok, message };
}

function main() {
  const checks = [
    check("Migration 055 demo social reset", existsSync(join(root, "supabase/migrations/055_demo_social_interactions_reset.sql"))),
    check("Health targets migration 55", fileHas("src/app/api/setup/health/route.ts", "MIGRATION_TARGET = 55")),
    check("Answers API requires verified teacher", fileHas("src/app/api/answers/route.ts", "requireVerified: true")),
    check("Canonical social posts API", fileHas("src/app/api/social/posts/route.ts", "createSocialPost")),
    check("Legacy posts retired", fileHas("src/app/api/posts/route.ts", "LEGACY_POSTS_RETIRED")),
    check("Parent activity RPC wired", fileHas("src/lib/domain/parent-dashboard.ts", "get_parent_child_activity")),
    check(
      "Quiz questions play RPC wired",
      fileHas("src/lib/domain/learning/quiz.ts", "get_quiz_questions_for_play") ||
        fileHas("src/lib/domain/learning.ts", "getQuizQuestionsForPlay"),
    ),
    check("Moderation dual layer", fileHas("src/lib/domain/moderation.ts", "assertModeratedTextAsync")),
    check("Social domain split", existsSync(join(root, "src/lib/domain/social/feed.ts"))),
    check("Playwright config", existsSync(join(root, "playwright.config.ts"))),
    check("Playwright smoke spec", existsSync(join(root, "e2e/smoke.spec.ts"))),
    check("Playwright api spec", existsSync(join(root, "e2e/api.spec.ts"))),
    check("Playwright auth spec", existsSync(join(root, "e2e/auth.spec.ts"))),
    check(
      "E2E data-testid wiring",
      fileHas("src/components/demo-login-panel.tsx", "demo-login-student") ||
        fileHas("src/components/demo-login-panel.tsx", "demo-login-${account.role}"),
    ),
    check("Smoke readSocialDomain helper", fileHas("scripts/smoke-test.mjs", "readSocialDomain")),
    check("Testing regression doc", existsSync(join(root, "docs/testing-regression.md"))),
    check("Auth gates module", fileHas("src/lib/domain/auth-gates.ts", "resolveAuthGate")),
    check("Vitest config", existsSync(join(root, "vitest.config.ts"))),
    check("Production checklist doc", existsSync(join(root, "docs/production-checklist.md"))),
    check("Unit tests: moderation", existsSync(join(root, "src/lib/domain/moderation.test.ts"))),
    check("Unit tests: social feed", existsSync(join(root, "src/lib/domain/social/feed.test.ts"))),
    check("Unit tests: api routes", existsSync(join(root, "src/app/api/api-routes.test.ts"))),
    check("Vitest coverage config", fileHas("vitest.config.ts", "thresholds")),
    check("Unit tests: learning", existsSync(join(root, "src/lib/domain/learning.test.ts"))),
    check("Teacher form uses social API", fileHas("src/components/teacher-post-form.tsx", "/api/social/posts")),
    check("Family quiz activity panel", fileHas("src/components/child-quiz-activity-panel.tsx", "ChildQuizActivityPanel")),
    check("Family activity timeline", fileHas("src/components/child-activity-timeline.tsx", "ChildActivityTimeline")),
    check("CI runs lint and unit", fileHas(".github/workflows/ci.yml", "test:repo") && fileHas(".github/workflows/ci.yml", "playwright install")),
    check("Bundle includes 055", fileHas("scripts/bundle-migrations.mjs", "055_demo_social_interactions_reset.sql")),
    check("Pinned next dependency", fileHas("package.json", '"next": "16.2.9"')),
    check("reCAPTCHA domain module", fileHas("src/lib/domain/recaptcha.ts", "verifyRecaptchaToken")),
    check("Quiz questions API route", fileHas("src/app/api/learn/quiz/[quizId]/questions/route.ts", "getQuizQuestionsForPlay")),
    check("AI moderation scaffold", fileHas("src/lib/domain/moderation-ai.ts", "moderateWithAi")),
    check("README present", existsSync(join(root, "README.md"))),
    check("Skip to content link", fileHas("src/components/app-shell.tsx", "skipToContent")),
    check("KVKK export route", fileHas("src/app/api/account/export/route.ts", "exportUserData")),
  ];

  const failed = checks.filter((item) => !item.ok);
  console.log(`\nOffline probe: ${checks.length - failed.length}/${checks.length} passed`);
  process.exit(failed.length > 0 ? 1 : 0);
}

main();
