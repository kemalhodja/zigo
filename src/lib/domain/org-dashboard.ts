import type { SupabaseClient } from "@supabase/supabase-js";

import {
  getOrganizationOption,
  resolveOrganizationBillingTier,
  type EducationOrganizationBillingTier,
  type EducationOrganizationType,
} from "@/lib/domain/education-organization";
import { getEducationAreas, getUserInterestAreaIds } from "@/lib/domain/profiles";
import { isSponsoredExpiryOpen } from "@/lib/domain/sponsor-expiry";
import { countFollowers, countUserPosts } from "@/lib/domain/social/helpers";
import type { Database } from "@/lib/supabase/database.types";

export type OrgDashboardSnapshot = {
  organizationType: EducationOrganizationType;
  organizationLabel: string;
  billingTier: EducationOrganizationBillingTier;
  assignedAreaCount: number;
  assignedAreaNames: string[];
  postsTotal: number;
  postsLast7Days: number;
  followers: number;
  activeSponsoredCount: number;
  openQuestionsInAreas: number;
};

export type OrgDashboardMetricId =
  | "postsLast7Days"
  | "postsTotal"
  | "followers"
  | "assignedAreas"
  | "activeSponsored"
  | "openQuestions";

export function resolveOrgDashboardFocus(billingTier: EducationOrganizationBillingTier) {
  return billingTier;
}

export function buildOrgDashboardSnapshot(input: {
  organizationType: EducationOrganizationType;
  assignedAreaNames: string[];
  postsTotal: number;
  postsLast7Days: number;
  followers: number;
  activeSponsoredCount: number;
  openQuestionsInAreas: number;
}): OrgDashboardSnapshot | null {
  const option = getOrganizationOption(input.organizationType);
  const billingTier = resolveOrganizationBillingTier(input.organizationType);
  if (!option || !billingTier) return null;

  return {
    organizationType: input.organizationType,
    organizationLabel: option.label,
    billingTier,
    assignedAreaCount: input.assignedAreaNames.length,
    assignedAreaNames: input.assignedAreaNames,
    postsTotal: input.postsTotal,
    postsLast7Days: input.postsLast7Days,
    followers: input.followers,
    activeSponsoredCount: input.activeSponsoredCount,
    openQuestionsInAreas: input.openQuestionsInAreas,
  };
}

export function listOrgDashboardMetricIds(
  billingTier: EducationOrganizationBillingTier,
): OrgDashboardMetricId[] {
  if (billingTier === "publisher") {
    return ["postsLast7Days", "postsTotal", "followers", "assignedAreas", "activeSponsored"];
  }
  if (billingTier === "platform") {
    return ["postsLast7Days", "postsTotal", "followers", "assignedAreas", "openQuestions"];
  }
  return ["postsLast7Days", "followers", "assignedAreas", "openQuestions", "activeSponsored"];
}

function windowStartIso(sinceDays: number) {
  const start = new Date();
  start.setUTCDate(start.getUTCDate() - sinceDays);
  return start.toISOString();
}

export async function getOrgDashboardSnapshot(
  supabase: SupabaseClient<Database>,
  userId: string,
  organizationType: EducationOrganizationType,
  options?: { sinceDays?: number },
): Promise<OrgDashboardSnapshot | null> {
  const sinceDays = options?.sinceDays ?? 7;
  const sinceIso = windowStartIso(sinceDays);

  const [areaIds, allAreas, postsTotal, followers, recentPostsResult, sponsoredResult] = await Promise.all([
    getUserInterestAreaIds(supabase, userId),
    getEducationAreas(supabase),
    countUserPosts(supabase, userId),
    countFollowers(supabase, userId),
    supabase
      .from("social_posts")
      .select("id")
      .eq("author_id", userId)
      .gte("created_at", sinceIso),
    supabase
      .from("social_posts")
      .select("id, sponsored_expires_at")
      .eq("author_id", userId)
      .eq("sponsored_status", "active"),
  ]);

  if (recentPostsResult.error) throw recentPostsResult.error;
  if (sponsoredResult.error) throw sponsoredResult.error;

  const assignedAreaNames = allAreas
    .filter((area) => areaIds.includes(area.id))
    .map((area) => area.area_name);

  let openQuestionsInAreas = 0;

  if (areaIds.length > 0) {
    const { count, error } = await supabase
      .from("questions")
      .select("id", { count: "exact", head: true })
      .in("area_id", areaIds)
      .eq("is_resolved", false);

    if (error) throw error;
    openQuestionsInAreas = count ?? 0;
  }

  const now = new Date();
  const activeSponsoredCount = (sponsoredResult.data ?? []).filter((post) =>
    isSponsoredExpiryOpen(post.sponsored_expires_at, now),
  ).length;

  return buildOrgDashboardSnapshot({
    organizationType,
    assignedAreaNames,
    postsTotal,
    postsLast7Days: recentPostsResult.data?.length ?? 0,
    followers,
    activeSponsoredCount,
    openQuestionsInAreas,
  });
}
