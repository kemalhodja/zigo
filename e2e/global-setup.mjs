/* global process */

import { createClient } from "@supabase/supabase-js";

import { loadProjectEnv, resetDemoE2eState } from "../scripts/live-test-utils.mjs";

export default async function globalSetup() {
  if (process.env.E2E_SKIP_LIVE_RESET === "1") return;

  loadProjectEnv();
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRole = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !serviceRole) return;

  const admin = createClient(url, serviceRole, { auth: { persistSession: false } });
  await resetDemoE2eState(admin);
}
