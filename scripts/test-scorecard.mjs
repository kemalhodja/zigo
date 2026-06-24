/* global console, process, fetch */

import { spawnSync } from "node:child_process";
import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";

const root = process.cwd();

const STATIC_PILLARS = [
  { id: "migrations", label: "Migration 055", pts: 5, ok: () => existsSync(join(root, "supabase/migrations/055_demo_social_interactions_reset.sql")) },
  { id: "compliance", label: "KVKK API + UI", pts: 5, ok: () => fileHas("src/app/api/account/export/route.ts", "exportUserData") && fileHas("src/app/legal/delete-account/page.tsx", "exportData") },
  { id: "video", label: "Video CDN wired", pts: 5, ok: () => fileHas("src/components/social-media-frame.tsx", "getMediaPlaybackUrl") },
  { id: "push", label: "Push panel wired", pts: 5, ok: () => fileHas("src/app/notifications/page.tsx", "PushNotificationPanel") },
  { id: "cookie", label: "Cookie consent", pts: 3, ok: () => fileHas("src/components/app-shell.tsx", "CookieConsentBanner") },
  { id: "stripe", label: "Stripe webhook", pts: 5, ok: () => fileHas("src/lib/domain/stripe-webhook.ts", "verifyStripeWebhookSignature") },
  { id: "bundle", label: "55-migration bundle", pts: 2, ok: () => fileHas("supabase/zigo-full-migrations.sql", "055_demo_social_interactions_reset") },
  { id: "audits", label: "audit:all wired", pts: 3, ok: () => fileHas("package.json", '"audit:all"') && fileHas("scripts/audit-all.mjs", "production-readiness-check") },
];

const RUN_SUITES = [
  { id: "migrations", label: "test:migrations", script: "scripts/test-migrations.mjs", pts: 8 },
  { id: "smoke", label: "test:smoke", script: "scripts/smoke-test.mjs", pts: 12 },
  { id: "rls", label: "test:rls", script: "scripts/rls-smoke.mjs", pts: 8 },
  { id: "deploy", label: "test:deploy", scripts: ["scripts/verify-deploy-readiness.mjs", "scripts/test-stripe-webhook.mjs"], pts: 6 },
  { id: "video", label: "test:video-delivery", script: "scripts/test-video-delivery.mjs", pts: 4 },
  { id: "mobile", label: "test:mobile", script: "scripts/mobile-smoke.mjs", pts: 4 },
  { id: "unit", label: "test:unit", cmd: "npm run test:unit", shell: true, pts: 8 },
  {
    id: "playwright",
    label: "test:playwright",
    cmd: "npm run test:playwright",
    shell: true,
    pts: 5,
    livePts: 8,
  },
  { id: "offline", label: "offline-probe", script: "scripts/offline-probe.mjs", pts: 10 },
  { id: "live", label: "test:live", script: "scripts/live-supabase-check.mjs", pts: 12, requiresLive: true },
  { id: "typecheck", label: "typecheck", cmd: "npx tsc --noEmit", shell: true, pts: 5 },
  { id: "lint", label: "lint", cmd: "npm run lint", shell: true, pts: 4 },
  { id: "env", label: "env:check", script: "scripts/validate-env.mjs", pts: 3 },
  { id: "journey", label: "test:journey", script: "scripts/manual-full-journey.mjs", pts: 15, requiresLive: true },
  { id: "e2e", label: "test:e2e", script: "scripts/e2e-flow-check.mjs", pts: 10, requiresLive: true, skipIfJourneyOk: true },
];

function liveTestsEnabled() {
  return process.env.ZIGO_RUN_LIVE_TESTS === "1";
}

function fileHas(relativePath, needle) {
  const path = join(root, relativePath);
  if (!existsSync(path)) return false;
  return readFileSync(path, "utf8").includes(needle);
}

function runScript(relativePath) {
  const result = spawnSync(process.execPath, [join(root, relativePath)], {
    cwd: root,
    stdio: "pipe",
    encoding: "utf8",
    env: process.env,
  });
  return { ok: result.status === 0, status: result.status ?? 1, stderr: result.stderr?.slice(-400) ?? "" };
}

function runShell(cmd) {
  const result = spawnSync(cmd, { cwd: root, stdio: "pipe", encoding: "utf8", shell: true, env: process.env });
  return { ok: result.status === 0, status: result.status ?? 1, stderr: result.stderr?.slice(-400) ?? "" };
}

async function detectBaseUrl() {
  const forced = process.env.E2E_BASE_URL?.replace(/\/$/, "");
  const candidates = forced ? [forced] : ["http://localhost:3004", "http://localhost:3005", "http://localhost:3001", "http://localhost:3003", "http://localhost:3000"];
  for (const base of candidates) {
    try {
      const response = await fetch(`${base}/api/setup/health`, { signal: AbortSignal.timeout(4000) });
      if (response.ok) return base;
    } catch {
      // next
    }
  }
  return null;
}

