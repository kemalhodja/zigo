/* global console, process */

import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";

import { createClient } from "@supabase/supabase-js";

import { DEMO_ACCOUNT_EMAILS, loadProjectEnv, seedDemoMatchFeedContent } from "./live-test-utils.mjs";

const root = process.cwd();
const DEMO_PASSWORD = "ZigoTest123!";

const DEMO_ACCOUNTS = [
  {
    id: "00000000-0000-4000-8000-000000000101",
    email: "aylin.teacher@zigo.test",
    fullName: "Aylin Kaya",
    role: "teacher",
    isVerified: true,
  },
  {
    id: "00000000-0000-4000-8000-000000000102",
    email: "mert.teacher@zigo.test",
    fullName: "Mert Yilmaz",
    role: "teacher",
    isVerified: true,
  },
  {
    id: "00000000-0000-4000-8000-000000000201",
    email: "parent@zigo.test",
    fullName: "Zigo Parent",
    role: "parent",
    isVerified: false,
  },
  {
    id: "00000000-0000-4000-8000-000000000301",
    email: "student@zigo.test",
    fullName: "Zigo Student",
    role: "student",
    isVerified: false,
  },
  {
    id: "00000000-0000-4000-8000-000000000401",
    email: "admin@zigo.test",
    fullName: "Zigo Admin",
    role: "parent",
    isVerified: false,
    platformAdmin: true,
  },
];

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

async function seedDemoContent(admin, mathAreaId, scienceAreaId) {
  const parentId = "00000000-0000-4000-8000-000000000201";
  const teacherId = "00000000-0000-4000-8000-000000000101";
  const scienceTeacherId = "00000000-0000-4000-8000-000000000102";
  const questionId = "00000000-0000-4000-8000-000000000501";

  if (mathAreaId) {
    const { error: questionError } = await admin.from("questions").upsert(
      {
        id: questionId,
        author_id: parentId,
        area_id: mathAreaId,
        title: "Çocuğum kesirleri nasıl günlük pratik yapabilir?",
        description: "Beş dakikalık, sıkmadan uygulanabilecek bir ev rutini istiyorum.",
        is_resolved: false,
      },
      { onConflict: "id" },
    );
    if (questionError) throw questionError;

    const { data: existingAnswer } = await admin
      .from("answers")
      .select("id")
      .eq("question_id", questionId)
      .eq("teacher_id", teacherId)
      .maybeSingle();

    if (!existingAnswer) {
      const { error: answerError } = await admin.from("answers").insert({
        question_id: questionId,
        teacher_id: teacherId,
        content: "Her gün iki görsel kesir sorusu, bir sayı doğrusu eşleştirmesi ve en son bir mini quiz yeterli olur.",
        is_approved_by_parent: true,
      });
      if (answerError) throw answerError;
    }
  }

  for (const [authorId, areaId, caption] of [
    [teacherId, mathAreaId, "Bugün kesir pratiği: 1 dakika izle, 1 soru çöz."],
    [scienceTeacherId, scienceAreaId, "Fen deneyi yayınlandı. Güvenli şekilde veliyle dene."],
  ]) {
    if (!authorId || !areaId) continue;
    const { data: existingStory } = await admin
      .from("stories")
      .select("id")
      .eq("author_id", authorId)
      .eq("caption", caption)
      .maybeSingle();
    if (existingStory) continue;

    const { error: storyError } = await admin.from("stories").insert({
      author_id: authorId,
      area_id: areaId,
      media_url: null,
      caption,
    });
    if (storyError) throw storyError;
  }
}

