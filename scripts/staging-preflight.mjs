/* global console, process, fetch */

import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { spawnSync } from "node:child_process";
import { createClient } from "@supabase/supabase-js";

const root = process.cwd();
const EXPECTED_MIGRATION_032 = "032_launch_gaps_closure.sql";
const EXPECTED_MIGRATION_033 = "033_compliance_and_demo_child.sql";
const EXPECTED_MIGRATION_044 = "044_product_scope_hardening.sql";

function expectedMigrationTarget() {
  try {
    const health = readFileSync(join(root, "src/app/api/setup/health/route.ts"), "utf8");
    const match = health.match(/MIGRATION_TARGET\s*=\s*(\d+)/);
    return match ? Number(match[1]) : null;
  } catch {
    return null;
  }
}

function loadEnvFile(name) {
  const filePath = join(root, name);
  if (!existsSync(filePath)) return false;
  for (const line of readFileSync(filePath, "utf8").split("\n")) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const separator = trimmed.indexOf("=");
    if (separator === -1) continue;
    const key = trimmed.slice(0, separator).trim();
    const value = trimmed.slice(separator + 1).trim().replace(/^['"]|['"]$/g, "");
    if (!process.env[key]) process.env[key] = value;
  }
  return true;
}

function step(name, ok, detail = "") {
  const item = { name, ok, detail };
  console.log(`${ok ? "PASS" : "FAIL"} ${name}${detail ? `: ${detail}` : ""}`);
  return item;
}

function isSet(value) {
  return Boolean(value?.trim());
}

function isLocalUrl(url) {
  try {
    const { hostname } = new URL(url);
    return hostname === "localhost" || hostname === "127.0.0.1";
  } catch {
    return true;
  }
}

function runNpmScript(script) {
  const result = spawnSync(process.platform === "win32" ? "npm.cmd" : "npm", ["run", script], {
    cwd: root,
    stdio: "inherit",
    env: process.env,
    shell: process.platform === "win32",
  });
  return result.status === 0;
}

async function main() {
  const skipBuild = process.argv.includes("--skip-build");
  loadEnvFile(".env.local");
  loadEnvFile(".env");

  const results = [];
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL?.trim()?.replace(/\/$/, "") ?? "";
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim() ?? "";
  const anon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY?.trim() ?? "";
  const serviceRole = process.env.SUPABASE_SERVICE_ROLE_KEY?.trim() ?? "";

  results.push(step("Env file", existsSync(join(root, ".env.local")), ".env.local"));
  results.push(step("NEXT_PUBLIC_SUPABASE_URL", isSet(supabaseUrl), supabaseUrl || "missing"));
  results.push(step("NEXT_PUBLIC_SUPABASE_ANON_KEY", isSet(anon), isSet(anon) ? "configured" : "missing"));
  results.push(
    step(
      "NEXT_PUBLIC_SITE_URL",
      isSet(siteUrl) && !isLocalUrl(siteUrl),
      siteUrl || "set hosted URL (not localhost) before staging deploy",
    ),
  );
  results.push(
    step(
      "SUPABASE_SERVICE_ROLE_KEY",
      isSet(serviceRole),
      isSet(serviceRole) ? "configured" : "required for live probes",
    ),
  );

  const devBypass =
    process.env.ZIGO_BILLING_DEV_BYPASS === "true" || process.env.NEXT_PUBLIC_ZIGO_BILLING_DEV_BYPASS === "true";
  results.push(
    step(
      "Billing dev bypass disabled for staging",
      !devBypass || isLocalUrl(siteUrl),
      devBypass ? "turn off ZIGO_BILLING_DEV_BYPASS on hosted staging" : "ok",
    ),
  );

  const emailConfirmDisabled = process.env.ZIGO_REQUIRE_EMAIL_CONFIRM === "false";
  const studentDocDisabled = process.env.ZIGO_REQUIRE_STUDENT_DOCUMENT === "false";
  const recaptchaDisabled = process.env.ZIGO_REQUIRE_RECAPTCHA === "false";
  const recaptchaConfigured = Boolean(
    process.env.NEXT_PUBLIC_RECAPTCHA_SITE_KEY?.trim() && process.env.RECAPTCHA_SECRET_KEY?.trim(),
  );

  if (!isLocalUrl(siteUrl)) {
    results.push(
      step(
        "Email confirmation enforced on hosted staging",
        !emailConfirmDisabled,
        emailConfirmDisabled ? "set ZIGO_REQUIRE_EMAIL_CONFIRM=true" : "ok",
      ),
    );
    results.push(
      step(
        "Student document gate enabled on hosted staging",
        !studentDocDisabled,
        studentDocDisabled ? "set ZIGO_REQUIRE_STUDENT_DOCUMENT=true" : "ok",
      ),
    );
    results.push(
      step(
        "reCAPTCHA configured for hosted staging",
        recaptchaConfigured && !recaptchaDisabled,
        recaptchaConfigured ? "keys present" : "set RECAPTCHA_* keys or review auth-production.md",
      ),
    );
  }

  if (siteUrl) {
    try {
      const callback = new URL("/auth/callback", siteUrl).toString();
      const webhook = new URL("/api/billing/webhook", siteUrl).toString();
      results.push(step("Auth callback URL", callback.includes("/auth/callback"), callback));
      results.push(step("Stripe webhook URL (paste in Stripe)", webhook.includes("/api/billing/webhook"), webhook));
    } catch (error) {
      results.push(
        step(
          "Auth callback URL",
          false,
          error instanceof Error ? error.message : "invalid NEXT_PUBLIC_SITE_URL",
        ),
      );
    }
  }

  const bundled = existsSync(join(root, "supabase", "zigo-full-migrations.sql"));
  results.push(step("Migration bundle", bundled, bundled ? "supabase/zigo-full-migrations.sql" : "run npm run migrations:bundle"));

  if (supabaseUrl && serviceRole) {
    const admin = createClient(supabaseUrl, serviceRole, {
      auth: { autoRefreshToken: false, persistSession: false },
    });

    try {
      const health = await fetch(`${supabaseUrl}/auth/v1/health`, {
        headers: { apikey: anon, Authorization: `Bearer ${anon}` },
      });
      results.push(step("Supabase API reachable", health.ok, `HTTP ${health.status}`));
    } catch (error) {
      results.push(
        step("Supabase API reachable", false, error instanceof Error ? error.message : "network error"),
      );
    }

    const subsProbe = await admin.from("user_subscriptions").select("current_period_end").limit(1);
    results.push(
      step(
        `Migration 032 schema (${EXPECTED_MIGRATION_032})`,
        !subsProbe.error,
        subsProbe.error?.message ?? "user_subscriptions.current_period_end ok",
      ),
    );

    const cheersProbe = await admin.from("study_moment_cheers").select("moment_id", { count: "exact", head: true });
    results.push(
      step(
        "Study moment cheers table",
        !cheersProbe.error,
        cheersProbe.error?.message ?? "study_moment_cheers ok",
      ),
    );

    const exportProbe = await admin.rpc("export_user_data");
    results.push(
      step(
        `Migration 033 compliance (${EXPECTED_MIGRATION_033})`,
        !exportProbe.error || exportProbe.error.message?.includes("not authorized"),
        exportProbe.error?.message?.includes("not authorized")
          ? "RPC exists (auth required)"
          : exportProbe.error?.message ?? "export_user_data ok",
      ),
    );

    const parentRedeemProbe = await admin.rpc("parent_update_store_redemption_status", {
      target_redemption_id: "00000000-0000-0000-0000-000000000000",
      next_status: "approved",
    });
    const parentRedeemOk =
      !parentRedeemProbe.error ||
      parentRedeemProbe.error.message?.includes("not authorized") ||
      parentRedeemProbe.error.message?.includes("only parent accounts") ||
      parentRedeemProbe.error.message?.includes("pending child redemption");
    results.push(
      step(
        `Migration 044 product scope (${EXPECTED_MIGRATION_044})`,
        parentRedeemOk,
        parentRedeemProbe.error?.message?.includes("not authorized") ||
          parentRedeemProbe.error?.message?.includes("only parent accounts") ||
          parentRedeemProbe.error?.message?.includes("pending child redemption")
          ? "parent_update_store_redemption_status ok"
          : parentRedeemProbe.error?.message ?? "parent_update_store_redemption_status ok",
      ),
    );

    const orgTypeProbe = await admin.from("users").select("organization_type").limit(1);
    results.push(
      step(
        "Migration 048 organization_type",
        !orgTypeProbe.error,
        orgTypeProbe.error?.message ?? "users.organization_type ok",
      ),
    );

    const orgInterestProbe = await admin.rpc("set_user_interests", { area_ids: [] });
    results.push(
      step(
        "Migration 049 registration org accounts",
        !orgInterestProbe.error || orgInterestProbe.error.message?.includes("authentication is required"),
        orgInterestProbe.error?.message?.includes("authentication is required")
          ? "set_user_interests org gate ok"
          : orgInterestProbe.error?.message ?? "ok",
      ),
    );
  }

  const migrationTarget = expectedMigrationTarget();
  if (siteUrl && !isLocalUrl(siteUrl) && migrationTarget !== null) {
    try {
      const healthRes = await fetch(`${siteUrl}/api/setup/health`, { signal: AbortSignal.timeout(10000) });
      const healthBody = healthRes.ok ? await healthRes.json() : null;
      const reported = healthBody?.data?.migrationTarget;
      results.push(
        step(
          "Hosted app health migration target",
          healthRes.ok && reported === migrationTarget,
          healthRes.ok ? `migrationTarget=${reported} (expected ${migrationTarget})` : `HTTP ${healthRes.status}`,
        ),
      );
    } catch (error) {
      results.push(
        step(
          "Hosted app health migration target",
          false,
          error instanceof Error ? error.message : "health fetch failed",
        ),
      );
    }
  }

  console.log("\n--- Repository gates ---");
  const repoOk = runNpmScript("test:repo");
  results.push(step("npm run test:repo", repoOk));

  if (!skipBuild) {
    console.log("\n--- Production build ---");
    const buildOk = runNpmScript("build:safe");
    results.push(step("npm run build:safe", buildOk));
  }

  const failed = results.filter((item) => !item.ok);
  console.log(`\nStaging preflight: ${results.length - failed.length}/${results.length} checks passed`);

  if (failed.length === 0) {
    console.log("\nNext steps:");
    console.log("1. Supabase Dashboard → SQL → run supabase/zigo-full-migrations.sql if not applied");
    console.log("2. Supabase Auth → add redirect URLs from /setup Hosted deploy");
    console.log("3. Vercel → set env vars from .env.production.example (incl. all STRIPE_PRICE_* keys)");
    console.log("4. npm run migrations:pending (cloud SUPABASE_DB_URL) if organization_type missing");
    console.log("4. Stripe → webhook endpoint = <SITE_URL>/api/billing/webhook");
    console.log("5. vercel deploy --prod  OR  push to main with Vercel Git integration");
    console.log("6. npm run test:live against hosted env + manual QA checklist");
  }

  process.exit(failed.length > 0 ? 1 : 0);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
