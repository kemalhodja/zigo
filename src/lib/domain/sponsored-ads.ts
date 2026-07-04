import type { SupabaseClient } from "@supabase/supabase-js";

import type { Database, SocialPostRow } from "@/lib/supabase/database.types";

export type SponsoredAdStatus = "active" | "paused" | "expired";

export type TeacherSponsoredAdSummary = {
  post_id: string;
  caption: string;
  sponsored_label: string | null;
  sponsored_status: SponsoredAdStatus | null;
  sponsored_expires_at: string | null;
  sponsored_click_count: number;
  created_at: string;
};

export function isSponsoredAdConfigured(
  post: Pick<SocialPostRow, "sponsored_label" | "sponsored_target_url">,
) {
  return Boolean(post.sponsored_label && post.sponsored_target_url);
}

export function isSponsoredAdActive(
  post: Pick<
    SocialPostRow,
    "sponsored_label" | "sponsored_target_url" | "sponsored_status" | "sponsored_expires_at"
  >,
) {
  if (!isSponsoredAdConfigured(post)) return false;
  if (post.sponsored_status !== "active") return false;
  if (!post.sponsored_expires_at) return true;
  return new Date(post.sponsored_expires_at).getTime() > Date.now();
}

export function canViewerOpenSponsoredAd(viewerId: string | undefined, post: SocialPostRow) {
  return Boolean(viewerId && isSponsoredAdActive(post));
}

export async function openSponsoredAdUrl(
  supabase: SupabaseClient<Database>,
  postId: string,
) {
  const { data, error } = await supabase.rpc("get_sponsored_ad_url", {
    target_post_id: postId,
  });

  if (error) throw error;
  if (!data) throw new Error("Sponsored ad link could not be resolved.");
  return data as string;
}

export async function listTeacherSponsoredAds(
  supabase: SupabaseClient<Database>,
  limit = 20,
) {
  const { data, error } = await supabase.rpc("list_teacher_sponsored_ads", {
    limit_count: limit,
  });

  if (error) throw error;
  return (data ?? []) as TeacherSponsoredAdSummary[];
}
