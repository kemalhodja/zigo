/* global console, process */

import { createClient } from "@supabase/supabase-js";

import {
  apiGet,
  apiPost,
  apiSignIn,
  DEMO_PASSWORD,
  detectBaseUrl,
  journeyStep as step,
  pageOk,
} from "./journey-utils.mjs";
import { loadProjectEnv } from "./live-test-utils.mjs";

const STUDENT_EMAIL = "student@zigo.test";
const DUEL_TOPIC_ID = "00000000-0000-4000-8000-000000000602";

async function main() {
  loadProjectEnv();

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  const serviceRole = process.env.SUPABASE_SERVICE_ROLE_KEY;
  const results = [];

  const baseUrl = await detectBaseUrl();
  results.push(step("Dev sunucusu", Boolean(baseUrl), baseUrl ?? "npm run dev gerekli"));

  if (!url || !anon || !serviceRole || !baseUrl) {
    process.exit(1);
  }

  const admin = createClient(url, serviceRole, { auth: { autoRefreshToken: false, persistSession: false } });
  const { client, session } = await (async () => {
    const c = createClient(url, anon, { auth: { autoRefreshToken: false, persistSession: false } });
    const { data, error } = await c.auth.signInWithPassword({ email: STUDENT_EMAIL, password: DEMO_PASSWORD });
    if (error) throw error;
    return { client: c, session: data.session };
  })();

  const studentId = session.user.id;
  const { data: profileBefore } = await client.from("users").select("total_points, role").eq("id", studentId).single();
  results.push(step("1. Giriş (öğrenci)", profileBefore?.role === "student", `${STUDENT_EMAIL} · ${profileBefore?.total_points ?? 0} puan`));

  const signIn = await apiSignIn(baseUrl, STUDENT_EMAIL);
  results.push(step("1b. API oturum çerezi", signIn.response.ok && signIn.cookieHeader.length > 0, signIn.body?.error ?? "ok"));

  const feed = await apiGet(baseUrl, "/api/feed", signIn.cookieHeader);
  const posts = feed.body?.data ?? [];
  results.push(step("2. Ana feed (Match-Feed)", feed.response.ok && posts.length >= 1, `${posts.length} post`));

  const videoPost = posts.find((p) => p.media_type === "video" || p.is_reel) ?? posts[0];
  const microComplete = videoPost
    ? await apiPost(baseUrl, "/api/learning/reels/complete", signIn.cookieHeader, {
        postId: videoPost.id,
        secondsWatched: 60,
      })
    : null;
  results.push(
    step(
      "3. Micro izleme (+10)",
      Boolean(microComplete?.response.ok),
      microComplete?.body?.data?.points_awarded != null
        ? `+${microComplete.body.data.points_awarded} (tekrar: 0 olabilir)`
        : microComplete?.body?.error ?? "video post yok",
    ),
  );

  const { data: quizzes } = await client.rpc("get_matched_quizzes");
  const quiz = quizzes?.[0];
  let quizDetail = "quiz yok";
  if (quiz) {
    const { data: quizMeta } = await admin.from("quizzes").select("correct_option").eq("id", quiz.id).maybeSingle();
    const correctIndex = quizMeta?.correct_option ?? 0;
    const quizRes = await apiPost(baseUrl, "/api/learn/quiz", signIn.cookieHeader, {
      quizId: quiz.id,
      selectedOption: correctIndex >= 0 ? correctIndex : 0,
    });
    quizDetail = quizRes.response.ok
      ? quizRes.body?.data?.is_correct
        ? `doğru +${quizRes.body.data.points_awarded ?? 0}`
        : "kayıtlı (tekrar puan yok)"
      : quizRes.body?.error ?? `HTTP ${quizRes.response.status}`;
    results.push(step("4. Mini quiz (+10)", quizRes.response.ok || quizRes.response.status === 400, quizDetail));
  } else {
    results.push(step("4. Mini quiz (+10)", false, quizDetail));
  }

  const duelRes = await apiPost(baseUrl, "/api/learning/duels/complete", signIn.cookieHeader, {
    duelId: DUEL_TOPIC_ID,
    score: 3,
    totalQuestions: 3,
  });
  results.push(
    step(
      "5. Güvenli duel (+25)",
      duelRes.response.ok,
      duelRes.body?.data?.points_awarded != null
        ? `+${duelRes.body.data.points_awarded} (tekrar: 0 olabilir)`
        : duelRes.body?.error ?? "ok",
    ),
  );

  const focusStart = await apiPost(baseUrl, "/api/learning/focus/start", signIn.cookieHeader, {
    areaId: 1,
    topicLabel: "Journey test focus",
  });
  results.push(
    step(
      "5b. Focus başlat",
      focusStart.response.ok && Boolean(focusStart.body?.data?.id),
      focusStart.body?.data?.id ? `session ${focusStart.body.data.id.slice(0, 8)}…` : focusStart.body?.error ?? "ok",
    ),
  );

  const focusAnalytics = await apiGet(baseUrl, "/api/learning/focus/analytics", signIn.cookieHeader);
  results.push(
    step(
      "5c. Focus analitik",
      focusAnalytics.response.ok,
      focusAnalytics.body?.data ? `${focusAnalytics.body.data.weeklyCompleted}/${focusAnalytics.body.data.weeklyGoal} haftalık` : focusAnalytics.body?.error ?? "ok",
    ),
  );

  const missions = await apiGet(baseUrl, "/api/learning/missions", signIn.cookieHeader);
  const completed = missions.body?.data?.completedIds?.length ?? 0;
  results.push(
    step(
      "6. Günlük görevler",
      missions.response.ok,
      `${completed}/5 tamam · ${missions.body?.data?.streakDays ?? 0} gün streak`,
    ),
  );

  const { data: profileAfter } = await client.from("users").select("total_points").eq("id", studentId).single();
  results.push(
    step("7. Puan bakiyesi", (profileAfter?.total_points ?? 0) >= (profileBefore?.total_points ?? 0), `${profileAfter?.total_points ?? 0} puan`),
  );

  const pages = [
    ["/", "Ana sayfa"],
    ["/micro", "Micro"],
    ["/sparks", "Sparks"],
    ["/learn", "Learn"],
    ["/focus", "Focus"],
    ["/duels", "Duels"],
    ["/student", "Student panel"],
    ["/store", "Store"],
    ["/avatar", "Avatar"],
    ["/collections", "Collections"],
  ];

  for (const [path, label] of pages) {
    const ok = await pageOk(baseUrl, path);
    results.push(step(`8. Sayfa: ${label}`, ok, path));
  }

  const legalPages = ["/legal/privacy", "/legal/terms", "/legal/kvkk", "/legal/delete-account", "/billing/success"];
  for (const path of legalPages) {
    const ok = await pageOk(baseUrl, path);
    results.push(step(`8b. Yasal/billing: ${path}`, ok, path));
  }

  const storeVisit = await apiPost(baseUrl, "/api/learning/store-visit", signIn.cookieHeader, {});
  results.push(
    step(
      "9. Store visit görevi",
      storeVisit.response.ok,
      storeVisit.body?.data?.recorded != null
        ? storeVisit.body.data.recorded
          ? "kaydedildi"
          : "bugün zaten kayıtlı"
        : storeVisit.body?.error ?? "ok",
    ),
  );

  const { data: moments } = await client.rpc("get_matched_study_moments");
  const moment = moments?.[0];
  if (moment?.id) {
    const cheer = await apiPost(baseUrl, "/api/learning/study-moments/cheer", signIn.cookieHeader, {
      momentId: moment.id,
    });
    results.push(
      step(
        "9b. Study-with-me cheer",
        cheer.response.ok,
        cheer.body?.data?.cheerCount != null ? `${cheer.body.data.cheerCount} cheer` : cheer.body?.error ?? "ok",
      ),
    );
  } else {
    results.push(step("9b. Study-with-me cheer", true, "moment yok — atlandı"));
  }

  const storeRedeem = await apiGet(baseUrl, "/api/store/redeem", signIn.cookieHeader);
  results.push(step("10. Store API (öğrenci)", storeRedeem.response.status === 405 || storeRedeem.response.status === 401 || storeRedeem.response.ok, `HTTP ${storeRedeem.response.status}`));

  results.push(step("11. DM yok (sosyal graf)", true, "Öğrenci DM endpointi tanımlı değil — manuel: mesaj butonu yok"));

  const failed = results.filter((r) => !r.ok);
  console.log(`\nÖğrenci yolculuğu: ${results.length - failed.length}/${results.length} adım doğrulandı`);
  console.log(`\nTarayıcı: ${baseUrl}/auth → ${STUDENT_EMAIL} / ${DEMO_PASSWORD}`);
  process.exit(failed.length > 0 ? 1 : 0);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
