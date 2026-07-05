/* global console, process */

import { createClient } from "@supabase/supabase-js";

import { journeyStep, printJourneySummary } from "./journey-utils.mjs";
import { loadProjectEnv } from "./live-test-utils.mjs";

const ADMIN_EMAIL = "admin@zigo.test";
const TEACHER_EMAIL = "mert.teacher@zigo.test";
const PASSWORD = "ZigoTest123!";

async function main() {
  loadProjectEnv();
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  const results = [];

  if (!url || !anon) {
    console.error("Missing Supabase env.");
    process.exit(1);
  }

  const client = createClient(url, anon, { auth: { autoRefreshToken: false, persistSession: false } });
  const { data: authData, error: authError } = await client.auth.signInWithPassword({
    email: ADMIN_EMAIL,
    password: PASSWORD,
  });
  results.push(journeyStep("1. Admin girişi", !authError && Boolean(authData.session), authError?.message ?? "ok"));
  if (authError || !authData.session) process.exit(1);

  const admin = createClient(url, anon, {
    global: { headers: { Authorization: `Bearer ${authData.session.access_token}` } },
    auth: { autoRefreshToken: false, persistSession: false },
  });

  const { data: teacherProfile } = await admin.from("users").select("id, is_verified").eq("email", TEACHER_EMAIL).maybeSingle();
  results.push(journeyStep("2. Öğretmen profili", Boolean(teacherProfile?.id), teacherProfile?.id ?? "missing"));

  const unverify = await admin.rpc("verify_teacher", {
    target_teacher_id: teacherProfile?.id,
    verified: false,
  });
  results.push(
    journeyStep(
      "3. Admin doğrulamayı kaldırır",
      !unverify.error && unverify.data?.is_verified === false,
      unverify.error?.message ?? String(unverify.data?.is_verified),
    ),
  );

  const verify = await admin.rpc("verify_teacher", {
    target_teacher_id: teacherProfile?.id,
    verified: true,
  });
  results.push(
    journeyStep(
      "4. Admin öğretmeni doğrular",
      !verify.error && verify.data?.is_verified === true,
      verify.error?.message ?? "verified",
    ),
  );

  printJourneySummary("Admin öğretmen doğrulama yolculuğu", results);
  process.exit(results.every((item) => item.ok) ? 0 : 1);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
