/* global console, process */

import { createClient } from "@supabase/supabase-js";

import {
  DEMO_PASSWORD,
  getSupabaseEnv,
  loadProjectEnv,
  requireLivePreflight,
  resetDemoSocialAccounts,
} from "./live-test-utils.mjs";

const ACCOUNTS = {
  student: { email: "student@zigo.test", role: "student", canPost: false, canAsk: true },
  parent: { email: "parent@zigo.test", role: "parent", canPost: false, canAsk: true },
  teacher: { email: "aylin.teacher@zigo.test", role: "teacher", canPost: true, canAsk: false },
};

const DEMO_CHILD_PROFILE_ID = "00000000-0000-4000-8000-000000000701";
const MERT_TEACHER_ID = "00000000-0000-4000-8000-000000000102";
const PARENT_USER_ID = "00000000-0000-4000-8000-000000000201";

async function signIn(url, anon, email) {
  const client = createClient(url, anon, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
  const { data, error } = await client.auth.signInWithPassword({
    email,
    password: DEMO_PASSWORD,
  });
  if (error) throw error;
  const authed = createClient(url, anon, {
    global: { headers: { Authorization: `Bearer ${data.session.access_token}` } },
    auth: { autoRefreshToken: false, persistSession: false },
  });
  return { client: authed, userId: data.session.user.id };
}

async function getInterestAreaIds(client, userId) {
  const { data, error } = await client.from("user_interests").select("area_id").eq("user_id", userId);
  if (error) throw error;
  return (data ?? []).map((row) => row.area_id);
}

function cell(role, action, ok, detail = "") {
  const label = `${role.padEnd(7)} · ${action}`;
  console.log(`${ok ? "PASS" : "FAIL"} ${label}${detail ? `: ${detail}` : ""}`);
  return { role, action, ok, detail };
}

async function main() {
  const ready = await requireLivePreflight("cross-role matrix");
  if (!ready) {
    setImmediate(() => process.exit(0));
    return;
  }

  loadProjectEnv();
  const { url, anon, serviceRole } = getSupabaseEnv();
  const results = [];

  const admin = serviceRole
    ? createClient(url, serviceRole, { auth: { autoRefreshToken: false, persistSession: false } })
    : null;

  if (admin) {
    await resetDemoSocialAccounts(admin);
  }

  let scienceAreaId = null;
  if (admin) {
    const { data: sciencePost } = await admin
      .from("social_posts")
      .select("area_id")
      .ilike("caption", "Bitkiler isiga%")
      .maybeSingle();
    scienceAreaId = sciencePost?.area_id ?? null;
  }

  for (const [roleKey, account] of Object.entries(ACCOUNTS)) {
    let session;
    try {
      session = await signIn(url, anon, account.email);
    } catch (error) {
      results.push(cell(roleKey, "sign-in", false, error instanceof Error ? error.message : "failed"));
      continue;
    }

    const areas = await getInterestAreaIds(session.client, session.userId);

    const { data: posts, error: postsError } = await session.client
      .from("social_posts")
      .select("id, area_id");
    const feedOk = !postsError && (posts?.length ?? 0) >= 1;
    results.push(
      cell(roleKey, "feed_read", feedOk, postsError?.message ?? `${posts?.length ?? 0} posts`),
    );

    const leaked = (posts ?? []).some((post) => !areas.includes(post.area_id));
    results.push(
      cell(roleKey, "feed_no_leak", !leaked, leaked ? "foreign area visible" : `${areas.length} interest areas`),
    );

    if (scienceAreaId && !areas.includes(scienceAreaId)) {
      const seesScience = (posts ?? []).some((post) => post.area_id === scienceAreaId);
      results.push(
        cell(roleKey, "feed_science_blocked", !seesScience, seesScience ? "science leak" : "science hidden"),
      );
    }

    const postArea = areas[0] ?? 1;
    const { error: postError } = await session.client.from("social_posts").insert({
      author_id: session.userId,
      area_id: postArea,
      caption: `${roleKey} matrix probe`,
      media_type: "image",
      is_reel: false,
    });
    const postDenied = Boolean(postError);
    results.push(
      cell(
        roleKey,
        "post_create",
        account.canPost ? !postDenied : postDenied,
        postError?.message ?? (account.canPost ? "insert ok" : "blocked"),
      ),
    );

    const { data: questions, error: questionsError } = await session.client
      .from("questions")
      .select("id, area_id");
    results.push(
      cell(
        roleKey,
        "question_read",
        !questionsError,
        questionsError?.message ?? `${questions?.length ?? 0} questions`,
      ),
    );

    const { error: askError } = await session.client.from("questions").insert({
      author_id: session.userId,
      area_id: postArea,
      title: `${roleKey} matrix question`,
      description: "Automated cross-role matrix probe.",
      is_resolved: false,
    });
    const askOk = account.canAsk ? !askError : Boolean(askError);
    results.push(
      cell(
        roleKey,
        "question_create",
        askOk,
        askError?.message ?? (account.canAsk ? "created" : "blocked"),
      ),
    );
  }

  try {
    const teacherSession = await signIn(url, anon, ACCOUNTS.teacher.email);
    const teacherAreas = await getInterestAreaIds(teacherSession.client, teacherSession.userId);

    if (admin) {
      const { data: mertAreas } = await admin
        .from("user_interests")
        .select("area_id")
        .eq("user_id", MERT_TEACHER_ID);
      const foreignArea = (mertAreas ?? [])
        .map((row) => row.area_id)
        .find((areaId) => !teacherAreas.includes(areaId));

      if (foreignArea) {
        const { error: wrongAreaError } = await teacherSession.client.from("social_posts").insert({
          author_id: teacherSession.userId,
          area_id: foreignArea,
          caption: "teacher wrong area matrix probe",
          media_type: "image",
          is_reel: false,
        });
        results.push(
          cell(
            "teacher",
            "post_wrong_area",
            Boolean(wrongAreaError),
            wrongAreaError?.message ?? "insert leaked",
          ),
        );
      }
    }

    const parentSession = await signIn(url, anon, ACCOUNTS.parent.email);
    const { error: parentChildReadError } = await parentSession.client
      .from("child_activity_events")
      .select("id")
      .eq("child_profile_id", DEMO_CHILD_PROFILE_ID)
      .limit(1);
    results.push(
      cell(
        "parent",
        "child_activity_scope",
        !parentChildReadError,
        parentChildReadError?.message ?? "read ok",
      ),
    );

    const studentSession = await signIn(url, anon, ACCOUNTS.student.email);
    const { data: studentChildRows, error: studentChildError } = await studentSession.client
      .from("child_activity_events")
      .select("id")
      .eq("child_profile_id", DEMO_CHILD_PROFILE_ID);
    results.push(
      cell(
        "student",
        "child_activity_blocked",
        !studentChildError && (studentChildRows ?? []).length === 0,
        studentChildError?.message ?? `${studentChildRows?.length ?? 0} rows`,
      ),
    );

    const { data: hijackRows, error: hijackError } = await studentSession.client
      .from("users")
      .update({ full_name: "RLS probe hijack" })
      .eq("id", PARENT_USER_ID)
      .select("id");
    results.push(
      cell(
        "student",
        "profile_update_blocked",
        Boolean(hijackError) || (hijackRows ?? []).length === 0,
        hijackError?.message ?? `${hijackRows?.length ?? 0} rows updated`,
      ),
    );
  } catch (error) {
    results.push(
      cell(
        "matrix",
        "negative_probes",
        false,
        error instanceof Error ? error.message : "negative probe setup failed",
      ),
    );
  }

  if (admin) {
    await admin.from("social_posts").delete().ilike("caption", "% matrix probe");
    await admin.from("social_posts").delete().ilike("caption", "% wrong area matrix probe");
    await admin.from("questions").delete().ilike("title", "% matrix question");
  }

  const failed = results.filter((row) => !row.ok);
  console.log(`\nCross-role matrix: ${results.length - failed.length}/${results.length} passed`);
  setImmediate(() => process.exit(failed.length > 0 ? 1 : 0));
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
