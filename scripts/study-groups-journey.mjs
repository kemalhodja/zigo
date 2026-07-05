/* global console, process */

import { createClient } from "@supabase/supabase-js";

import { journeyStep, printJourneySummary } from "./journey-utils.mjs";
import { loadProjectEnv } from "./live-test-utils.mjs";

const STUDENT_EMAIL = "student@zigo.test";
const PARENT_EMAIL = "parent@zigo.test";
const PASSWORD = "ZigoTest123!";

async function signIn(url, anon, email) {
  const client = createClient(url, anon, { auth: { autoRefreshToken: false, persistSession: false } });
  const { data, error } = await client.auth.signInWithPassword({ email, password: PASSWORD });
  if (error) throw error;
  return createClient(url, anon, {
    global: { headers: { Authorization: `Bearer ${data.session.access_token}` } },
    auth: { autoRefreshToken: false, persistSession: false },
  });
}

async function main() {
  loadProjectEnv();
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  const results = [];

  if (!url || !anon) {
    console.error("Missing Supabase env.");
    process.exit(1);
  }

  const student = await signIn(url, anon, STUDENT_EMAIL);
  const parent = await signIn(url, anon, PARENT_EMAIL);

  const parentGroup = await parent.rpc("create_study_group", {
    p_name: `Veli QA ${Date.now()}`,
    p_description: "Journey parent group",
  });
  results.push(
    journeyStep(
      "1. Veli grup oluşturur",
      !parentGroup.error && parentGroup.data?.status === "active",
      parentGroup.error?.message ?? parentGroup.data?.status ?? "ok",
    ),
  );

  const studentGroup = await student.rpc("create_study_group", {
    p_name: `Öğrenci QA ${Date.now()}`,
    p_parent_email: PARENT_EMAIL,
  });
  results.push(
    journeyStep(
      "2. Öğrenci veli onaylı grup ister",
      !studentGroup.error && studentGroup.data?.status === "pending_parent",
      studentGroup.error?.message ?? studentGroup.data?.status ?? "ok",
    ),
  );

  const pending = await parent
    .from("study_group_approvals")
    .select("id")
    .eq("group_id", studentGroup.data?.id ?? "00000000-0000-0000-0000-000000000000")
    .eq("status", "pending")
    .maybeSingle();

  const approval = await parent.rpc("parent_review_study_group_approval", {
    p_approval_id: pending.data?.id,
    p_decision: "approved",
  });
  results.push(
    journeyStep(
      "3. Veli grup isteğini onaylar",
      !approval.error && Boolean(pending.data?.id),
      approval.error?.message ?? "approved",
    ),
  );

  const browse = await student
    .from("study_groups")
    .select("id")
    .eq("status", "active")
    .limit(5);
  results.push(
    journeyStep(
      "4. Öğrenci aktif grupları görür",
      !browse.error && (browse.data?.length ?? 0) > 0,
      browse.error?.message ?? `${browse.data?.length ?? 0} grup`,
    ),
  );

  const message = await student.rpc("send_study_group_message", {
    p_group_id: studentGroup.data?.id,
    p_content: "Journey grup mesaji guvenli test.",
  });
  results.push(
    journeyStep(
      "5. Öğrenci grup mesaji gönderir",
      !message.error,
      message.error?.message ?? "sent",
    ),
  );

  const parentMessage = await parent.rpc("send_study_group_message", {
    p_group_id: parentGroup.data?.id,
    p_content: "Veli grup mesaji.",
  });
  results.push(
    journeyStep(
      "6. Veli grup mesaji gönderir",
      !parentMessage.error,
      parentMessage.error?.message ?? "sent",
    ),
  );

  printJourneySummary("Çalışma grupları yolculuğu", results);
  process.exit(results.every((item) => item.ok) ? 0 : 1);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
