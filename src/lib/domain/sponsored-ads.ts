import type { SupabaseClient } from "@supabase/supabase-js";

import type { Database, SocialPostRow } from "@/lib/supabase/database.types";

export type SponsoredAdStatus = "active" | "paused" | "expired" | "pending" | "rejected";

export type TeacherSponsoredAdSummary = {
  post_id: string;
  caption: string;
  sponsored_label: string | null;
  sponsored_status: SponsoredAdStatus | null;
  sponsored_expires_at: string | null;
  sponsored_click_count: number;
  sponsored_view_count?: number;
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

/** Click-through rate from campaign/post counters. */
export function computeSponsoredCtr(clicks: number, views: number) {
  const safeClicks = Math.max(0, clicks);
  const safeViews = Math.max(0, views);
  if (safeViews <= 0) return 0;
  return safeClicks / safeViews;
}

export function formatSponsoredCtr(clicks: number, views: number, locale = "tr-TR") {
  const ctr = computeSponsoredCtr(clicks, views);
  return new Intl.NumberFormat(locale, {
    style: "percent",
    maximumFractionDigits: 1,
    minimumFractionDigits: 0,
  }).format(ctr);
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
  teacherId: string,
  limit = 20,
) {
  const safeLimit = Math.min(50, Math.max(1, limit));

  const { data, error } = await supabase.rpc("list_teacher_sponsored_ads", {
    limit_count: safeLimit,
  });

  if (!error) {
    return (data ?? []) as TeacherSponsoredAdSummary[];
  }

  // Fallback when RPC is missing or outdated on the remote schema.
  const basic = await supabase
    .from("social_posts")
    .select(
      "id, caption, sponsored_label, sponsored_status, sponsored_expires_at, sponsored_click_count, created_at, sponsored_target_url",
    )
    .eq("author_id", teacherId)
    .not("sponsored_label", "is", null)
    .not("sponsored_target_url", "is", null)
    .order("created_at", { ascending: false })
    .limit(safeLimit);

  if (basic.error) throw error;
  return (basic.data ?? []).map((row) => ({
    post_id: row.id,
    caption: row.caption,
    sponsored_label: row.sponsored_label,
    sponsored_status: row.sponsored_status,
    sponsored_expires_at: row.sponsored_expires_at,
    sponsored_click_count: row.sponsored_click_count,
    created_at: row.created_at,
  })) as TeacherSponsoredAdSummary[];
}
