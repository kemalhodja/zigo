import type { SupabaseClient } from "@supabase/supabase-js";

import type { Database } from "@/lib/supabase/database.types";

export type SponsorExpiryReconcileResult = {
  campaignsExpired: number;
  postsExpired: number;
};

export function isSponsoredExpiryOpen(expiryIso: string | null, now: Date = new Date()): boolean {
  if (!expiryIso) return true;
  return new Date(expiryIso).getTime() > now.getTime();
}

export function isSponsoredExpiringSoon(expiryIso: string | null, now: Date = new Date(), windowHours = 48): boolean {
  if (!expiryIso) return false;
  const expiryTime = new Date(expiryIso).getTime();
  const nowTime = now.getTime();
  const diffHours = (expiryTime - nowTime) / (1000 * 3600);
  return diffHours > 0 && diffHours <= windowHours;
}

export function partitionSponsoredByExpiry<T extends { sponsored_status?: string | null; sponsored_expires_at?: string | null }>(
  items: T[],
  now: Date = new Date()
) {
  const active: T[] = [];
  const expired: T[] = [];
  const expiringSoon: T[] = [];

  for (const item of items) {
    if (item.sponsored_status && item.sponsored_status !== "active") {
      continue;
    }
    const iso = item.sponsored_expires_at ?? null;
    if (isSponsoredExpiryOpen(iso, now)) {
      active.push(item);
      if (isSponsoredExpiringSoon(iso, now)) {
        expiringSoon.push(item);
      }
    } else {
      expired.push(item);
    }
  }

  return { active, expired, expiringSoon };
}

export async function reconcileExpiredSponsorBoosts(
  supabase: SupabaseClient<Database>,
  now: Date = new Date(),
): Promise<SponsorExpiryReconcileResult> {
  const iso = now.toISOString();

  type QueryResult = { data: unknown[] | null; error: Error | null };

  const [campaignsResult, postsResult] = await Promise.all([
    (supabase as unknown as {
      from: (table: string) => {
        update: (data: Record<string, unknown>) => {
          eq: (col: string, val: string) => {
            not: (col: string, op: string, val: null) => {
              lte: (col: string, val: string) => {
                select: (cols: string) => Promise<QueryResult>;
              };
            };
          };
        };
      };
    })
      .from("teacher_campaigns")
      .update({
        sponsored_status: "expired",
        is_sponsored: false,
      })
      .eq("sponsored_status", "active")
      .not("sponsored_expires_at", "is", null)
      .lte("sponsored_expires_at", iso)
      .select("id"),
    (supabase
      .from("social_posts")
      .update({
        sponsored_status: "expired",
      })
      .eq("sponsored_status", "active")
      .not("sponsored_expires_at", "is", null)
      .lte("sponsored_expires_at", iso)
      .select("id") as unknown as Promise<QueryResult>),
  ]);

  if (campaignsResult.error) throw campaignsResult.error;
  if (postsResult.error) throw postsResult.error;

  return {
    campaignsExpired: campaignsResult.data?.length ?? 0,
    postsExpired: postsResult.data?.length ?? 0,
  };
}

export const reconcileExpiredSponsors = reconcileExpiredSponsorBoosts;