async function runtimeChecks(baseUrl) {
  const rows = [];
  let pts = 0;
  const max = 9;

  const checks = [
    {
      label: "Health API",
      pts: 3,
      run: async () => {
        const r = await fetch(`${baseUrl}/api/setup/health`);
        const b = await r.json().catch(() => ({}));
        return r.ok && b?.data?.migrationTarget === 55;
      },
    },
    {
      label: "Legal delete-account",
      pts: 2,
      run: async () => (await fetch(`${baseUrl}/legal/delete-account`)).ok,
    },
    {
      label: "Account export API",
      pts: 2,
      run: async () => {
        const signIn = await fetch(`${baseUrl}/api/auth/sign-in`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email: "student@zigo.test", password: "ZigoTest123!" }),
        });
        const cookies = signIn.headers.getSetCookie?.()?.map((c) => c.split(";")[0]).join("; ")
          ?? signIn.headers.get("set-cookie")?.split(";")[0] ?? "";
        const exp = await fetch(`${baseUrl}/api/account/export`, { headers: cookies ? { Cookie: cookies } : {} });
        const body = await exp.json().catch(() => ({}));
        return exp.ok && Boolean(body?.data?.profile);
      },
    },
    {
      label: "Notifications page",
      pts: 2,
      run: async () => (await fetch(`${baseUrl}/notifications`)).ok,
    },
  ];

  for (const check of checks) {
    let ok = false;
    try {
      ok = await check.run();
    } catch {
      ok = false;
    }
    if (ok) pts += check.pts;
    rows.push({ label: check.label, ok, pts: check.pts, earned: ok ? check.pts : 0 });
    console.log(`${ok ? "PASS" : "FAIL"} runtime · ${check.label} (+${ok ? check.pts : 0}/${check.pts})`);
  }

  return { rows, pts, max };
}

async function main() {
  console.log("=== Zigo full test scorecard ===\n");

  let totalEarned = 0;
  let totalMax = 0;
  const summary = [];

  for (const pillar of STATIC_PILLARS) {
    const ok = pillar.ok();
    const earned = ok ? pillar.pts : 0;
    totalEarned += earned;
    totalMax += pillar.pts;
    summary.push({ group: "static", label: pillar.label, ok, earned, max: pillar.pts });
    console.log(`${ok ? "PASS" : "FAIL"} static · ${pillar.label} (+${earned}/${pillar.pts})`);
  }

  let journeyPassed = false;

  for (const suite of RUN_SUITES) {
    if (suite.requiresLive && !liveTestsEnabled()) {
      console.log(`SKIP suite · ${suite.label} (set ZIGO_RUN_LIVE_TESTS=1 for live probes)`);
      continue;
    }

    if (suite.skipIfJourneyOk && journeyPassed) {
      totalMax += suite.pts;
      summary.push({ group: "suite", label: suite.label, ok: true, earned: suite.pts, max: suite.pts, skipped: true });
      console.log(`SKIP suite · ${suite.label} (covered by journey) (+${suite.pts}/${suite.pts})`);
      totalEarned += suite.pts;
      continue;
    }

    let ok = false;
    if (suite.scripts) {
      ok = suite.scripts.every((s) => runScript(s).ok);
    } else if (suite.shell) {
      ok = runShell(suite.cmd).ok;
    } else {
      ok = runScript(suite.script).ok;
    }

    if (suite.id === "journey") journeyPassed = ok;

    const maxPts = liveTestsEnabled() && suite.livePts ? suite.livePts : suite.pts;
    const earned = ok ? maxPts : 0;
    totalEarned += earned;
    totalMax += maxPts;
    summary.push({ group: "suite", label: suite.label, ok, earned, max: maxPts });
    console.log(`${ok ? "PASS" : "FAIL"} suite · ${suite.label} (+${earned}/${maxPts})`);
  }

  const baseUrl = await detectBaseUrl();
  if (baseUrl) {
    console.log(`\nRuntime base: ${baseUrl}\n`);
    const runtime = await runtimeChecks(baseUrl);
    totalEarned += runtime.pts;
    totalMax += runtime.max;
    for (const row of runtime.rows) {
      summary.push({ group: "runtime", label: row.label, ok: row.ok, earned: row.earned, max: row.pts });
    }
  } else {
    console.log("\nSKIP runtime checks (no server — run with dev server + ZIGO_RUN_LIVE_TESTS=1)\n");
  }

  const score = totalMax === 0 ? 0 : Math.min(100, Math.round((totalEarned / totalMax) * 100));
  const failed = summary.filter((row) => !row.ok && !row.skipped);
  const passThreshold = liveTestsEnabled() ? 95 : 90;

  console.log("\n=== SCORECARD ===");
  console.log(`Points: ${totalEarned}/${totalMax}`);
  console.log(`Platform score: ${score}/100`);
  console.log(`Suites passed: ${summary.filter((r) => r.ok).length}/${summary.length}`);

  if (failed.length > 0) {
    console.log("\nFailed:");
    for (const row of failed) console.log(`  - ${row.label}`);
  }

  setTimeout(() => process.exit(score >= passThreshold ? 0 : 1), 300);
}

main().catch((error) => {
  console.error(error);
  setTimeout(() => process.exit(1), 300);
});
