import type { SupabaseClient } from "@supabase/supabase-js";

import { isEducationOrganizationType } from "@/lib/domain/education-organization";
import { partitionSponsoredByExpiry, reconcileExpiredSponsors } from "@/lib/domain/sponsor-expiry";
import type { Database } from "@/lib/supabase/database.types";

export type RevenueOpsSnapshot = {
  activePremiumCount: number;
  orgPremiumCount: number;
  individualPremiumCount: number;
  activeSponsorCampaigns: number;
  expiringSponsorsSoon: number;
  pendingBankTransfers: number;
  sponsorsReconciled: number;
};

export function buildRevenueOpsSnapshot(input: {
  subscriptions: Array<{ user_id: string; tier: string; current_period_end: string | null }>;
  usersById: Map<string, { organization_type: string | null }>;
  activeSponsorCampaigns: number;
  expiringSponsorsSoon?: number;
  pendingBankTransfers: number;
  sponsorsReconciled?: number;
  now?: Date;
}): RevenueOpsSnapshot {
  const now = input.now ?? new Date();
  let activePremiumCount = 0;
  let orgPremiumCount = 0;
  let individualPremiumCount = 0;

  for (const sub of input.subscriptions) {
    if (sub.tier !== "zigo_plus") continue;
    if (sub.current_period_end && new Date(sub.current_period_end).getTime() <= now.getTime()) {
      continue;
    }
    activePremiumCount += 1;
    const orgType = input.usersById.get(sub.user_id)?.organization_type ?? null;
    if (isEducationOrganizationType(orgType)) {
      orgPremiumCount += 1;
    } else {
      individualPremiumCount += 1;
    }
  }

  return {
    activePremiumCount,
    orgPremiumCount,
    individualPremiumCount,
    activeSponsorCampaigns: input.activeSponsorCampaigns,
    expiringSponsorsSoon: input.expiringSponsorsSoon ?? 0,
    pendingBankTransfers: input.pendingBankTransfers,
    sponsorsReconciled: input.sponsorsReconciled ?? 0,
  };
}

export async function getRevenueOpsSnapshot(
  supabase: SupabaseClient<Database>,
): Promise<RevenueOpsSnapshot> {
  const now = new Date();
  const reconcile = await reconcileExpiredSponsors(supabase, now).catch(() => ({
    campaignsExpired: 0,
    postsExpired: 0,
  }));

  const [subsResult, sponsorsResult, bankResult] = await Promise.all([
    supabase.from("user_subscriptions").select("user_id, tier, current_period_end").eq("tier", "zigo_plus"),
    supabase
      .from("teacher_campaigns")
      .select("id, sponsored_status, sponsored_expires_at")
      .eq("is_sponsored", true)
      .eq("sponsored_status", "active"),
    supabase
      .from("bank_transfer_requests")
      .select("id", { count: "exact", head: true })
      .eq("status", "pending"),
  ]);

  if (subsResult.error) throw subsResult.error;
  if (sponsorsResult.error) throw sponsorsResult.error;
  if (bankResult.error) throw bankResult.error;

  const partitioned = partitionSponsoredByExpiry(sponsorsResult.data ?? [], now);

  // Defensive: if reconcile failed or races left stale rows, count only open windows.
  const activeSponsorCampaigns = partitioned.active.length;
  const expiringSponsorsSoon = partitioned.expiringSoon.length;

  const subs = subsResult.data ?? [];
  const userIds = subs.map((row) => row.user_id);
  const usersById = new Map<string, { organization_type: string | null }>();

  if (userIds.length > 0) {
    const { data: users, error: usersError } = await supabase
      .from("users")
      .select("id, organization_type")
      .in("id", userIds);
    if (usersError) throw usersError;
    for (const user of users ?? []) {
      usersById.set(user.id, { organization_type: user.organization_type });
    }
  }

  return buildRevenueOpsSnapshot({
    subscriptions: subs,
    usersById,
    activeSponsorCampaigns,
    expiringSponsorsSoon,
    pendingBankTransfers: bankResult.count ?? 0,
    sponsorsReconciled: reconcile.campaignsExpired + reconcile.postsExpired,
    now,
  });
}
