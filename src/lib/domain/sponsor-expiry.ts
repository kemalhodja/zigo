import type { SupabaseClient } from "@supabase/supabase-js";

import type { Database } from "@/lib/supabase/database.types";

export const SPONSOR_EXPIRING_SOON_DAYS = 3;

export type SponsoredExpiryRow = {
  id: string;
  sponsored_status: "active" | "paused" | "expired" | null;
  sponsored_expires_at: string | null;
};

export function isSponsoredExpiryOpen(expiresAt: string | null | undefined, now = new Date()) {
  if (!expiresAt) return true;
  return new Date(expiresAt).getTime() > now.getTime();
}

export function isSponsoredExpiringSoon(
  expiresAt: string | null | undefined,
  now = new Date(),
  withinDays = SPONSOR_EXPIRING_SOON_DAYS,
) {
  if (!expiresAt) return false;
  const end = new Date(expiresAt).getTime();
  const nowMs = now.getTime();
  if (end <= nowMs) return false;
  return end <= nowMs + withinDays * 24 * 60 * 60 * 1000;
}

export function partitionSponsoredByExpiry<T extends SponsoredExpiryRow>(rows: T[], now = new Date()) {
  const active: T[] = [];
  const expired: T[] = [];
  const expiringSoon: T[] = [];

  for (const row of rows) {
    if (row.sponsored_status !== "active") continue;
    if (!isSponsoredExpiryOpen(row.sponsored_expires_at, now)) {
      expired.push(row);
      continue;
    }
    active.push(row);
    if (isSponsoredExpiringSoon(row.sponsored_expires_at, now)) {
      expiringSoon.push(row);
    }
  }

  return { active, expired, expiringSoon };
}

export type SponsorExpiryReconcileResult = {
  campaignsExpired: number;
  postsExpired: number;
};

type AdminClient = SupabaseClient<Database>;

export async function reconcileExpiredSponsors(
  supabase: AdminClient,
  now = new Date(),
): Promise<SponsorExpiryReconcileResult> {
  const iso = now.toISOString();

  const [campaignsResult, postsResult] = await Promise.all([
    supabase
      .from("teacher_campaigns")
      .update({
        sponsored_status: "expired",
        is_sponsored: false,
      })
      .eq("sponsored_status", "active")
      .not("sponsored_expires_at", "is", null)
      .lte("sponsored_expires_at", iso)
      .select("id"),
    supabase
      .from("social_posts")
      .update({
        sponsored_status: "expired",
      })
      .eq("sponsored_status", "active")
      .not("sponsored_expires_at", "is", null)
      .lte("sponsored_expires_at", iso)
      .select("id"),
  ]);

  if (campaignsResult.error) throw campaignsResult.error;
  if (postsResult.error) throw postsResult.error;

  return {
    campaignsExpired: campaignsResult.data?.length ?? 0,
    postsExpired: postsResult.data?.length ?? 0,
  };
}
