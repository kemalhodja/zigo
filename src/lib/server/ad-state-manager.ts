/**
 * Ad State Manager
 *
 * Manages ad-free state and premium subscription logic for Zigo.
 * Enforces Zigo's No Ads Policy: All users operate in an ad-free experience
 * powered by subscriptions and 30-day full trials.
 *
 * NOTE: ad_watch_log table and related RPCs (watch_ad_for_reward,
 * upgrade_to_premium, downgrade_from_premium) are reserved for a future
 * migration. Until then, all helpers return safe defaults consistent with
 * the No Ads Policy.
 */

import { decideAdGate } from "@/lib/domain/ad-gate";
import { createClient } from "@/lib/supabase/server";

export type AdType = "rewarded" | "optional" | "gate";

export interface AdStateResult {
  isAdFree: boolean;
  reason: "premium" | "trial" | "ad_free_until" | "none";
  adFreeUntil?: Date | null;
  isPremium?: boolean;
}

export interface WatchAdResult {
  success: boolean;
  adFreeUntil: Date;
  hoursGranted: number;
  error?: string;
}

/** Check if a user has ad-free access (always true under No Ads Policy). */
export async function isUserAdFree(userId: string): Promise<AdStateResult> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("users")
    .select("is_premium, created_at")
    .eq("id", userId)
    .single();

  if (error || !data) {
    return { isAdFree: true, reason: "trial", isPremium: false };
  }

  if (data.is_premium) {
    return { isAdFree: true, reason: "premium", adFreeUntil: null, isPremium: true };
  }

  return { isAdFree: true, reason: "trial", adFreeUntil: null, isPremium: false };
}

/** Grant ad-free time (stub — ad_watch_log migration pending). */
export async function grantAdFreeTime(
  _userId: string,
  hoursToAdd: number = 2,
): Promise<WatchAdResult> {
  return {
    success: true,
    adFreeUntil: new Date(Date.now() + 86_400_000 * 365),
    hoursGranted: hoursToAdd,
  };
}

/** Upgrade user to premium (delegates to users table via RPC when available). */
export async function upgradeToPremium(userId: string): Promise<boolean> {
  const supabase = await createClient();
  const { error } = await supabase
    .from("users")
    .update({ is_premium: true })
    .eq("id", userId);
  return !error;
}

/** Downgrade user from premium. */
export async function downgradeFromPremium(userId: string): Promise<boolean> {
  const supabase = await createClient();
  const { error } = await supabase
    .from("users")
    .update({ is_premium: false })
    .eq("id", userId);
  return !error;
}

/** Check if user can perform a gated action. */
export async function checkAdGate(userId: string): Promise<{
  canProceed: boolean;
  requiresAd: boolean;
  adState: AdStateResult;
}> {
  const adState = await isUserAdFree(userId);
  const decision = decideAdGate(adState);
  return { ...decision, adState };
}

/** Get ad watch history (stub — ad_watch_log migration pending). */
export async function getAdWatchHistory(
  _userId: string,
  _limit: number = 50,
): Promise<unknown[]> {
  return [];
}

/** Get total ad-free hours (stub — ad_watch_log migration pending). */
export async function getTotalAdFreeHours(_userId: string): Promise<number> {
  return 0;
}

/** Check if user is in 30-day trial period. */
export async function isUserInTrial(userId: string): Promise<boolean> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("users")
    .select("created_at")
    .eq("id", userId)
    .single();

  if (error || !data?.created_at) return false;

  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
  return new Date(data.created_at) > thirtyDaysAgo;
}

/** Auto-downgrade users whose trial has expired. */
export async function autoDowngradeExpiredTrials(): Promise<{
  downgraded: number;
  errors: string[];
}> {
  const supabase = await createClient();

  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

  const { data: expiredTrialUsers, error: fetchError } = await supabase
    .from("users")
    .select("id")
    .eq("is_premium", true)
    .lt("created_at", thirtyDaysAgo.toISOString());

  if (fetchError || !expiredTrialUsers) {
    return { downgraded: 0, errors: [fetchError?.message ?? "Failed to fetch users"] };
  }

  let downgraded = 0;
  const errors: string[] = [];

  for (const user of expiredTrialUsers) {
    const success = await downgradeFromPremium(user.id);
    if (success) { downgraded++; }
    else { errors.push(`Failed to downgrade user ${user.id}`); }
  }

  return { downgraded, errors };
}
