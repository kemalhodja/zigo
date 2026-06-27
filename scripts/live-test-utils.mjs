/* global process, fetch */

import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";

export const DEMO_PASSWORD = "ZigoTest123!";

export function liveTestsForced() {
  return process.env.ZIGO_RUN_LIVE_TESTS === "1";
}

export function loadProjectEnv() {
  for (const name of [
    ".env.vercel.production.local",
    ".env.production.local",
    ".env.local",
    ".env",
  ]) {
    const filePath = join(process.cwd(), name);
    if (!existsSync(filePath)) continue;
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
}

export function getSupabaseEnv() {
  return {
    url: process.env.NEXT_PUBLIC_SUPABASE_URL,
    anon: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    serviceRole: process.env.SUPABASE_SERVICE_ROLE_KEY,
  };
}

export async function isSupabaseReachable(url, anon) {
  if (!url || !anon) return { ok: false, reason: "NEXT_PUBLIC_SUPABASE_URL or anon key missing" };
  try {
    const response = await fetch(`${url}/auth/v1/health`, {
      headers: { apikey: anon, Authorization: `Bearer ${anon}` },
      signal: AbortSignal.timeout(8000),
    });
    if (!response.ok) return { ok: false, reason: `auth health HTTP ${response.status}` };
    return { ok: true };
  } catch (error) {
    return {
      ok: false,
      reason: error instanceof Error ? error.message : "network error",
    };
  }
}

export async function detectAppBaseUrl() {
  const forced = process.env.E2E_BASE_URL?.replace(/\/$/, "");
  if (forced) {
    try {
      const response = await fetch(`${forced}/api/setup/health`, { signal: AbortSignal.timeout(5000) });
      if (response.ok) return forced;
    } catch {
      return null;
    }
  }

  const candidates = [
    process.env.NEXT_PUBLIC_SITE_URL,
    "http://localhost:3005",
    "http://localhost:3004",
    "http://localhost:3001",
    "http://localhost:3003",
    "http://localhost:3000",
  ].filter(Boolean);

  for (const base of candidates) {
    try {
      const response = await fetch(`${base}/api/setup/health`, { signal: AbortSignal.timeout(5000) });
      if (response.ok) return String(base).replace(/\/$/, "");
    } catch {
      // try next port
    }
  }
  return null;
}

/**
 * Returns true when live probes should run, false when caller should skip gracefully.
 * Exits the process when ZIGO_RUN_LIVE_TESTS=1 and prerequisites are missing.
 */
export async function requireLivePreflight(label = "live tests") {
  loadProjectEnv();
  const { url, anon, serviceRole } = getSupabaseEnv();

  if (!url || !anon) {
    const message = `${label}: Supabase env not configured (.env.local)`;
    if (liveTestsForced()) {
      console.error(`FAIL ${message}`);
      process.exit(1);
    }
    console.log(`SKIP ${message}`);
    return false;
  }

  const reachable = await isSupabaseReachable(url, anon);
  if (!reachable.ok) {
    const message = `${label}: Supabase unreachable (${reachable.reason})`;
    if (liveTestsForced()) {
      console.error(`FAIL ${message}`);
      console.error("Hint: start Docker Desktop, then `npx supabase start` and `npm run setup:local`.");
      process.exit(1);
    }
    console.log(`SKIP ${message}`);
    return false;
  }

  if (liveTestsForced() && !serviceRole) {
    console.error(`FAIL ${label}: SUPABASE_SERVICE_ROLE_KEY required when ZIGO_RUN_LIVE_TESTS=1`);
    process.exit(1);
  }

  return true;
}

export const DEMO_ACCOUNT_EMAILS = [
  "student@zigo.test",
  "parent@zigo.test",
  "aylin.teacher@zigo.test",
  "mert.teacher@zigo.test",
  "admin@zigo.test",
];

export const DEMO_USER_IDS = {
  aylin: "00000000-0000-4000-8000-000000000101",
  mert: "00000000-0000-4000-8000-000000000102",
  parent: "00000000-0000-4000-8000-000000000201",
  student: "00000000-0000-4000-8000-000000000301",
  admin: "00000000-0000-4000-8000-000000000401",
};

export const DEMO_POST_IDS = {
  kesirReel: "00000000-0000-4000-8000-000000000601",
  scienceReel: "00000000-0000-4000-8000-000000000602",
};

async function resolveDemoAreaIds(admin) {
  const { data: areas, error } = await admin
    .from("education_areas")
    .select("id, area_name")
    .in("area_name", ["LGS Matematik", "YKS Matematik", "LGS Fen Bilimleri", "Kodlama ve Algoritma"]);
  if (error) throw error;

  const byName = new Map((areas ?? []).map((area) => [area.area_name, area.id]));
  return {
    mathAreaId: byName.get("LGS Matematik") ?? byName.get("YKS Matematik") ?? areas?.[0]?.id ?? null,
    scienceAreaId: byName.get("LGS Fen Bilimleri") ?? null,
    codingAreaId: byName.get("Kodlama ve Algoritma") ?? null,
  };
}

/** Canonical demo feed posts owned by verified demo teachers (stable E2E reel + science probes). */
export async function seedDemoMatchFeedContent(admin) {
  const { mathAreaId, scienceAreaId } = await resolveDemoAreaIds(admin);
  if (!mathAreaId || !scienceAreaId) return;

  await admin
    .from("social_posts")
    .delete()
    .ilike("caption", "Kesirleri 60 saniyede%")
    .neq("author_id", DEMO_USER_IDS.aylin);

  const posts = [
    {
      id: DEMO_POST_IDS.kesirReel,
      author_id: DEMO_USER_IDS.aylin,
      area_id: mathAreaId,
      caption:
        "Kesirleri 60 saniyede görselleştir: önce parça, sonra sayı doğrusu, sonra mini pratik.",
      media_url: null,
      media_type: "video",
      is_reel: true,
    },
    {
      id: DEMO_POST_IDS.scienceReel,
      author_id: DEMO_USER_IDS.mert,
      area_id: scienceAreaId,
      caption: "Bitkiler ışığa neden yönelir? Evde veliyle güvenli pencere deneyi.",
      media_url: null,
      media_type: "video",
      is_reel: true,
    },
  ];

  for (const post of posts) {
    const { error } = await admin.from("social_posts").upsert(post, { onConflict: "id" });
    if (error) throw error;
  }

  await admin
    .from("users")
    .update({ is_verified: true, role: "teacher" })
    .in("id", [DEMO_USER_IDS.aylin, DEMO_USER_IDS.mert]);
}

/** Reset demo billing state so plan-picker and havale E2E stay deterministic. */
export async function resetDemoBillingState(admin) {
  await admin.from("user_subscriptions").delete().eq("user_id", DEMO_USER_IDS.student);
  await admin.from("bank_transfer_requests").delete().eq("user_id", DEMO_USER_IDS.student);
}

/** Idempotent reset so repeatable live E2E/journey runs do not inherit moderation strikes. */
export async function resetDemoSocialAccounts(admin) {
  const { data: users, error: usersError } = await admin
    .from("users")
    .select("id")
    .in("email", DEMO_ACCOUNT_EMAILS);
  if (usersError) throw usersError;

  const ids = (users ?? []).map((user) => user.id);
  if (ids.length === 0) return;

  await admin.from("moderation_admin_alerts").delete().in("user_id", ids);
  await admin.from("moderation_violations").delete().in("user_id", ids);
  const { error } = await admin
    .from("users")
    .update({
      social_safety_strike_count: 0,
      social_interactions_blocked: false,
      social_interactions_blocked_at: null,
    })
    .in("id", ids);
  if (error) throw error;
}

export async function resetDemoE2eState(admin) {
  await resetDemoSocialAccounts(admin);
  await resetDemoBillingState(admin);
  await seedDemoMatchFeedContent(admin);
}