async function resolveAreaIds(admin) {
  const { data: areas, error } = await admin
    .from("education_areas")
    .select("id, area_name")
    .in("area_name", ["LGS Matematik", "YKS Matematik", "LGS Fen Bilimleri", "Kodlama ve Algoritma"]);
  if (error) throw error;

  const byName = new Map((areas ?? []).map((area) => [area.area_name, area.id]));
  const mathAreaId = byName.get("LGS Matematik") ?? byName.get("YKS Matematik") ?? areas?.[0]?.id ?? null;
  const scienceAreaId = byName.get("LGS Fen Bilimleri") ?? null;
  const codingAreaId = byName.get("Kodlama ve Algoritma") ?? null;

  return { mathAreaId, scienceAreaId, codingAreaId };
}

async function seedInterests(admin, userId, areaIds) {
  const rows = areaIds.filter(Boolean).map((areaId) => ({ user_id: userId, area_id: areaId }));
  if (rows.length === 0) return;

  const { error } = await admin.from("user_interests").upsert(rows, { onConflict: "user_id,area_id" });
  if (error) throw error;
}

async function ensureAuthUser(admin, account) {
  const existing = await admin.auth.admin.listUsers({ page: 1, perPage: 1000 });
  if (existing.error) throw existing.error;

  const matched = existing.data.users.find(
    (user) => user.email?.toLowerCase() === account.email.toLowerCase(),
  );

  if (matched?.id) {
    const updated = await admin.auth.admin.updateUserById(matched.id, {
      password: DEMO_PASSWORD,
      email_confirm: true,
      user_metadata: { full_name: account.fullName, role: account.role },
    });
    if (updated.error) throw updated.error;
    return matched.id;
  }

  const created = await admin.auth.admin.createUser({
    id: account.id,
    email: account.email,
    password: DEMO_PASSWORD,
    email_confirm: true,
    user_metadata: { full_name: account.fullName, role: account.role },
  });
  if (created.error) throw created.error;
  return created.data.user?.id ?? account.id;
}

async function main() {
  loadProjectEnv();
  loadEnvFile(".env.vercel.production");
  loadEnvFile(".env.production.local");

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRole = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !serviceRole) {
    throw new Error("Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY.");
  }

  const admin = createClient(url, serviceRole, {
    auth: { autoRefreshToken: false, persistSession: false },
  });

  for (const account of DEMO_ACCOUNTS) {
    const userId = await ensureAuthUser(admin, account);
    const profile = await admin.from("users").upsert(
      {
        id: userId,
        email: account.email,
        full_name: account.fullName,
        role: account.role,
        is_verified: account.isVerified,
        total_points: account.role === "student" ? 120 : 0,
      },
      { onConflict: "id" },
    );
    if (profile.error) throw profile.error;

    if (account.platformAdmin) {
      const grant = await admin.from("platform_admins").upsert(
        { user_id: userId },
        { onConflict: "user_id" },
      );
      if (grant.error) throw grant.error;
    }

    console.log(`PASS ${account.email}`);
  }

  const { mathAreaId, scienceAreaId, codingAreaId } = await resolveAreaIds(admin);
  await seedInterests(admin, "00000000-0000-4000-8000-000000000101", [mathAreaId]);
  await seedInterests(admin, "00000000-0000-4000-8000-000000000102", [scienceAreaId]);
  await seedInterests(admin, "00000000-0000-4000-8000-000000000201", [mathAreaId]);
  await seedInterests(admin, "00000000-0000-4000-8000-000000000301", [mathAreaId, codingAreaId]);
  await seedDemoContent(admin, mathAreaId, scienceAreaId);
  await seedDemoMatchFeedContent(admin);
  console.log("PASS Demo Match-Feed interests and posts seeded");

  const anon = createClient(url, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY, {
    auth: { autoRefreshToken: false, persistSession: false },
  });

  for (const email of DEMO_ACCOUNT_EMAILS) {
    const { error } = await anon.auth.signInWithPassword({ email, password: DEMO_PASSWORD });
    if (error) throw new Error(`${email} sign-in failed: ${error.message}`);
  }

  console.log(`PASS Demo accounts ready (${DEMO_ACCOUNTS.length}) with password ${DEMO_PASSWORD}`);
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : error);
  process.exit(1);
});
