import type { SupabaseClient } from "@supabase/supabase-js";

import { getUserSubscription } from "@/lib/domain/subscription";
import type { Database, UserRole } from "@/lib/supabase/database.types";

export function canOpenPremiumPrepResources(
  role: UserRole | null | undefined,
  isPremium: boolean,
) {
  return isPremium && (role === "student" || role === "parent");
}

export async function resolvePremiumPrepAccess(
  supabase: SupabaseClient<Database>,
  viewerId: string | undefined,
  role: UserRole | null | undefined,
) {
  if (!viewerId || !role) {
    return { isPremium: false, canOpen: false };
  }

  const subscription = await getUserSubscription(supabase, viewerId);
  return {
    isPremium: subscription.isPremium,
    canOpen: canOpenPremiumPrepResources(role, subscription.isPremium),
  };
}

export async function openPremiumPrepUrl(
  supabase: SupabaseClient<Database>,
  postId: string,
) {
  const { data, error } = await supabase.rpc("get_premium_prep_url", {
    target_post_id: postId,
  });

  if (error) throw error;
  if (!data) throw new Error("Premium prep link could not be resolved.");
  return data as string;
}

export function stripPremiumPrepUrl<T extends { premium_prep_url?: string | null }>(post: T) {
  // eslint-disable-next-line @typescript-eslint/no-unused-vars -- URL must never leave the server boundary
  const { premium_prep_url, ...rest } = post;
  return rest;
}
