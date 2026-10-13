/* global console, process */

import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { createClient } from "@supabase/supabase-js";

const root = process.cwd();

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

async function main() {
  loadEnvFile(".env.vercel.production");
  loadEnvFile(".env.local");
  loadEnvFile(".env");
  loadEnvFile(".env.production");

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !serviceRoleKey) {
    console.error("Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY");
    process.exit(1);
  }

  const supabase = createClient(supabaseUrl, serviceRoleKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });

  console.log("=== RESETTING ALL USERS TO FREE TIER ===");

  // 1. Reset users table (is_premium = false, ad_free_until = null)
  const { data: updatedUsers, error: usersErr } = await supabase
    .from("users")
    .update({ is_premium: false, ad_free_until: null })
    .eq("is_premium", true)
    .select("id, email, full_name");

  if (usersErr) {
    console.error("Error updating users:", usersErr);
  } else {
    console.log(`Reset ${updatedUsers?.length ?? 0} premium users to standard free tier in users table.`);
  }

  // Also clear any remaining ad_free_until
  const { error: adFreeErr } = await supabase
    .from("users")
    .update({ ad_free_until: null })
    .not("ad_free_until", "is", null);

  if (adFreeErr) {
    console.warn("Notice updating ad_free_until in users:", adFreeErr);
  }

  // 2. Reset user_subscriptions table (tier = 'free', current_period_end = past date, trial_ends_at = null)
  const now = new Date().toISOString();
  const pastIso = "1970-01-01T00:00:00.000Z";
  const { data: updatedSubs, error: subsErr } = await supabase
    .from("user_subscriptions")
    .update({
      tier: "free",
      current_period_end: pastIso,
      trial_ends_at: null,
      updated_at: now,
    })
    .eq("tier", "zigo_plus")
    .select("user_id, tier");

  if (subsErr) {
    console.error("Error updating user_subscriptions:", subsErr);
  } else {
    console.log(`Reset ${updatedSubs?.length ?? 0} user_subscriptions to 'free' tier.`);
  }

  // 3. Expire google_play_purchases
  const { data: updatedGp, error: gpErr } = await supabase
    .from("google_play_purchases")
    .update({ expiry_time: pastIso })
    .gt("expiry_time", now)
    .select("id, user_id");

  if (gpErr) {
    console.warn("Notice updating google_play_purchases:", gpErr);
  } else {
    console.log(`Expired ${updatedGp?.length ?? 0} active google_play_purchases.`);
  }

  console.log("All users successfully converted to free usage tier.");
}

main().catch((err) => {
  console.error("Fatal error:", err);
  process.exit(1);
});
