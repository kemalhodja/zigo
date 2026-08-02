/**
 * Ad State Manager
 * 
 * Manages ad-free state, premium subscriptions, and ad-gate logic for Zigo.
 * Provides server-side utilities for checking ad eligibility and managing
 * time-based ad rewards.
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

/**
 * Check if a user has ad-free access
 */
export async function isUserAdFree(userId: string): Promise<AdStateResult> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("users")
    .select("is_premium, ad_free_until")
    .eq("id", userId)
    .single();

  if (error || !data) {
    return {
      isAdFree: false,
      reason: "none",
    };
  }

  const now = new Date();
  const adFreeUntil = data.ad_free_until ? new Date(data.ad_free_until) : null;
  const isPremium = data.is_premium;

  // Premium users always have ad-free access
  if (isPremium) {
    return {
      isAdFree: true,
      reason: "premium",
      adFreeUntil: null,
      isPremium: true,
    };
  }

  // Check if ad-free until is in the future
  if (adFreeUntil && adFreeUntil > now) {
    return {
      isAdFree: true,
      reason: "ad_free_until",
      adFreeUntil,
      isPremium: false,
    };
  }

  return {
    isAdFree: false,
    reason: "none",
    adFreeUntil: adFreeUntil || null,
    isPremium: false,
  };
}

/**
 * Grant ad-free time to a user (called after watching a rewarded ad)
 */
export async function grantAdFreeTime(
  userId: string,
  hoursToAdd: number = 2
): Promise<WatchAdResult> {
  const supabase = await createClient();

  try {
    const { error } = await supabase.rpc("watch_ad_for_reward", {
      target_user_id: userId,
      hours_to_grant: hoursToAdd,
    });

    if (error) {
      return {
        success: false,
        adFreeUntil: new Date(),
        hoursGranted: 0,
        error: error.message,
      };
    }

    // Fetch updated ad_free_until
    const { data: userData } = await supabase
      .from("users")
      .select("ad_free_until")
      .eq("id", userId)
      .single();

    const adFreeUntil = userData?.ad_free_until
      ? new Date(userData.ad_free_until)
      : new Date();

    return {
      success: true,
      adFreeUntil,
      hoursGranted: hoursToAdd,
    };
  } catch (error) {
    return {
      success: false,
      adFreeUntil: new Date(),
      hoursGranted: 0,
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
}

/**
 * Upgrade user to premium subscription
 */
export async function upgradeToPremium(userId: string): Promise<boolean> {
  const supabase = await createClient();

  const { error } = await supabase.rpc("upgrade_to_premium", {
    target_user_id: userId,
  });

  return !error;
}

/**
 * Downgrade user from premium to ad-supported
 */
export async function downgradeFromPremium(userId: string): Promise<boolean> {
  const supabase = await createClient();

  const { error } = await supabase.rpc("downgrade_from_premium", {
    target_user_id: userId,
  });

  return !error;
}

/**
 * Check if user can perform a gated action (e.g., share reel, create post)
 * Returns whether the user needs to watch an ad first
 */
export async function checkAdGate(userId: string): Promise<{
  canProceed: boolean;
  requiresAd: boolean;
  adState: AdStateResult;
}> {
  const adState = await isUserAdFree(userId);
  const decision = decideAdGate(adState);

  return {
    ...decision,
    adState,
  };
}

/**
 * Get ad watch history for a user
 */
export async function getAdWatchHistory(userId: string, limit: number = 50) {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("ad_watch_log")
    .select("*")
    .eq("user_id", userId)
    .order("watched_at", { ascending: false })
    .limit(limit);

  if (error) {
    return [];
  }

  return data || [];
}

/**
 * Get total ad-free hours from watch history
 */
export async function getTotalAdFreeHours(userId: string): Promise<number> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("ad_watch_log")
    .select("hours_granted")
    .eq("user_id", userId)
    .gte("expires_at", new Date().toISOString());

  if (error || !data) {
    return 0;
  }

  return data.reduce((sum: number, log: { hours_granted: number }) => sum + log.hours_granted, 0);
}

/**
 * Check if user is in trial period (for premium trial logic)
 * This assumes trial_start_date is stored in users table or a separate table
 */
export async function isUserInTrial(userId: string): Promise<boolean> {
  const supabase = await createClient();

  // This would require a trial_start_date column in users table
  // For now, we'll check if user has premium but no payment record
  const { data, error } = await supabase
    .from("users")
    .select("is_premium, created_at")
    .eq("id", userId)
    .single();

  if (error || !data) {
    return false;
  }

  // If user is premium and account is less than 7 days old, they're in trial
  if (data.is_premium && data.created_at) {
    const createdDate = new Date(data.created_at);
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

    return createdDate > sevenDaysAgo;
  }

  return false;
}

/**
 * Auto-downgrade users whose trial has expired
 * This should be called by a scheduled job/cron
 */
export async function autoDowngradeExpiredTrials(): Promise<{
  downgraded: number;
  errors: string[];
}> {
  const supabase = await createClient();

  // Find users in trial whose trial expired more than 1 day ago
  const sevenDaysAgo = new Date();
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

  const { data: expiredTrialUsers, error: fetchError } = await supabase
    .from("users")
    .select("id")
    .eq("is_premium", true)
    .lt("created_at", sevenDaysAgo.toISOString());

  if (fetchError || !expiredTrialUsers) {
    return {
      downgraded: 0,
      errors: [fetchError?.message || "Failed to fetch users"],
    };
  }

  let downgraded = 0;
  const errors: string[] = [];

  for (const user of expiredTrialUsers) {
    const success = await downgradeFromPremium(user.id);
    if (success) {
      downgraded++;
    } else {
      errors.push(`Failed to downgrade user ${user.id}`);
    }
  }

  return {
    downgraded,
    errors,
  };
}