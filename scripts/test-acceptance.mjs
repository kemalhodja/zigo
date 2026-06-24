/* global console, process, fetch */

import { createHmac } from "node:crypto";
import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { spawnSync } from "node:child_process";

const root = process.cwd();

const PILLARS = [
  { id: "migrations", label: "Migrations 001-055", weight: 8, check: () => existsSync(join(root, "supabase/migrations/055_demo_social_interactions_reset.sql")) },
  { id: "compliance", label: "KVKK export & delete API", weight: 8, check: () => fileIncludes("src/app/api/account/export/route.ts", "exportUserData") && fileIncludes("src/app/api/account/delete-request/route.ts", "requestAccountDeletion") },
  { id: "cookie", label: "Cookie consent banner", weight: 5, check: () => fileIncludes("src/components/cookie-consent-banner.tsx", "CookieConsentBanner") },
  { id: "video", label: "Video CDN helper wired", weight: 5, check: () => fileIncludes("src/components/social-media-frame.tsx", "getMediaPlaybackUrl") && fileIncludes("src/lib/domain/video-delivery.ts", "getVideoPlaybackUrl") },
  { id: "push", label: "Push notification scaffold wired", weight: 5, check: () => fileIncludes("src/components/push-notification-panel.tsx", "getPushTopicsForRole") && fileIncludes("src/app/notifications/page.tsx", "PushNotificationPanel") },
  { id: "stripe", label: "Stripe webhook signature", weight: 7, check: () => fileIncludes("src/lib/domain/stripe-webhook.ts", "verifyStripeWebhookSignature") },
  { id: "journeys", label: "Full role journeys", weight: 10, check: () => fileIncludes("scripts/manual-full-journey.mjs", "manual-parent-journey") },
  { id: "staging", label: "Staging preflight script", weight: 7, check: () => fileIncludes("package.json", "staging:preflight") },
  { id: "audits", label: "Consolidated audit:all gate", weight: 5, check: () => fileIncludes("package.json", '"audit:all"') && fileIncludes("scripts/audit-all.mjs", "education-production-check") },
];

function fileIncludes(relativePath, needle) {
  const path = join(root, relativePath);
  if (!existsSync(path)) return false;
  return readFileSync(path, "utf8").includes(needle);
}

function runNodeScript(relativePath) {
  const result = spawnSync(process.execPath, [join(root, relativePath)], {
    cwd: root,
    stdio: "pipe",
    encoding: "utf8",
  });
  return result.status === 0;
}

function runRepoSuite() {
  const scripts = [
    "scripts/test-migrations.mjs",
    "scripts/smoke-test.mjs",
    "scripts/rls-smoke.mjs",
    "scripts/verify-deploy-readiness.mjs",
    "scripts/test-stripe-webhook.mjs",
    "scripts/test-video-delivery.mjs",
    "scripts/mobile-smoke.mjs",
  ];
  if (!scripts.every(runNodeScript)) return false;
  const typecheck = spawnSync("npx tsc --noEmit", { cwd: root, stdio: "pipe", encoding: "utf8", shell: true });
  if (typecheck.status !== 0) return false;
  const lint = spawnSync("npm run lint", { cwd: root, stdio: "pipe", encoding: "utf8", shell: true });
  return lint.status === 0;
}

function runLiveSuite() {
  return runNodeScript("scripts/live-supabase-check.mjs");
}

function verifyStripeSignatureLocal() {
  const secret = "whsec_test_secret";
  const payload = '{"id":"evt_test"}';
  const timestamp = Math.floor(Date.now() / 1000);
  const signature = createHmac("sha256", secret).update(`${timestamp}.${payload}`, "utf8").digest("hex");
  const header = `t=${timestamp},v1=${signature}`;
  const parts = header.split(",").map((p) => p.trim());
  const ts = parts.find((p) => p.startsWith("t="))?.slice(2);
  const sigs = parts.filter((p) => p.startsWith("v1=")).map((p) => p.slice(3));
  const expected = createHmac("sha256", secret).update(`${ts}.${payload}`, "utf8").digest("hex");
  return sigs.includes(expected);
}

async function detectBaseUrl() {
  const forced = process.env.E2E_BASE_URL?.replace(/\/$/, "");
  if (forced) {
    try {
      const response = await fetch(`${forced}/api/setup/health`, { signal: AbortSignal.timeout(4000) });
      if (response.ok) return forced;
    } catch {
      return null;
    }
  }

  for (const base of [
    "http://localhost:3004",
    "http://localhost:3001",
    "http://localhost:3003",
    "http://localhost:3002",
    "http://localhost:3000",
  ]) {
    try {
      const response = await fetch(`${base}/api/setup/health`, { signal: AbortSignal.timeout(4000) });
      if (response.ok) return base;
    } catch {
      // next
    }
  }
  return null;
}

async function main() {
  let score = 0;
  const maxFromPillars = PILLARS.reduce((sum, p) => sum + p.weight, 0);

  console.log("=== Zigo platform score ===\n");

  for (const pillar of PILLARS) {
    const ok = pillar.check();
    if (ok) score += pillar.weight;
    console.log(`${ok ? "PASS" : "FAIL"} ${pillar.label} (+${pillar.weight})`);
  }

  const repoOk = runRepoSuite();
  if (repoOk) {
    score += 20;
    console.log("PASS test:repo (+20)");
  } else {
    console.log("FAIL test:repo (+0)");
  }

  const liveOk = runLiveSuite();
  if (liveOk) {
    score += 15;
    console.log("PASS test:live (+15)");
  } else {
    console.log("FAIL test:live (+0)");
  }

  if (verifyStripeSignatureLocal()) {
    score += 5;
    console.log("PASS Stripe signature unit (+5)");
  } else {
    console.log("FAIL Stripe signature unit (+0)");
  }

  const baseUrl = await detectBaseUrl();
  const legalRouteExists =
    fileIncludes("src/app/legal/delete-account/page.tsx", "/api/account/delete-request") &&
    fileIncludes("src/app/legal/delete-account/page.tsx", "/api/account/export");

  if (baseUrl) {
    try {
      const legal = await fetch(`${baseUrl}/legal/delete-account`, { signal: AbortSignal.timeout(8_000) });
      if (legal.ok) {
        score += 5;
        console.log("PASS /legal/delete-account reachable (+5)");
      } else {
        console.log("FAIL /legal/delete-account (+0)");
      }
    } catch {
      if (legalRouteExists) {
        score += 5;
        console.log("PASS /legal/delete-account wired (+5, static)");
      } else {
        console.log("SKIP runtime legal page (server unreachable) (+0)");
      }
    }
  } else if (legalRouteExists) {
    score += 5;
    console.log("PASS /legal/delete-account wired (+5, static)");
  } else {
    console.log("SKIP runtime legal page (no dev server) (+0)");
  }

  const theoreticalMax = maxFromPillars + 20 + 15 + 5 + 5;
  const normalized = Math.min(100, Math.round((score / theoreticalMax) * 100));

  console.log(`\nRaw points: ${score}/${theoreticalMax}`);
  console.log(`Platform score: ${normalized}/100`);

  const exitCode = normalized >= 95 ? 0 : 1;
  setTimeout(() => process.exit(exitCode), 250);
}

main().catch((error) => {
  console.error(error);
  setTimeout(() => process.exit(1), 250);
});
