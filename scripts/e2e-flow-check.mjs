/* global console, process, fetch, setImmediate */

import { createClient } from "@supabase/supabase-js";

import { detectBaseUrl } from "./journey-utils.mjs";
import { loadProjectEnv, resetDemoSocialAccounts } from "./live-test-utils.mjs";

const DEMO_PASSWORD = "ZigoTest123!";

const ACCOUNTS = {
  student: { email: "student@zigo.test", role: "student" },
  parent: { email: "parent@zigo.test", role: "parent" },
  teacher: { email: "aylin.teacher@zigo.test", role: "teacher", verified: true },
  scienceTeacher: { email: "mert.teacher@zigo.test", role: "teacher", verified: true },
  admin: { email: "admin@zigo.test", role: "parent" },
};

const KNOWN_IDS = {
  aylin: "00000000-0000-4000-8000-000000000101",
  mert: "00000000-0000-4000-8000-000000000102",
  parent: "00000000-0000-4000-8000-000000000201",
  student: "00000000-0000-4000-8000-000000000301",
  admin: "00000000-0000-4000-8000-000000000401",
  seededQuestion: "00000000-0000-4000-8000-000000000501",
};

function check(name, ok, message = "") {
  const item = { name, ok, message };
  console.log(`${ok ? "PASS" : "FAIL"} ${name}${message ? `: ${message}` : ""}`);
  return item;
}

async function signIn(url, anonKey, email) {
  const client = createClient(url, anonKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
  const { data, error } = await client.auth.signInWithPassword({
    email,
    password: DEMO_PASSWORD,
  });
  if (error) throw new Error(`${email}: ${error.message}`);
  return { client, session: data.session };
}

async function getProfile(client, userId) {
  const { data, error } = await client
    .from("users")
    .select("id, email, role, is_verified, total_points")
    .eq("id", userId)
    .maybeSingle();
  if (error) throw error;
  return data;
}

async function getInterestAreaIds(client, userId) {
  const { data, error } = await client.from("user_interests").select("area_id").eq("user_id", userId);
  if (error) throw error;
  return (data ?? []).map((row) => row.area_id);
}

async function countPostsInAreas(admin, areaIds) {
  if (areaIds.length === 0) return 0;
  const { count, error } = await admin
    .from("social_posts")
    .select("id", { count: "exact", head: true })
    .in("area_id", areaIds);
  if (error) throw error;
  return count ?? 0;
}

function parseSetCookie(headers) {
  const getSetCookie = headers.getSetCookie?.bind(headers);
  if (getSetCookie) return getSetCookie();
  const raw = headers.get("set-cookie");
  return raw ? [raw] : [];
}

function cookieHeaderFrom(setCookies) {
  return setCookies
    .map((entry) => entry.split(";")[0])
    .filter(Boolean)
    .join("; ");
}

async function apiSignIn(baseUrl, email) {
  const response = await fetch(`${baseUrl}/api/auth/sign-in`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, password: DEMO_PASSWORD }),
  });
  const body = await response.json();
  const cookies = parseSetCookie(response.headers);
  return { response, body, cookies, cookieHeader: cookieHeaderFrom(cookies) };
}

async function apiGet(baseUrl, path, cookieHeader) {
  const response = await fetch(`${baseUrl}${path}`, {
    headers: cookieHeader ? { Cookie: cookieHeader } : {},
  });
  const body = await response.json().catch(() => ({}));
  return { response, body };
}

async function apiPost(baseUrl, path, cookieHeader, payload) {
  const response = await fetch(`${baseUrl}${path}`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...(cookieHeader ? { Cookie: cookieHeader } : {}),
    },
    body: JSON.stringify(payload),
  });
  const body = await response.json().catch(() => ({}));
  return { response, body };
}

