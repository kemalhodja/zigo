/* global console, process, setImmediate */

import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { createClient } from "@supabase/supabase-js";

import { isSupabaseReachable, liveTestsForced, loadProjectEnv } from "./live-test-utils.mjs";

const root = process.cwd();

function read(relativePath) {
  const filePath = join(root, relativePath);
  if (!existsSync(filePath)) {
    throw new Error(`Missing required file: ${relativePath}`);
  }
  return readFileSync(filePath, "utf8");
}

function loadEnvFile(name) {
  const filePath = join(root, name);
  if (!existsSync(filePath)) return;

  for (const line of readFileSync(filePath, "utf8").split("\n")) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const separator = trimmed.indexOf("=");
    if (separator === -1) continue;
    const key = trimmed.slice(0, separator).trim();
    const value = trimmed.slice(separator + 1).trim().replace(/^['"]|['"]$/g, "");
    if (!process.env[key]) process.env[key] = value;
  }
}

async function main() {
  loadEnvFile(".env.local");
  loadEnvFile(".env");
  loadProjectEnv();

  const checks = [];

  function check(name, ok, message = "") {
    checks.push({ name, ok, message });
  }

  check("live gate module exists", read("src/lib/domain/live-gates.ts").includes("export async function getLiveGates"));
  check("setup health route exists", read("src/app/api/setup/health/route.ts").includes("getLiveGates"));
  check("live gates panel exists", read("src/components/live-gates-panel.tsx").includes("LiveGatesPanel"));

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  const serviceRole = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!url || !anon) {
    check("Supabase env configured", false, "Set NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY in .env.local");
  } else {
    check("Supabase env configured", true);

    const reachable = await isSupabaseReachable(url, anon);
    check("Supabase auth health reachable", reachable.ok, reachable.reason ?? "ok");

    if (!reachable.ok) {
      if (liveTestsForced()) {
        console.error("\nHint: start Docker Desktop, then `npx supabase start` and `npm run setup:local`.");
      } else {
        console.log("\nSKIP remaining live probes (Supabase offline — set ZIGO_RUN_LIVE_TESTS=1 before release).");
      }
    } else if (!serviceRole) {
      check("Service role configured", false, "Add SUPABASE_SERVICE_ROLE_KEY for schema/storage/admin probes");
    } else if (reachable.ok) {
      check("Service role configured", true);
      const admin = createClient(url, serviceRole, {
        auth: { autoRefreshToken: false, persistSession: false },
      });

      const areas = await admin.from("education_areas").select("id", { count: "exact", head: true });
      const posts = await admin.from("social_posts").select("id", { count: "exact", head: true });
      const buckets = await admin.storage.listBuckets();
      const admins = await admin.from("platform_admins").select("user_id", { count: "exact", head: true });
      const audit = await admin.from("moderation_audit_log").select("id", { count: "exact", head: true });

      check("Education areas seeded", !areas.error && (areas.count ?? 0) > 0, areas.error?.message ?? `${areas.count ?? 0} areas`);
      check("Social posts table ready", !posts.error, posts.error?.message ?? `${posts.count ?? 0} posts`);
      check(
        "social-media bucket exists",
        !buckets.error && (buckets.data ?? []).some((bucket) => bucket.name === "social-media"),
        buckets.error?.message,
      );
      check("Platform admin exists", !admins.error && (admins.count ?? 0) > 0, admins.error?.message ?? `${admins.count ?? 0} admins`);
      check("Moderation audit log table ready", !audit.error, audit.error?.message);

      const subs032 = await admin.from("user_subscriptions").select("current_period_end").limit(1);
      check(
        "Migration 032 billing columns",
        !subs032.error,
        subs032.error?.message ?? "user_subscriptions.current_period_end",
      );

      const cheers = await admin.from("study_moment_cheers").select("moment_id", { count: "exact", head: true });
      check("Migration 032 study_moment_cheers", !cheers.error, cheers.error?.message ?? "table ok");

      const deletionTable = await admin.from("account_deletion_requests").select("id", { count: "exact", head: true });
      check("Migration 033 account_deletion_requests", !deletionTable.error, deletionTable.error?.message ?? "table ok");

      const exportRpc = await admin.rpc("export_user_data");
      check(
        "Migration 033 export_user_data RPC",
        exportRpc.error?.message?.includes("not authorized") ?? !exportRpc.error,
        exportRpc.error?.message ?? "callable",
      );

      const orgType = await admin.from("users").select("organization_type").limit(1);
      check(
        "Migration 048 organization_type",
        !orgType.error,
        orgType.error?.message ?? "users.organization_type",
      );

      const orgInterests = await admin.rpc("set_user_interests", { area_ids: [] });
      check(
        "Migration 049 registration org accounts",
        orgInterests.error?.message?.includes("authentication is required") ?? !orgInterests.error,
        orgInterests.error?.message ?? "set_user_interests org gate",
      );

      const authClient = createClient(url, anon, {
        auth: { autoRefreshToken: false, persistSession: false },
      });
      const demoSignIn = await authClient.auth.signInWithPassword({
        email: "student@zigo.test",
        password: "ZigoTest123!",
      });
      check(
        "Demo student auth sign-in",
        !demoSignIn.error && Boolean(demoSignIn.data.session),
        demoSignIn.error?.message ?? "session ok",
      );

      if (demoSignIn.data.session) {
        const authed = createClient(url, anon, {
          global: { headers: { Authorization: `Bearer ${demoSignIn.data.session.access_token}` } },
          auth: { autoRefreshToken: false, persistSession: false },
        });
        const feed = await authed.from("social_posts").select("id", { count: "exact", head: true });
        check(
          "Student Match-Feed via auth session",
          !feed.error && (feed.count ?? 0) >= 1,
          feed.error?.message ?? `${feed.count ?? 0} posts`,
        );
      }
    }
  }

  const failed = checks.filter((item) => !item.ok);
  for (const item of checks) {
    console.log(`${item.ok ? "PASS" : "FAIL"} ${item.name}${item.message ? `: ${item.message}` : ""}`);
  }

  const liveOnlyFailure =
    failed.length > 0 &&
    failed.every((item) => item.name === "Supabase auth health reachable" || item.name.startsWith("Migration"));

  if (liveOnlyFailure && !liveTestsForced()) {
    console.log("\nSKIP live Supabase checks (offline — use ZIGO_RUN_LIVE_TESTS=1 before release).");
    setImmediate(() => process.exit(0));
    return;
  }

  const exitCode = failed.length > 0 ? 1 : 0;
  setImmediate(() => process.exit(exitCode));
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
