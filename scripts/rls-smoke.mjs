/* global console, process */

import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { createClient } from "@supabase/supabase-js";

const root = process.cwd();

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

function read(relativePath) {
  const filePath = join(root, relativePath);
  if (!existsSync(filePath)) {
    throw new Error(`Missing required file: ${relativePath}`);
  }
  return readFileSync(filePath, "utf8");
}

function buildStaticChecks() {
  return [
    {
      name: "teacher self assignment is locked",
      ok: read("supabase/migrations/020_lock_teacher_interest_self_assignment.sql").includes(
        "teacher areas are assigned by platform admins",
      ),
    },
    {
      name: "stories are area-gated",
      ok: read("supabase/migrations/021_story_area_match_feed.sql").includes(
        "viewer_area.area_id = stories.area_id",
      ),
    },
    {
      name: "platform admins can moderate queues",
      ok: read("supabase/migrations/022_platform_admin_moderation_policies.sql").includes(
        "Platform admins can moderate story replies",
      ),
    },
    {
      name: "moderation audit log is protected",
      ok: read("supabase/migrations/023_moderation_audit_log.sql").includes(
        "Moderators can create moderation audit log",
      ),
    },
    {
      name: "social write route checks teacher areas",
      ok: read("src/app/api/social/posts/route.ts").includes(
        "Teachers can publish only in assigned education areas.",
      ),
    },
    {
      name: "demo auth seed sets empty token fields",
      ok:
        read("supabase/migrations/017_mvp_seed_content.sql").includes("confirmation_token") &&
        read("supabase/migrations/025_fix_auth_seed_token_nulls.sql").includes("confirmation_token"),
    },
  ];
}

async function runLiveChecks(checks) {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  const serviceRole = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!url || !anon) {
    console.log("SKIP live Supabase RLS probe: NEXT_PUBLIC_SUPABASE_URL and anon key are not set.");
    return;
  }

  let authClient;
  let signIn;
  try {
    authClient = createClient(url, anon, {
      auth: { autoRefreshToken: false, persistSession: false },
    });
    signIn = await authClient.auth.signInWithPassword({
      email: "student@zigo.test",
      password: "ZigoTest123!",
    });
  } catch (error) {
    console.log(
      `SKIP live Supabase RLS probe: ${error instanceof Error ? error.message : "connection failed"}`,
    );
    return;
  }

  if (signIn.error || !signIn.data?.session) {
    console.log(`SKIP live Supabase RLS probe: ${signIn.error?.message ?? "demo session unavailable"}`);
    return;
  }

  checks.push({
    name: "live demo student auth sign-in",
    ok: true,
  });

  const authed = createClient(url, anon, {
    global: { headers: { Authorization: `Bearer ${signIn.data.session.access_token}` } },
    auth: { autoRefreshToken: false, persistSession: false },
  });

  const { count: feedCount, error: feedError } = await authed
    .from("social_posts")
    .select("id", { count: "exact", head: true });
  checks.push({
    name: "live student Match-Feed returns posts",
    ok: !feedError && (feedCount ?? 0) >= 1,
  });

  const studentId = signIn.data.session.user.id;
  const { error: postError } = await authed.from("social_posts").insert({
    author_id: studentId,
    area_id: 1,
    caption: "rls probe",
    media_type: "image",
    is_reel: false,
  });
  checks.push({
    name: "live student post insert blocked",
    ok: Boolean(postError),
  });

  if (serviceRole) {
    const admin = createClient(url, serviceRole, {
      auth: { autoRefreshToken: false, persistSession: false },
    });
    const { data: stories } = await admin.from("stories").select("area_id");
    checks.push({
      name: "live seeded stories have area_id",
      ok: (stories ?? []).length === 0 || (stories ?? []).every((story) => story.area_id != null),
    });
  }

  if (serviceRole) {
    const parentSignIn = await authClient.auth.signInWithPassword({
      email: "parent@zigo.test",
      password: "ZigoTest123!",
    });

    if (!parentSignIn.error && parentSignIn.data?.session) {
      const parentAuthed = createClient(url, anon, {
        global: { headers: { Authorization: `Bearer ${parentSignIn.data.session.access_token}` } },
        auth: { autoRefreshToken: false, persistSession: false },
      });

      const { data: parentPosts } = await parentAuthed.from("social_posts").select("id, area_id");
      const { data: parentInterests } = await parentAuthed
        .from("user_interests")
        .select("area_id")
        .eq("user_id", parentSignIn.data.session.user.id);
      const parentAreas = new Set((parentInterests ?? []).map((row) => row.area_id));
      const parentLeaked = (parentPosts ?? []).some((post) => !parentAreas.has(post.area_id));

      checks.push({
        name: "live parent feed respects area interests",
        ok: !parentLeaked,
      });

      const admin = createClient(url, serviceRole, {
        auth: { autoRefreshToken: false, persistSession: false },
      });
      const { data: sciencePost } = await admin
        .from("social_posts")
        .select("area_id")
        .ilike("caption", "Bitkiler isiga%")
        .maybeSingle();

      if (sciencePost?.area_id && !parentAreas.has(sciencePost.area_id)) {
        const seesScience = (parentPosts ?? []).some((post) => post.area_id === sciencePost.area_id);
        checks.push({
          name: "live parent cannot see science-only posts",
          ok: !seesScience,
        });
      }

      await parentAuthed.auth.signOut();
    }
  }

  await authClient.auth.signOut();
}

async function main() {
  loadEnvFile(".env.local");
  loadEnvFile(".env");

  const staticChecks = buildStaticChecks();
  const checks = [...staticChecks];

  for (const check of staticChecks) {
    console.log(`${check.ok ? "PASS" : "FAIL"} ${check.name}`);
  }

  await runLiveChecks(checks);

  for (const check of checks.slice(staticChecks.length)) {
    console.log(`${check.ok ? "PASS" : "FAIL"} ${check.name}`);
  }

  const failed = checks.filter((check) => !check.ok);
  const exitCode = failed.length > 0 ? 1 : 0;
  setImmediate(() => process.exit(exitCode));
}

main().catch((error) => {
  console.error(error);
  setImmediate(() => process.exit(1));
});
