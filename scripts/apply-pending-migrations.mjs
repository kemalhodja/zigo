/* global console, process */

import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { spawnSync } from "node:child_process";

import { createClient } from "@supabase/supabase-js";

const root = process.cwd();

const PENDING = [
  {
    id: "048",
    file: "048_education_organization_type.sql",
    probe: async (admin) => {
      const result = await admin.from("users").select("organization_type").limit(1);
      return !result.error;
    },
  },
  {
    id: "049",
    file: "049_registration_organization_accounts.sql",
    probe: async (admin) => {
      const result = await admin.rpc("set_user_interests", { area_ids: [] });
      return result.error?.message?.includes("authentication is required") ?? !result.error;
    },
  },
  {
    id: "108",
    file: "108_verified_teacher_answers_rls.sql",
    probe: async () => probeAnswersVerifiedPolicy(),
  },
  {
    id: "051",
    file: "051_general_interest_areas.sql",
    probe: async () => probeGeneralInterestAreas(),
  },
  {
    id: "052",
    file: "052_obscenity_moderation.sql",
    probe: async (admin) => probeObscenityModeration(admin),
  },
  {
    id: "053",
    file: "053_moderation_strikes.sql",
    probe: async (admin) => probeModerationStrikes(admin),
  },
  {
    id: "054",
    file: "054_moderation_strikes_fix.sql",
    probe: async () => probeModerationStrikesFix(),
  },
  {
    id: "055",
    file: "055_demo_social_interactions_reset.sql",
    probe: async (admin) => {
      const { data, error } = await admin
        .from("users")
        .select("social_interactions_blocked")
        .eq("email", "student@zigo.test")
        .maybeSingle();
      return !error && data?.social_interactions_blocked === false;
    },
  },
  {
    id: "056",
    file: "056_bank_transfer_payments.sql",
    probe: async (admin) => !((await admin.from("bank_transfer_requests").select("id").limit(1)).error),
  },
  {
    id: "063",
    file: "063_lesson_requests_professional_comms.sql",
    probe: async (admin) => !((await admin.from("lesson_requests").select("id").limit(1)).error),
  },
  {
    id: "064",
    file: "064_lesson_requests_hardening.sql",
    probe: async (admin) => !((await admin.from("lesson_requests").select("id").limit(1)).error),
  },
  {
    id: "065",
    file: "065_lesson_request_notifications.sql",
    probe: async (admin) => !((await admin.from("notifications").select("lesson_request_id").limit(1)).error),
  },
  {
    id: "066",
    file: "066_ad_state_and_premium_system.sql",
    probe: async (admin) => !((await admin.from("users").select("is_premium").limit(1)).error),
  },
  {
    id: "067",
    file: "067_subscriber_class_groups_and_ad_gates.sql",
    probe: async (admin) => !((await admin.from("class_groups").select("id").limit(1)).error),
  },
  {
    id: "068",
    file: "068_post_audience_and_parent_dm_gates.sql",
    probe: async (admin) => !((await admin.from("social_posts").select("target_audience").limit(1)).error),
  },
  {
    id: "069",
    file: "069_google_play_billing.sql",
    probe: async (admin) => !((await admin.from("google_play_purchases").select("id").limit(1)).error),
  },
  {
    id: "070",
    file: "070_avatars_storage.sql",
    probe: async (admin) => {
      const { data, error } = await admin.storage.listBuckets();
      if (error) return false;
      return (data ?? []).some((bucket) => bucket.name === "avatars");
    },
  },
  {
    id: "071",
    file: "071_class_groups_section.sql",
    probe: async (admin) => !((await admin.from("users").select("classroom").limit(1)).error),
  },
  {
    id: "072",
    file: "072_generic_user_verification.sql",
    probe: async (admin) => {
      const result = await admin.rpc("verify_user", { target_user_id: "00000000-0000-0000-0000-000000000000" });
      const message = result.error?.message ?? "";
      return !message.includes("Could not find the function") && !message.includes("schema cache");
    },
  },
  {
    id: "073",
    file: "073_admin_user_controls.sql",
    probe: async (admin) => !((await admin.from("admin_messages").select("id").limit(1)).error),
  },
  {
    id: "074",
    file: "074_auto_verify_teachers.sql",
    probe: async () => probeAutoVerifyTeachers(),
  },
  {
    id: "075",
    file: "075_yayinevi_organization_type.sql",
    probe: async () => probeYayineviOrganizationType(),
  },
  {
    id: "076",
    file: "076_exam_track_education_areas.sql",
    probe: async (admin) => {
      const { data, error } = await admin
        .from("education_areas")
        .select("id")
        .eq("age_group", "TYT")
        .limit(1);
      return !error && (data?.length ?? 0) > 0;
    },
  },
    {
    id: "077",
    file: "077_moderation_report_resolved_at.sql",
    probe: async (admin) => !((await admin.from("content_reports").select("resolved_at").limit(1)).error),
  },
  {
    id: "078",
    file: "078_admin_billing_grants.sql",
    probe: async (admin) => !((await admin.from("admin_billing_grants").select("id").limit(1)).error),
  },
  {
    id: "079",
    file: "079_update_own_account_kind.sql",
    probe: async (admin) => {
      const { error } = await admin.rpc("update_own_account_kind", {
        next_role: "student",
        next_organization_type: null,
      });
      if (!error) return true;
      if (/does not exist/i.test(error.message ?? "")) return false;
      return /authentication is required/i.test(error.message ?? "");
    },
  },
  {
    id: "080",
    file: "080_expand_general_interest_expertise.sql",
    probe: async () => probeExpandedGeneralInterestExpertise(),
  },
  {
    id: "081",
    file: "081_student_area_leaderboard.sql",
    probe: async (admin) => {
      const { error } = await admin.rpc("get_area_leaderboard", {
        target_area_id: 1,
        limit_count: 1,
      });
      if (!error) return true;
      return !/does not exist/i.test(error.message ?? "");
    },
  },
  {
    id: "082",
    file: "082_invite_codes.sql",
    probe: async (admin) => !((await admin.from("invite_codes").select("id").limit(1)).error),
  },
  {
    id: "083",
    file: "083_post_external_link.sql",
    probe: async (admin) => !((await admin.from("social_posts").select("external_url").limit(1)).error),
  },
  {
    id: "084",
    file: "084_post_co_author.sql",
    probe: async (admin) => !((await admin.from("social_posts").select("co_author_id").limit(1)).error),
  },
  {
    id: "085",
    file: "085_study_rooms.sql",
    probe: async (admin) => !((await admin.from("study_rooms").select("id").limit(1)).error),
  },
  {
    id: "086",
    file: "086_ai_mentor.sql",
    probe: async (admin) => !((await admin.from("ai_mentor_logs").select("id").limit(1)).error),
  },
  {
    id: "087",
    file: "087_social_media_storage_and_url_size.sql",
    probe: async () => false,
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

function resolveDbUrl() {
  const explicit = process.env.SUPABASE_DB_URL?.trim();
  if (explicit) return explicit;

  const status = spawnSync("npx", ["supabase", "status", "-o", "env"], {
    cwd: root,
    encoding: "utf8",
    shell: process.platform === "win32",
  });

  if (status.status === 0) {
    for (const line of status.stdout.split("\n")) {
      const trimmed = line.trim();
      if (trimmed.startsWith("DB_URL=")) {
        return trimmed.slice("DB_URL=".length).replace(/^['"]|['"]$/g, "");
      }
    }
  }

  return null;
}

function getLocalDbContainer() {
  const configPath = join(root, "supabase", "config.toml");
  if (!existsSync(configPath)) return "supabase_db_zigo";
  const config = readFileSync(configPath, "utf8");
  const match = config.match(/project_id\s*=\s*"([^"]+)"/);
  return `supabase_db_${match?.[1] ?? "zigo"}`;
}

function probeAnswersVerifiedPolicy() {
  const container = getLocalDbContainer();
  const result = spawnSync(
    "docker",
    [
      "exec",
      container,
      "psql",
      "-U",
      "postgres",
      "-d",
      "postgres",
      "-tAc",
      "SELECT count(*) FROM pg_policies WHERE schemaname = 'public' AND tablename = 'answers' AND policyname = 'Teachers can answer assigned area questions' AND with_check LIKE '%current_user_is_verified_teacher%';",
    ],
    { encoding: "utf8", shell: false },
  );

  if (result.status !== 0) return false;
  return String(result.stdout ?? "").trim() === "1";
}

function probeGeneralInterestAreas() {
  const container = getLocalDbContainer();
  const result = spawnSync(
    "docker",
    [
      "exec",
      container,
      "psql",
      "-U",
      "postgres",
      "-d",
      "postgres",
      "-tAc",
      "SELECT count(*) FROM public.education_areas WHERE age_group = 'Genel İlgi' AND area_name = 'Genel Kültür';",
    ],
    { encoding: "utf8", shell: false },
  );

  if (result.status !== 0) return false;
  return String(result.stdout ?? "").trim() === "1";
}

function probeExpandedGeneralInterestExpertise() {
  const container = getLocalDbContainer();
  const result = spawnSync(
    "docker",
    [
      "exec",
      container,
      "psql",
      "-U",
      "postgres",
      "-d",
      "postgres",
      "-tAc",
      "SELECT count(*) FROM public.education_areas WHERE age_group = 'Genel İlgi' AND area_name IN ('Yapay Zeka', 'Eğitim ve Pedagoji', 'Satranç');",
    ],
    { encoding: "utf8", shell: false },
  );

  if (result.status !== 0) return false;
  return String(result.stdout ?? "").trim() === "3";
}

async function probeObscenityModeration(admin) {
  const { data, error } = await admin
    .from("blocked_keywords")
    .select("keyword")
    .eq("category", "obscenity")
    .eq("keyword", "porno")
    .maybeSingle();

  if (!error && data) return true;

  const container = getLocalDbContainer();
  const result = spawnSync(
    "docker",
    [
      "exec",
      container,
      "psql",
      "-U",
      "postgres",
      "-d",
      "postgres",
      "-tAc",
      "SELECT count(*) FROM pg_proc WHERE proname = 'content_contains_obscenity_pattern';",
    ],
    { encoding: "utf8", shell: false },
  );

  if (result.status !== 0) return false;
  return String(result.stdout ?? "").trim() === "1";
}

async function probeModerationStrikes(admin) {
  const { error } = await admin.from("moderation_admin_alerts").select("id").limit(1);
  if (!error) return true;

  const container = getLocalDbContainer();
  const result = spawnSync(
    "docker",
    [
      "exec",
      container,
      "psql",
      "-U",
      "postgres",
      "-d",
      "postgres",
      "-tAc",
      "SELECT count(*) FROM pg_proc WHERE proname = 'record_moderation_violation';",
    ],
    { encoding: "utf8", shell: false },
  );

  if (result.status !== 0) return false;
  return String(result.stdout ?? "").trim() === "1";
}

function probeModerationStrikesFix() {
  const container = getLocalDbContainer();
  const result = spawnSync(
    "docker",
    [
      "exec",
      container,
      "psql",
      "-U",
      "postgres",
      "-d",
      "postgres",
      "-tAc",
      "SELECT count(*) FROM pg_trigger WHERE tgname = 'trg_post_comments_social_block';",
    ],
    { encoding: "utf8", shell: false },
  );

  if (result.status !== 0) return false;
  return String(result.stdout ?? "").trim() === "1";
}

function probeAutoVerifyTeachers() {
  const container = getLocalDbContainer();
  const result = spawnSync(
    "docker",
    [
      "exec",
      container,
      "psql",
      "-U",
      "postgres",
      "-d",
      "postgres",
      "-tAc",
      "SELECT count(*) FROM pg_proc WHERE proname = 'handle_new_auth_user' AND pg_get_functiondef(oid) LIKE '%automatically verify teachers%';",
    ],
    { encoding: "utf8", shell: false },
  );
  if (result.status !== 0) return false;
  return String(result.stdout ?? "").trim() === "1";
}

function probeYayineviOrganizationType() {
  const container = getLocalDbContainer();
  const result = spawnSync(
    "docker",
    [
      "exec",
      container,
      "psql",
      "-U",
      "postgres",
      "-d",
      "postgres",
      "-tAc",
      "SELECT count(*) FROM pg_constraint WHERE conname LIKE '%organization_type%' AND pg_get_constraintdef(oid) LIKE '%yayinevi%';",
    ],
    { encoding: "utf8", shell: false },
  );
  if (result.status !== 0) return false;
  return Number(String(result.stdout ?? "").trim()) > 0;
}

function applySqlViaDocker(container, relativePath) {
  const filePath = join(root, "supabase", "migrations", relativePath);
  const sql = readFileSync(filePath, "utf8");
  const result = spawnSync(
    "docker",
    ["exec", "-i", container, "psql", "-U", "postgres", "-d", "postgres", "-v", "ON_ERROR_STOP=1"],
    {
      cwd: root,
      input: sql,
      encoding: "utf8",
      shell: false,
    },
  );

  if (result.status !== 0) {
    const detail = `${result.stderr ?? ""}${result.stdout ?? ""}`.trim();
    throw new Error(detail || `docker psql failed for ${relativePath}`);
  }
}

function applySqlFile(dbUrl, relativePath) {
  const filePath = join(root, "supabase", "migrations", relativePath);
  if (!existsSync(filePath)) {
    throw new Error(`Missing migration file: ${relativePath}`);
  }

  const isLocal = dbUrl.includes("127.0.0.1") || dbUrl.includes("localhost");

  if (isLocal) {
    applySqlViaDocker(getLocalDbContainer(), relativePath);
    return;
  }

  const psql = spawnSync("psql", [dbUrl, "-v", "ON_ERROR_STOP=1", "-f", filePath], {
    cwd: root,
    stdio: "pipe",
    encoding: "utf8",
    shell: process.platform === "win32",
  });

  if (psql.status === 0) {
    return;
  }

  const psqlHint = psql.stderr?.trim() || psql.stdout?.trim() || "psql unavailable";
  throw new Error(`Could not apply ${relativePath}. Set SUPABASE_DB_URL and install psql. ${psqlHint}`);
}

async function main() {
  loadEnvFile(".env.local");
  loadEnvFile(".env");

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRole = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!url || !serviceRole) {
    console.error("Set NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY in .env.local");
    process.exit(1);
  }

  const admin = createClient(url, serviceRole, {
    auth: { autoRefreshToken: false, persistSession: false },
  });

  const dbUrl = resolveDbUrl();
  if (!dbUrl) {
    console.error("Could not resolve database URL.");
    console.error("Set SUPABASE_DB_URL or start local Supabase (`npx supabase start`).");
    process.exit(1);
  }

  let applied = 0;

  for (const migration of PENDING) {
    const ready = await migration.probe(admin);
    if (ready) {
      console.log(`SKIP migration ${migration.id} (already applied)`);
      continue;
    }

    console.log(`Applying migration ${migration.id}: ${migration.file}`);
    applySqlFile(dbUrl, migration.file);
    applied += 1;
    console.log(`PASS migration ${migration.id}`);
  }

  if (applied === 0) {
    console.log("PASS All pending migrations already applied.");
  } else {
    console.log(`PASS Applied ${applied} pending migration(s).`);
  }
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : error);
  process.exit(1);
});
