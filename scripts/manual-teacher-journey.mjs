/* global console, process */

import { createClient } from "@supabase/supabase-js";

import {
  apiPost,
  apiSignIn,
  detectBaseUrl,
  journeyStep,
  pageOk,
  printJourneySummary,
} from "./journey-utils.mjs";
import { loadProjectEnv } from "./live-test-utils.mjs";

const TEACHER_EMAIL = "aylin.teacher@zigo.test";

async function main() {
  loadProjectEnv();

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  const results = [];

  const baseUrl = await detectBaseUrl();
  results.push(journeyStep("Dev sunucusu", Boolean(baseUrl), baseUrl ?? "npm run dev gerekli"));
  if (!url || !anon || !baseUrl) process.exit(1);

  const signIn = await apiSignIn(baseUrl, TEACHER_EMAIL);
  results.push(journeyStep("1. Öğretmen girişi", signIn.response.ok, signIn.body?.error ?? "ok"));

  const devActivate = await apiPost(baseUrl, "/api/billing/dev-activate", signIn.cookieHeader, {
    planId: "teacher-monthly",
  });
  results.push(
    journeyStep(
      "1c. Creator Plus (local demo)",
      devActivate.response.ok || devActivate.response.status === 503,
      devActivate.body?.error ?? "ok",
    ),
  );

  const client = createClient(url, anon, { auth: { autoRefreshToken: false, persistSession: false } });
  const { data: authData, error: authError } = await client.auth.signInWithPassword({
    email: TEACHER_EMAIL,
    password: "ZigoTest123!",
  });
  results.push(journeyStep("1b. Supabase oturum", !authError && Boolean(authData.session), authError?.message ?? "ok"));

  const authed = createClient(url, anon, {
    global: { headers: { Authorization: `Bearer ${authData.session.access_token}` } },
    auth: { autoRefreshToken: false, persistSession: false },
  });

  const teacherId = authData.session.user.id;
  const { data: profile } = await authed.from("users").select("role, is_verified").eq("id", teacherId).single();
  results.push(
    journeyStep(
      "2. Doğrulanmış öğretmen",
      profile?.role === "teacher" && profile?.is_verified === true,
      `${profile?.role ?? "?"} verified=${profile?.is_verified ?? false}`,
    ),
  );

  const { data: areas } = await authed.from("user_interests").select("area_id").eq("user_id", teacherId);
  const areaId = areas?.[0]?.area_id;
  results.push(journeyStep("3. Atanan alan", Boolean(areaId), areaId ? `area ${areaId}` : "admin ataması gerekli"));

  if (areaId) {
    const post = await apiPost(baseUrl, "/api/social/posts", signIn.cookieHeader, {
      areaId,
      caption: "Matematik tekrar notu: kesirler konusu ozet.",
      mediaUrl: "",
      mediaType: "image",
      postType: "normal",
    });
    results.push(
      journeyStep(
        "4. Post oluştur (atandığı alan)",
        post.response.ok,
        post.body?.error ?? (post.response.ok ? "created" : `HTTP ${post.response.status}`),
      ),
    );

    const quiz = await apiPost(baseUrl, "/api/quizzes", signIn.cookieHeader, {
      areaId,
      title: `Journey quiz ${Date.now()}`,
      questionText: "What is the sum of two and two?",
      options: ["Three", "Four", "Five"],
      correctOption: 1,
      pointsReward: 10,
    });
    results.push(
      journeyStep(
        "5. Mini quiz oluştur",
        quiz.response.ok,
        quiz.body?.error ?? (quiz.response.ok ? "created" : `HTTP ${quiz.response.status}`),
      ),
    );
  } else {
    results.push(journeyStep("4. Post oluştur", false, "alan yok"));
    results.push(journeyStep("5. Mini quiz oluştur", false, "alan yok"));
  }

  results.push(journeyStep("6. Sayfa: /teacher", await pageOk(baseUrl, "/teacher"), "/teacher"));

  const failedCount = printJourneySummary("Öğretmen yolculuğu", results);
  console.log(`\nTarayıcı: ${baseUrl}/auth → ${TEACHER_EMAIL} / ZigoTest123!`);
  process.exit(failedCount > 0 ? 1 : 0);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
