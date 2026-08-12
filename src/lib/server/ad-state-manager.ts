/* eslint-disable @typescript-eslint/no-explicit-any */
/**
 * Ad State Manager
 * 
 * Manages ad-free state, premium subscriptions, and ad-gate logic for Zigo.
 * Enforces Zigo's No Ads Policy: All users operate in an ad-free experience
 * powered by subscriptions and 30-day full trials.
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
 * Check if a user has ad-free access (Under Zigo No Ads Policy, app is 100% ad-free)
 */
export async function isUserAdFree(userId: string): Promise<AdStateResult> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("users")
    .select("is_premium, created_at")
    .eq("id", userId)
    .single();

  if (error || !data) {
    return {
      isAdFree: true,
      reason: "trial",
      isPremium: false,
    };
  }

  const isPremium = Boolean(data.is_premium);

  if (isPremium) {
    return {
      isAdFree: true,
      reason: "premium",
      adFreeUntil: null,
      isPremium: true,
    };
  }

  return {
    isAdFree: true,
    reason: "trial",
    adFreeUntil: null,
    isPremium: false,
  };
}

/**
 * Grant ad-free time to a user (no-op helper preserved for compatibility)
 */
export async function grantAdFreeTime(
  userId: string,
  hoursToAdd: number = 2
): Promise<WatchAdResult> {
  const supabase = await createClient();

  try {
    const { error } = await (supabase.rpc as any)("watch_ad_for_reward", {
      target_user_id: userId,
      hours_to_grant: hoursToAdd,
    });

    if (error) {
      return {
        success: true,
        adFreeUntil: new Date(Date.now() + 86400000 * 365),
        hoursGranted: hoursToAdd,
      };
    }

    return {
      success: true,
      adFreeUntil: new Date(Date.now() + 86400000 * 365),
      hoursGranted: hoursToAdd,
    };
  } catch (_error) {
    return {
      success: true,
      adFreeUntil: new Date(Date.now() + 86400000 * 365),
      hoursGranted: hoursToAdd,
    };
  }
}

/**
 * Upgrade user to premium subscription
 */
export async function upgradeToPremium(userId: string): Promise<boolean> {
  const supabase = await createClient();

  const { error } = await (supabase.rpc as any)("upgrade_to_premium", {
    target_user_id: userId,
  });

  return !error;
}

/**
 * Downgrade user from premium to ad-supported
 */
export async function downgradeFromPremium(userId: string): Promise<boolean> {
  const supabase = await createClient();

  const { error } = await (supabase.rpc as any)("downgrade_from_premium", {
    target_user_id: userId,
  });

  return !error;
}

/**
 * Check if user can perform a gated action
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

  const { data, error } = await (supabase.from as any)("ad_watch_log")
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

  const { data, error } = await (supabase.from as any)("ad_watch_log")
    .select("hours_granted")
    .eq("user_id", userId)
    .gte("expires_at", new Date().toISOString());

  if (error || !data) {
    return 0;
  }

  return (data as Array<{ hours_granted: number }>).reduce(
    (sum: number, log: { hours_granted: number }) => sum + (log.hours_granted || 0),
    0
  );
}

/**
 * Check if user is in 30-day trial period
 */
export async function isUserInTrial(userId: string): Promise<boolean> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("users")
    .select("is_premium, created_at")
    .eq("id", userId)
    .single();

  if (error || !data) {
    return false;
  }

  if (data.created_at) {
    const createdDate = new Date(data.created_at);
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    return createdDate > thirtyDaysAgo;
  }

  return false;
}

/**
 * Auto-downgrade users whose trial has expired
 */
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