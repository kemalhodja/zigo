/* global console, process */

import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";

import { createClient } from "@supabase/supabase-js";
import pg from "pg";

const root = process.cwd();
const MIGRATIONS = [
  "063_lesson_requests_professional_comms.sql",
  "064_lesson_requests_hardening.sql",
  "065_lesson_request_notifications.sql",
  "066_ad_state_and_premium_system.sql",
  "067_subscriber_class_groups_and_ad_gates.sql",
  "068_post_audience_and_parent_dm_gates.sql",
  "069_google_play_billing.sql",
  "070_avatars_storage.sql",
  "071_class_groups_section.sql",
  "072_generic_user_verification.sql",
  "073_admin_user_controls.sql",
  "074_auto_verify_teachers.sql",
  "075_yayinevi_organization_type.sql",
  "076_exam_track_education_areas.sql",
  "077_moderation_report_resolved_at.sql",
  "078_admin_billing_grants.sql",
  "079_update_own_account_kind.sql",
  "080_expand_general_interest_expertise.sql",
  "081_student_area_leaderboard.sql",
  "082_invite_codes.sql",
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

for (const file of [
  ".env.local",
  ".env.vercel.production.local",
  ".env.vercel.production",
  ".env.check",
  ".env",
]) {
  loadEnvFile(file);
}

function resolveDbUrl() {
  const password = process.env.POSTGRES_PASSWORD?.trim();
  const host = process.env.POSTGRES_HOST?.trim();

  if (password && host) {
    const user = process.env.POSTGRES_USER?.trim() || "postgres";
    const database = process.env.POSTGRES_DATABASE?.trim() || "postgres";
    return `postgresql://${user}:${encodeURIComponent(password)}@${host}:5432/${database}`;
  }

  return (
    process.env.POSTGRES_URL_NON_POOLING?.trim() ||
    process.env.SUPABASE_DB_URL?.trim() ||
    process.env.POSTGRES_URL?.trim() ||
    null
  );
}

function createPgClient(dbUrl) {
  return new pg.Client({
    connectionString: dbUrl,
    ssl: { rejectUnauthorized: false },
  });
}

async function probe(admin, migrationId) {
  if (migrationId === "061") {
    const { error } = await admin.from("user_blocks").select("blocker_id").limit(1);
    return !error;
  }
  if (migrationId === "062") {
    const { error } = await admin.from("user_subscriptions").select("trial_started_at").limit(1);
    return !error;
  }
  if (migrationId === "063") {
    const { error } = await admin.from("lesson_requests").select("id").limit(1);
    return !error;
  }
  if (migrationId === "064") {
    const { data, error } = await admin.rpc("count_lesson_request_unread", {
      for_user_id: "00000000-0000-0000-0000-000000000000",
    });
    return !error && typeof data === "number";
  }
  if (migrationId === "065") {
    const { error } = await admin.rpc("create_lesson_request_notification", {
      recipient_id: "00000000-0000-0000-0000-000000000000",
      actor_id: "00000000-0000-0000-0000-000000000000",
      request_id: "00000000-0000-0000-0000-000000000000",
      kind: "lesson_request",
      message: "probe",
    });
    return Boolean(error?.message?.includes("invalid lesson request participants"));
  }
  if (migrationId === "066") {
    const { error } = await admin.from("ad_watch_records").select("id").limit(1);
    return !error;
  }
  if (migrationId === "067") {
    const { error } = await admin.from("class_groups").select("id").limit(1);
    return !error;
  }
  if (migrationId === "068") {
    const { error } = await admin.from("social_posts").select("target_audience").limit(1);
    return !error;
  }
  return false;
}

async function applySqlFile(client, file) {
  const sql = readFileSync(join(root, "supabase", "migrations", file), "utf8");
  await client.query(sql);
}

async function main() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRole = process.env.SUPABASE_SERVICE_ROLE_KEY;
  const dbUrl = resolveDbUrl();

  if (!url || !serviceRole) {
    console.error("Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY.");
    process.exit(1);
  }

  const admin = createClient(url, serviceRole, { auth: { persistSession: false } });
  const pending = [];

  for (const file of MIGRATIONS) {
    const id = file.split("_")[0];
    const applied = await probe(admin, id);
    if (applied) {
      console.log(`SKIP ${file} — already applied`);
    } else {
      pending.push(file);
      console.log(`PENDING ${file}`);
    }
  }

  if (pending.length === 0) {
    console.log("\nPASS All target migrations are applied.");
    return;
  }

  if (!dbUrl) {
    console.error("\nDatabase URL not found. Set SUPABASE_DB_URL or POSTGRES_URL_NON_POOLING.");
    process.exit(1);
  }

  console.log("\nApplying pending migrations via PostgreSQL...");
  const client = createPgClient(dbUrl);
  await client.connect();

  try {
    for (const file of pending) {
      await applySqlFile(client, file);
      console.log(`PASS ${file}`);
    }
    console.log("\nPASS All pending migrations applied.");
  } finally {
    await client.end();
  }
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : error);
  process.exit(1);
});
