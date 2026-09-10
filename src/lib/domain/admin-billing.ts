import type { SupabaseClient } from "@supabase/supabase-js";

// ─── Aktif Abonelikler ────────────────────────────────────────────────────────

export type ActiveSubscription = {
  id: string;
  userId: string;
  userFullName: string;
  userEmail: string;
  userRole: string;
  planId: string;
  status: string;
  trialEndsAt: string | null;
  currentPeriodEnd: string | null;
  createdAt: string;
  source: "stripe" | "bank_transfer" | "admin_grant" | "google_play" | "unknown";
  daysUntilExpiry: number | null;
};

export async function getActiveSubscriptions(
  supabase: SupabaseClient,
  limit = 100,
): Promise<ActiveSubscription[]> {
  const { data, error } = await supabase
    .from("user_subscriptions")
    .select(`
      id,
      user_id,
      plan_id,
      status,
      trial_ends_at,
      current_period_end,
      created_at,
      users!inner(id, full_name, email, role)
    `)
    .in("status", ["active", "trialing"])
    .order("created_at", { ascending: false })
    .limit(limit);

  if (error || !data) return [];

  return data.map((row) => {
    const user = Array.isArray(row.users) ? row.users[0] : row.users;
    const expiryDate = row.current_period_end ?? row.trial_ends_at;
    const daysUntilExpiry = expiryDate
      ? Math.ceil((new Date(expiryDate).getTime() - Date.now()) / 86400000)
      : null;

    // kaynak tespiti
    let source: ActiveSubscription["source"] = "unknown";
    if (row.plan_id?.startsWith("stripe_")) source = "stripe";
    else if (row.plan_id?.startsWith("bank_")) source = "bank_transfer";
    else if (row.plan_id?.startsWith("admin_")) source = "admin_grant";
    else if (row.plan_id?.startsWith("google_")) source = "google_play";

    return {
      id: row.id,
      userId: row.user_id,
      userFullName: (user as { full_name?: string })?.full_name ?? "—",
      userEmail: (user as { email?: string })?.email ?? "—",
      userRole: (user as { role?: string })?.role ?? "—",
      planId: row.plan_id ?? "—",
      status: row.status,
      trialEndsAt: row.trial_ends_at ?? null,
      currentPeriodEnd: row.current_period_end ?? null,
      createdAt: row.created_at,
      source,
      daysUntilExpiry,
    };
  });
}

// ─── MRR / ARR Hesaplama ─────────────────────────────────────────────────────

export type RevenueKpi = {
  activeSubscriberCount: number;
  trialCount: number;
  mrr: number;        // Aylık yinelenen gelir (TL)
  arr: number;        // Yıllık tahmin (TL)
  expiringIn7Days: number;
  expiringIn30Days: number;
  churnedLast7Days: number;
  churnedLast30Days: number;
};

const MONTHLY_PRICE_TRY = 79;  // Zigo Plus standart fiyat

export async function getRevenueKpi(supabase: SupabaseClient): Promise<RevenueKpi> {
  const now = new Date().toISOString();
  const in7Days = new Date(Date.now() + 7 * 86400000).toISOString();
  const in30Days = new Date(Date.now() + 30 * 86400000).toISOString();
  const ago7Days = new Date(Date.now() - 7 * 86400000).toISOString();
  const ago30Days = new Date(Date.now() - 30 * 86400000).toISOString();

  const [activeRes, trialRes, expiring7Res, expiring30Res, churned7Res, churned30Res] =
    await Promise.allSettled([
      supabase
        .from("user_subscriptions")
        .select("id", { count: "exact", head: true })
        .eq("status", "active"),
      supabase
        .from("user_subscriptions")
        .select("id", { count: "exact", head: true })
        .eq("status", "trialing"),
      supabase
        .from("user_subscriptions")
        .select("id", { count: "exact", head: true })
        .eq("status", "active")
        .gte("current_period_end", now)
        .lte("current_period_end", in7Days),
      supabase
        .from("user_subscriptions")
        .select("id", { count: "exact", head: true })
        .eq("status", "active")
        .gte("current_period_end", now)
        .lte("current_period_end", in30Days),
      supabase
        .from("user_subscriptions")
        .select("id", { count: "exact", head: true })
        .eq("status", "canceled")
        .gte("updated_at", ago7Days),
      supabase
        .from("user_subscriptions")
        .select("id", { count: "exact", head: true })
        .eq("status", "canceled")
        .gte("updated_at", ago30Days),
    ]);

  const activeCount = activeRes.status === "fulfilled" ? (activeRes.value.count ?? 0) : 0;
  const trialCount = trialRes.status === "fulfilled" ? (trialRes.value.count ?? 0) : 0;
  const expiring7 = expiring7Res.status === "fulfilled" ? (expiring7Res.value.count ?? 0) : 0;
  const expiring30 = expiring30Res.status === "fulfilled" ? (expiring30Res.value.count ?? 0) : 0;
  const churned7 = churned7Res.status === "fulfilled" ? (churned7Res.value.count ?? 0) : 0;
  const churned30 = churned30Res.status === "fulfilled" ? (churned30Res.value.count ?? 0) : 0;

  const mrr = activeCount * MONTHLY_PRICE_TRY;

  return {
    activeSubscriberCount: activeCount,
    trialCount,
    mrr,
    arr: mrr * 12,
    expiringIn7Days: expiring7,
    expiringIn30Days: expiring30,
    churnedLast7Days: churned7,
    churnedLast30Days: churned30,
  };
}

// ─── Churn Listesi ─────────────────────────────────────────────────────────────

export type ChurnedUser = {
  userId: string;
  userFullName: string;
  userEmail: string;
  canceledAt: string;
  planId: string;
  daysActive: number;
};

export async function getRecentChurns(
  supabase: SupabaseClient,
  sinceDays = 30,
  limit = 50,
): Promise<ChurnedUser[]> {
  const since = new Date(Date.now() - sinceDays * 86400000).toISOString();

  const { data, error } = await supabase
    .from("user_subscriptions")
    .select(`
      user_id,
      plan_id,
      updated_at,
      created_at,
      users!inner(full_name, email)
    `)
    .eq("status", "canceled")
    .gte("updated_at", since)
    .order("updated_at", { ascending: false })
    .limit(limit);

  if (error || !data) return [];

  return data.map((row) => {
    const user = Array.isArray(row.users) ? row.users[0] : row.users;
    const daysActive = Math.ceil(
      (new Date(row.updated_at).getTime() - new Date(row.created_at).getTime()) / 86400000,
    );
    return {
      userId: row.user_id,
      userFullName: (user as { full_name?: string })?.full_name ?? "—",
      userEmail: (user as { email?: string })?.email ?? "—",
      canceledAt: row.updated_at,
      planId: row.plan_id ?? "—",
      daysActive,
    };
  });
}
