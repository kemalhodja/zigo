/* global console, process */

import { createClient } from "@supabase/supabase-js";

import {
  apiGet,
  apiPost,
  apiSignIn,
  detectBaseUrl,
  journeyStep,
  pageOk,
  printJourneySummary,
} from "./journey-utils.mjs";
import { loadProjectEnv } from "./live-test-utils.mjs";

const PARENT_EMAIL = "parent@zigo.test";

async function main() {
  loadProjectEnv();

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  const results = [];

  const baseUrl = await detectBaseUrl();
  results.push(journeyStep("Dev sunucusu", Boolean(baseUrl), baseUrl ?? "npm run dev gerekli"));
  if (!url || !anon || !baseUrl) process.exit(1);

  const signIn = await apiSignIn(baseUrl, PARENT_EMAIL);
  results.push(journeyStep("1. Veli girişi", signIn.response.ok, signIn.body?.error ?? "ok"));

  const client = createClient(url, anon, { auth: { autoRefreshToken: false, persistSession: false } });
  const { data: authData, error: authError } = await client.auth.signInWithPassword({
    email: PARENT_EMAIL,
    password: "ZigoTest123!",
  });
  results.push(journeyStep("1b. Supabase oturum", !authError && Boolean(authData.session), authError?.message ?? "ok"));

  const authed = createClient(url, anon, {
    global: { headers: { Authorization: `Bearer ${authData.session.access_token}` } },
    auth: { autoRefreshToken: false, persistSession: false },
  });

  const profile = await authed.from("users").select("role").eq("id", authData.session.user.id).single();
  results.push(journeyStep("2. Veli rolü", profile.data?.role === "parent", profile.data?.role ?? "unknown"));

  let children = await apiGet(baseUrl, "/api/children", signIn.cookieHeader);
  let child = children.body?.data?.[0];

  if (!child) {
    const created = await apiPost(baseUrl, "/api/children", signIn.cookieHeader, {
      displayName: "Journey Child",
      ageGroup: "8-10",
    });
    child = created.body?.data;
    results.push(
      journeyStep("3. Çocuk profili oluştur", created.response.ok && Boolean(child?.id), child?.display_name ?? created.body?.error ?? "ok"),
    );
  } else {
    results.push(journeyStep("3. Çocuk profili", true, child.display_name));
  }

  const stats = await authed.rpc("get_parent_children_focus_stats");
  results.push(
    journeyStep(
      "4. Çocuk focus istatistikleri",
      !stats.error,
      stats.error?.message ?? `${stats.data?.length ?? 0} çocuk`,
    ),
  );

  const overview = await authed.rpc("get_parent_focus_overview");
  results.push(journeyStep("5. Veli focus pulse", !overview.error, overview.error?.message ?? "ok"));

  if (child?.id) {
    const childFocus = await apiPost(baseUrl, "/api/learning/focus/start", signIn.cookieHeader, {
      childProfileId: child.id,
      topicLabel: "Parent supervised focus QA",
    });
    results.push(
      journeyStep(
        "6. Denetimli çocuk focus başlat",
        childFocus.response.ok && Boolean(childFocus.body?.data?.id),
        childFocus.body?.error ?? childFocus.body?.data?.id?.slice(0, 8) ?? "ok",
      ),
    );
  } else {
    results.push(journeyStep("6. Denetimli çocuk focus başlat", false, "çocuk profili yok"));
  }

  for (const path of ["/parent", "/family"]) {
    results.push(journeyStep(`7. Sayfa: ${path}`, await pageOk(baseUrl, path), path));
  }

  const devActivate = await apiPost(baseUrl, "/api/billing/dev-activate", signIn.cookieHeader, {});
  results.push(
    journeyStep(
      "8. Zigo Plus demo (local)",
      devActivate.response.ok || devActivate.response.status === 403,
      devActivate.response.status === 403 ? "bypass kapalı (staging normal)" : devActivate.body?.error ?? "ok",
    ),
  );

  const dataExport = await apiGet(baseUrl, "/api/account/export", signIn.cookieHeader);
  results.push(
    journeyStep(
      "9. KVKK veri export",
      dataExport.response.status === 200 && Boolean(dataExport.body?.data?.profile),
      dataExport.body?.error ?? "export ok",
    ),
  );

  results.push(journeyStep("10. Sayfa: /legal/delete-account", await pageOk(baseUrl, "/legal/delete-account"), "/legal/delete-account"));

  const failedCount = printJourneySummary("Veli yolculuğu", results);
  console.log(`\nTarayıcı: ${baseUrl}/auth → ${PARENT_EMAIL} / ZigoTest123!`);
  process.exit(failedCount > 0 ? 1 : 0);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