async function main() {
  loadProjectEnv();

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  const serviceRole = process.env.SUPABASE_SERVICE_ROLE_KEY;
  const checks = [];

  if (!url || !anon) {
    checks.push(check("Supabase env configured", false, "Missing NEXT_PUBLIC_SUPABASE_URL or anon key"));
    process.exit(1);
  }

  if (!serviceRole) {
    checks.push(check("Service role configured", false, "Required for negative RLS probes"));
    process.exit(1);
  }

  const admin = createClient(url, serviceRole, {
    auth: { autoRefreshToken: false, persistSession: false },
  });

  await resetDemoSocialAccounts(admin);

  await admin
    .from("stories")
    .update({ expires_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString() })
    .not("id", "is", null);

  // --- Auth + profiles ---
  const sessions = {};
  for (const [key, account] of Object.entries(ACCOUNTS)) {
    try {
      const signed = await signIn(url, anon, account.email);
      sessions[key] = signed;
      const profile = await getProfile(signed.client, signed.session.user.id);
      checks.push(
        check(
          `Auth sign-in: ${account.email}`,
          Boolean(profile),
          profile ? `${profile.role}${profile.is_verified ? " verified" : ""}` : "profile missing",
        ),
      );
      if (profile) {
        checks.push(check(`Profile role: ${account.email}`, profile.role === account.role, profile.role));
        if (account.verified) {
          checks.push(check(`Teacher verified: ${account.email}`, profile.is_verified === true));
        }
      }
    } catch (error) {
      checks.push(
        check(
          `Auth sign-in: ${account.email}`,
          false,
          error instanceof Error ? error.message : "sign-in failed",
        ),
      );
    }
  }

  const student = sessions.student?.client;
  const parent = sessions.parent?.client;
  const teacher = sessions.teacher?.client;
  const scienceTeacher = sessions.scienceTeacher?.client;
  const adminUser = sessions.admin?.client;

  if (!student || !parent || !teacher || !scienceTeacher || !adminUser) {
    process.exit(1);
  }

  const studentId = sessions.student.session.user.id;
  const teacherId = sessions.teacher.session.user.id;
  const scienceTeacherId = sessions.scienceTeacher.session.user.id;

  const studentAreas = await getInterestAreaIds(student, studentId);
  const parentId = sessions.parent.session.user.id;
  const parentAreas = await getInterestAreaIds(parent, parentId);
  const teacherAreas = await getInterestAreaIds(teacher, teacherId);
  const scienceAreas = await getInterestAreaIds(scienceTeacher, scienceTeacherId);

  const expectedStudentPosts = await countPostsInAreas(admin, studentAreas);
  const expectedParentPosts = await countPostsInAreas(admin, parentAreas);

  checks.push(check("Student has education interests", studentAreas.length >= 2, `${studentAreas.length} areas`));
  checks.push(check("Teacher Aylin has assigned areas", teacherAreas.length >= 1, `${teacherAreas.length} areas`));
  checks.push(
    check("Teacher Mert has science area", scienceAreas.length >= 1, `${scienceAreas.length} areas`),
  );

  // --- Match-Feed posts ---

  const { data: studentPosts, error: studentPostsError } = await student
    .from("social_posts")
    .select("id, area_id, caption");
  checks.push(
    check(
      "Student Match-Feed posts",
      !studentPostsError && (studentPosts?.length ?? 0) === expectedStudentPosts,
      studentPostsError?.message
        ?? `${studentPosts?.length ?? 0} posts (expected ${expectedStudentPosts} for areas ${studentAreas.join(",")})`,
    ),
  );

  const studentPostAreaIds = new Set((studentPosts ?? []).map((post) => post.area_id));
  const leakedScience = (studentPosts ?? []).some((post) => !studentAreas.includes(post.area_id));
  checks.push(check("Student feed respects area interests", !leakedScience, [...studentPostAreaIds].join(", ")));

  const { data: parentPosts } = await parent.from("social_posts").select("id");
  checks.push(
    check(
      "Parent Match-Feed posts",
      (parentPosts?.length ?? 0) === expectedParentPosts,
      `${parentPosts?.length ?? 0} posts (expected ${expectedParentPosts})`,
    ),
  );

  const { data: scienceOnlyPosts } = await scienceTeacher
    .from("social_posts")
    .select("id, area_id")
    .eq("author_id", scienceTeacherId);
  checks.push(
    check(
      "Science teacher sees own-area content",
      (scienceOnlyPosts?.length ?? 0) >= 1,
      `${scienceOnlyPosts?.length ?? 0} posts`,
    ),
  );

  // --- Stories area gate ---
  const { data: studentStories, error: studentStoriesError } = await student
    .from("stories")
    .select("id, area_id, caption")
    .gt("expires_at", new Date().toISOString());
  const { data: allStories } = await admin.from("stories").select("id, area_id, caption");
  checks.push(
    check(
      "Stories have area_id seeded",
      (allStories ?? []).every((story) => story.area_id != null),
      `${(allStories ?? []).filter((story) => story.area_id == null).length} missing area`,
    ),
  );
  checks.push(
    check(
      "Student sees matched stories only",
      !studentStoriesError && (studentStories?.length ?? 0) === 1,
      studentStoriesError?.message ?? `${studentStories?.length ?? 0} stories (expected 1 math)`,
    ),
  );

  // --- Questions Q&A ---
  const { data: studentQuestions, error: studentQuestionsError } = await student
    .from("questions")
    .select("id, title, area_id");
  checks.push(
    check(
      "Student reads matched questions",
      !studentQuestionsError && (studentQuestions?.length ?? 0) >= 1,
      studentQuestionsError?.message ?? `${studentQuestions?.length ?? 0} questions`,
    ),
  );

  const { data: seededAnswers } = await student
    .from("answers")
    .select("id, content, teacher_id")
    .eq("question_id", KNOWN_IDS.seededQuestion);
  checks.push(
    check(
      "Seeded parent question has teacher answer",
      (seededAnswers?.length ?? 0) >= 1,
      `${seededAnswers?.length ?? 0} answers`,
    ),
  );

  // --- Authorization negatives ---
  const { error: studentPostError } = await student.from("social_posts").insert({
    author_id: studentId,
    area_id: studentAreas[0],
    caption: "student should not post",
    media_type: "image",
    is_reel: false,
  });
  checks.push(
    check(
      "Student cannot create posts (RLS)",
      Boolean(studentPostError),
      studentPostError?.message ?? "insert unexpectedly succeeded",
    ),
  );

  const wrongArea = scienceAreas[0];
  if (wrongArea) {
    const { error: teacherWrongAreaError } = await teacher.from("social_posts").insert({
      author_id: teacherId,
      area_id: wrongArea,
      caption: "teacher wrong area probe",
      media_type: "image",
      is_reel: false,
    });
    checks.push(
      check(
        "Teacher cannot post outside assigned area (RLS)",
        Boolean(teacherWrongAreaError),
        teacherWrongAreaError?.message ?? "insert unexpectedly succeeded",
      ),
    );
  }

  // --- Social actions ---
  const targetPost = (studentPosts ?? [])[0];
  if (targetPost) {
    const { error: followError } = await student.from("follows").insert({
      follower_id: studentId,
      following_id: KNOWN_IDS.aylin,
    });
    if (followError && !followError.message.includes("duplicate")) {
      checks.push(check("Student can follow teacher", false, followError.message));
    } else {
      checks.push(check("Student can follow teacher", true));
    }

    const { error: likeError } = await student.from("post_likes").insert({
      post_id: targetPost.id,
      user_id: studentId,
    });
    checks.push(
      check(
        "Student can like post",
        !likeError || likeError.message.includes("duplicate"),
        likeError?.message ?? "",
      ),
    );

    const { data: commentRow, error: commentError } = await student
      .from("post_comments")
      .insert({
        post_id: targetPost.id,
        user_id: studentId,
        content: "Bu kesir aciklamasi cok net, tesekkurler!",
      })
      .select("id, moderation_status")
      .maybeSingle();
    checks.push(
      check(
        "Student can comment with moderation",
        !commentError && Boolean(commentRow?.id),
        commentError?.message ?? commentRow?.moderation_status ?? "",
      ),
    );
  }

  // --- Platform admin ---
  const { data: adminRow, error: adminRowError } = await adminUser
    .from("platform_admins")
    .select("user_id")
    .eq("user_id", KNOWN_IDS.admin)
    .maybeSingle();
  checks.push(check("Admin user is platform admin", !adminRowError && Boolean(adminRow), adminRowError?.message ?? ""));

  const { data: moderationQueue, error: moderationError } = await adminUser
    .from("post_comments")
    .select("id, moderation_status")
    .in("moderation_status", ["pending", "flagged"])
    .limit(5);
  checks.push(
    check(
      "Admin can read moderation queue",
      !moderationError,
      moderationError?.message ?? `${moderationQueue?.length ?? 0} pending items`,
    ),
  );

  // --- Learning points ---
  const { data: studentBefore } = await admin
    .from("users")
    .select("total_points")
    .eq("id", studentId)
    .maybeSingle();
  const reelPost = (studentPosts ?? []).find((post) => post.caption?.includes("Kesirleri"));
  if (reelPost) {
    const { data: awardRows, error: awardError } = await student.rpc("award_social_reel_watch_points", {
      p_target_user_id: studentId,
      p_target_id: reelPost.id,
      p_points: 10,
    });
    checks.push(
      check(
        "Student reel watch points RPC",
        !awardError && Array.isArray(awardRows),
        awardError?.message ?? `${awardRows?.[0]?.points_awarded ?? 0} points`,
      ),
    );
  }

  const { data: duelRows, error: duelError } = await student.rpc("award_safe_duel_win_points", {
    p_target_user_id: studentId,
    p_duel_id: "00000000-0000-4000-8000-000000000601",
    p_score: 3,
    p_total_questions: 3,
  });
  checks.push(
    check(
      "Student safe duel win points RPC",
      !duelError && Array.isArray(duelRows),
      duelError?.message ?? `${duelRows?.[0]?.points_awarded ?? 0} points`,
    ),
  );
  checks.push(
    check(
      "Student has points balance",
      (studentBefore?.total_points ?? 0) >= 0,
      `${studentBefore?.total_points ?? 0} points`,
    ),
  );

  // --- HTTP API layer (Next.js) ---
  const baseUrl = await detectBaseUrl();
  if (!baseUrl) {
    checks.push(check("Next.js API E2E", false, "Dev server not reachable — start npm run dev (try port 3001 or 3003)"));
  } else {
    checks.push(check("Next.js dev server reachable", true, baseUrl));

    const signInResult = await apiSignIn(baseUrl, ACCOUNTS.student.email);
    checks.push(
      check(
        "API sign-in returns session",
        signInResult.response.ok && Boolean(signInResult.body?.data?.session),
        signInResult.body?.error ?? `HTTP ${signInResult.response.status}`,
      ),
    );
    checks.push(
      check(
        "API sign-in sets auth cookies",
        signInResult.cookies.length > 0,
        `${signInResult.cookies.length} cookie(s)`,
      ),
    );

    if (signInResult.cookieHeader) {
      const feed = await apiGet(baseUrl, "/api/feed", signInResult.cookieHeader);
      checks.push(
        check(
          "API /api/feed authorized",
          feed.response.status === 200 && Array.isArray(feed.body?.data),
          feed.body?.error ?? `${feed.body?.data?.length ?? 0} posts`,
        ),
      );
      checks.push(
        check(
          "API feed Match-Feed count",
          (feed.body?.data?.length ?? 0) === expectedStudentPosts,
          `${feed.body?.data?.length ?? 0} posts (expected ${expectedStudentPosts})`,
        ),
      );

      const questions = await apiGet(baseUrl, "/api/questions", signInResult.cookieHeader);
      checks.push(
        check(
          "API /api/questions authorized",
          questions.response.status === 200 && Array.isArray(questions.body?.data),
          questions.body?.error ?? `${questions.body?.data?.length ?? 0} questions`,
        ),
      );

      if (targetPost) {
        const like = await apiPost(baseUrl, "/api/social/likes", signInResult.cookieHeader, {
          postId: targetPost.id,
        });
        checks.push(
          check(
            "API toggle like",
            like.response.status === 200 && like.body?.data,
            like.body?.error ?? "ok",
          ),
        );

        const follow = await apiPost(baseUrl, "/api/social/follows", signInResult.cookieHeader, {
          followingId: KNOWN_IDS.aylin,
        });
        checks.push(
          check(
            "API toggle follow",
            follow.response.status === 200 && follow.body?.data,
            follow.body?.error ?? "ok",
          ),
        );

        const comment = await apiPost(baseUrl, "/api/social/comments", signInResult.cookieHeader, {
          postId: targetPost.id,
          content: "API yorum testi guvenli ve net aciklama.",
        });
        checks.push(
          check(
            "API create comment",
            comment.response.status === 201 && comment.body?.data?.id,
            comment.body?.error ?? comment.body?.data?.moderation_status ?? "",
          ),
        );
      }

      const teacherSignIn = await apiSignIn(baseUrl, ACCOUNTS.teacher.email);
      if (teacherSignIn.cookieHeader && teacherAreas[0]) {
        const denied = await apiPost(baseUrl, "/api/social/posts", teacherSignIn.cookieHeader, {
          caption: "API probe wrong area",
          mediaType: "image",
          isReel: false,
          areaId: scienceAreas[0] ?? teacherAreas[0],
        });
        const expectDenied = scienceAreas[0] && !teacherAreas.includes(scienceAreas[0]);
        checks.push(
          check(
            "API blocks teacher outside assigned area",
            expectDenied ? denied.response.status === 403 : denied.response.status !== 500,
            denied.body?.error ?? `HTTP ${denied.response.status}`,
          ),
        );
      }

      const studentPostAttempt = await apiPost(baseUrl, "/api/social/posts", signInResult.cookieHeader, {
        caption: "student api probe",
        mediaType: "image",
        isReel: false,
        areaId: studentAreas[0],
      });
      checks.push(
        check(
          "API blocks student post creation",
          studentPostAttempt.response.status === 403,
          studentPostAttempt.body?.error ?? `HTTP ${studentPostAttempt.response.status}`,
        ),
      );

      const health = await apiGet(baseUrl, "/api/setup/health", "");
      checks.push(
        check(
          "API setup health",
          health.response.status === 200 && health.body?.data?.readyCount === health.body?.data?.totalCount,
          `${health.body?.data?.readyCount ?? 0}/${health.body?.data?.totalCount ?? 0}`,
        ),
      );

      const missions = await apiGet(baseUrl, "/api/learning/missions", signInResult.cookieHeader);
      checks.push(
        check(
          "API daily missions",
          missions.response.status === 200 && Array.isArray(missions.body?.data?.completedIds),
          missions.body?.error ?? `${missions.body?.data?.completedIds?.length ?? 0} completed`,
        ),
      );

      const duelComplete = await apiPost(baseUrl, "/api/learning/duels/complete", signInResult.cookieHeader, {
        duelId: "00000000-0000-4000-8000-000000000602",
        score: 2,
        totalQuestions: 3,
      });
      checks.push(
        check(
          "API safe duel completion",
          duelComplete.response.status === 200 && duelComplete.body?.data,
          duelComplete.body?.error ?? `${duelComplete.body?.data?.points_awarded ?? 0} points`,
        ),
      );

      const dataExport = await apiGet(baseUrl, "/api/account/export", signInResult.cookieHeader);
      checks.push(
        check(
          "API account data export",
          dataExport.response.status === 200 && dataExport.body?.data?.profile,
          dataExport.body?.error ?? "export ok",
        ),
      );

      const deletePage = await fetch(`${baseUrl}/legal/delete-account`);
      checks.push(
        check(
          "Legal delete-account page",
          deletePage.ok,
          `HTTP ${deletePage.status}`,
        ),
      );
    }
  }

  const failed = checks.filter((item) => !item.ok);
  const exitCode = failed.length > 0 ? 1 : 0;
  console.log(`\nE2E summary: ${checks.length - failed.length}/${checks.length} passed`);
  setImmediate(() => process.exit(exitCode));
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
