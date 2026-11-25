import type { SupabaseClient } from "@supabase/supabase-js";

import type { Database } from "@/lib/supabase/database.types";
import { untypedFrom } from "@/lib/supabase/untyped-tables";

export type CohortRetentionMetrics = {
  d1Eligible: number;
  d1Retained: number;
  d1Rate: number;
  d7Eligible: number;
  d7Retained: number;
  d7Rate: number;
  d30Eligible: number;
  d30Retained: number;
  d30Rate: number;
};

export type TrialConversionSegment = {
  totalUsers: number;
  paidUsers: number;
  inTrialUsers: number;
  conversionRate: number;
};

export type NorthStarMetricsSnapshot = {
  generatedAt: string;
  // 1. Engagement (DAU / WAU / MAU)
  totalUsers: number;
  dau: number;
  wau: number;
  mau: number;
  dauMauRatio: number; // %
  // 2. Retention Cohorts
  retention: CohortRetentionMetrics;
  // 3. Trial -> Paid Conversion
  teacherConversion: TrialConversionSegment;
  learnerConversion: TrialConversionSegment;
  overallConversionRate: number;
  // 4. SaaS Revenue (MRR / ARR / ARPU / Churn)
  activePaidCount: number;
  mrrTry: number;
  arrTry: number;
  arpuTry: number;
  churned30d: number;
  monthlyChurnRate: number;
  // 5. Unit Economics (Infra + AI + Storage vs ARPU)
  totalStorageMb: number;
  estimatedMonthlyCostPerActiveUserTry: number;
  estimatedTotalMonthlyInfraTry: number;
  estimatedGrossMarginPercent: number;
  // Supply-side health
  verifiedTeachersCount: number;
  weeklyPostsCount: number;
};

export type RawInvestorData = {
  now?: Date;
  users: Array<{
    id: string;
    role: string;
    is_premium?: boolean | null;
    is_verified?: boolean | null;
    created_at: string;
    last_active_at?: string | null;
  }>;
  subscriptions: Array<{
    user_id: string;
    plan_id?: string | null;
    status?: string | null;
    current_period_end?: string | null;
    updated_at?: string | null;
    price_try?: number | null;
  }>;
  recentActivityUserIds24h: string[];
  recentActivityUserIds7d: string[];
  recentActivityUserIds30d: string[];
  totalStorageBytes: number;
  weeklyPostsCount: number;
};

const DAY_MS = 24 * 60 * 60 * 1000;

function estimatePlanMonthlyRevenueTry(planId?: string | null, explicitPrice?: number | null): number {
  if (typeof explicitPrice === "number" && explicitPrice > 0) {
    const isYearly = Boolean(planId?.includes("year"));
    return isYearly ? explicitPrice / 12 : explicitPrice;
  }
  const id = (planId ?? "").toLowerCase();
  if (id.includes("institution")) return id.includes("year") ? 14900 / 12 : 1490;
  if (id.includes("platform") || id.includes("publisher")) return id.includes("year") ? 9900 / 12 : 990;
  if (id.includes("teacher")) return id.includes("year") ? 1190 / 12 : 149;
  if (id.includes("student") || id.includes("parent")) return id.includes("year") ? 690 / 12 : 79;
  return 79;
}

function safePercent(num: number, den: number): number {
  if (den <= 0) return 0;
  return Math.round((num / den) * 1000) / 10;
}

/**
 * Pure computation of Angel Investor / SaaS North Star metrics from raw DB rows.
 */
export function computeNorthStarMetrics(input: RawInvestorData): NorthStarMetricsSnapshot {
  const now = input.now ?? new Date();
  const nowMs = now.getTime();

  const active24h = new Set(input.recentActivityUserIds24h);
  const active7d = new Set(input.recentActivityUserIds7d);
  const active30d = new Set(input.recentActivityUserIds30d);

  // Also include users whose last_active_at falls in each window
  for (const user of input.users) {
    const lastMs = user.last_active_at ? new Date(user.last_active_at).getTime() : NaN;
    if (!Number.isFinite(lastMs)) continue;
    const ageMs = nowMs - lastMs;
    if (ageMs <= DAY_MS) active24h.add(user.id);
    if (ageMs <= 7 * DAY_MS) active7d.add(user.id);
    if (ageMs <= 30 * DAY_MS) active30d.add(user.id);
  }

  const dau = active24h.size;
  const wau = active7d.size;
  const mau = Math.max(active30d.size, wau, dau);
  const dauMauRatio = safePercent(dau, mau);

  // Cohort retention (D1 / D7 / D30)
  let d1Eligible = 0;
  let d1Retained = 0;
  let d7Eligible = 0;
  let d7Retained = 0;
  let d30Eligible = 0;
  let d30Retained = 0;

  let verifiedTeachersCount = 0;

  // Paid subscription set
  const activeSubByUser = new Map<string, RawInvestorData["subscriptions"][number]>();
  let churned30d = 0;

  for (const sub of input.subscriptions) {
    const endMs = sub.current_period_end ? new Date(sub.current_period_end).getTime() : null;
    const isActive =
      (sub.status === "active" || sub.status === "trialing" || !sub.status) &&
      (endMs === null || endMs > nowMs);

    if (isActive) {
      activeSubByUser.set(sub.user_id, sub);
    } else if (endMs !== null && endMs <= nowMs && nowMs - endMs <= 30 * DAY_MS) {
      churned30d += 1;
    }
  }

  let teacherTotal = 0;
  let teacherPaid = 0;
  let teacherInTrial = 0;
  let learnerTotal = 0;
  let learnerPaid = 0;
  let learnerInTrial = 0;

  for (const user of input.users) {
    const createdMs = new Date(user.created_at).getTime();
    if (!Number.isFinite(createdMs)) continue;
    const ageDays = (nowMs - createdMs) / DAY_MS;

    const lastMs = user.last_active_at ? new Date(user.last_active_at).getTime() : NaN;
    const stayedAfterDays = Number.isFinite(lastMs) ? (lastMs - createdMs) / DAY_MS : 0;

    if (ageDays >= 1) {
      d1Eligible += 1;
      if (stayedAfterDays >= 1 || active24h.has(user.id)) d1Retained += 1;
    }
    if (ageDays >= 7) {
      d7Eligible += 1;
      if (stayedAfterDays >= 7 || active7d.has(user.id)) d7Retained += 1;
    }
    if (ageDays >= 30) {
      d30Eligible += 1;
      if (stayedAfterDays >= 30 || active30d.has(user.id)) d30Retained += 1;
    }

    const isPaid = Boolean(user.is_premium || activeSubByUser.has(user.id));

    if (user.role === "teacher") {
      teacherTotal += 1;
      if (user.is_verified) verifiedTeachersCount += 1;
      if (isPaid) teacherPaid += 1;
      else if (ageDays <= 30) teacherInTrial += 1;
    } else if (user.role === "student" || user.role === "parent") {
      learnerTotal += 1;
      if (isPaid) learnerPaid += 1;
      else if (ageDays <= 7) learnerInTrial += 1;
    }
  }

  // Revenue calculations
  const paidUserIds = new Set<string>(activeSubByUser.keys());
  for (const user of input.users) {
    if (user.is_premium) paidUserIds.add(user.id);
  }

  let mrrTry = 0;
  for (const uid of paidUserIds) {
    const sub = activeSubByUser.get(uid);
    if (sub) {
      mrrTry += estimatePlanMonthlyRevenueTry(sub.plan_id, sub.price_try);
    } else {
      const u = input.users.find((x) => x.id === uid);
      if (u?.role === "teacher") mrrTry += 149;
      else if (u?.role === "education_institution") mrrTry += 1490;
      else if (u?.role === "education_platform" || u?.role === "publisher") mrrTry += 990;
      else mrrTry += 79;
    }
  }
  mrrTry = Math.round(mrrTry);
  const arrTry = mrrTry * 12;
  const activePaidCount = paidUserIds.size;
  const arpuTry = activePaidCount > 0 ? Math.round((mrrTry / activePaidCount) * 10) / 10 : 0;
  const monthlyChurnRate = safePercent(churned30d, activePaidCount + churned30d);

  // Unit Economics (AI + Storage + Hosting estimate in TRY)
  // With long videos offloaded to YouTube/Vimeo and rate-limited AI quotas:
  // ~4.5 TRY/month blended AI + bandwidth + DB cost per MAU + ~1.5 TRY/GB storage
  const totalStorageMb = Math.round((input.totalStorageBytes / (1024 * 1024)) * 10) / 10;
  const storageCostTry = (totalStorageMb / 1024) * 1.5;
  const activeVariableCostTry = mau * 4.5 + storageCostTry;
  const estimatedTotalMonthlyInfraTry = Math.round(activeVariableCostTry);
  const estimatedMonthlyCostPerActiveUserTry =
    mau > 0 ? Math.round((activeVariableCostTry / mau) * 100) / 100 : 0;

  // Net revenue after blended ~20% store fee / tax reserve vs infra
  const netRevenueTry = mrrTry * 0.8;
  const estimatedGrossMarginPercent =
    netRevenueTry > 0
      ? Math.max(0, Math.round(((netRevenueTry - activeVariableCostTry) / netRevenueTry) * 1000) / 10)
      : 0;

  const totalEligibleForConversion = teacherTotal + learnerTotal;
  const totalConverted = teacherPaid + learnerPaid;

  return {
    generatedAt: now.toISOString(),
    totalUsers: input.users.length,
    dau,
    wau,
    mau,
    dauMauRatio,
    retention: {
      d1Eligible,
      d1Retained,
      d1Rate: safePercent(d1Retained, d1Eligible),
      d7Eligible,
      d7Retained,
      d7Rate: safePercent(d7Retained, d7Eligible),
      d30Eligible,
      d30Retained,
      d30Rate: safePercent(d30Retained, d30Eligible),
    },
    teacherConversion: {
      totalUsers: teacherTotal,
      paidUsers: teacherPaid,
      inTrialUsers: teacherInTrial,
      conversionRate: safePercent(teacherPaid, teacherTotal),
    },
    learnerConversion: {
      totalUsers: learnerTotal,
      paidUsers: learnerPaid,
      inTrialUsers: learnerInTrial,
      conversionRate: safePercent(learnerPaid, learnerTotal),
    },
    overallConversionRate: safePercent(totalConverted, totalEligibleForConversion),
    activePaidCount,
    mrrTry,
    arrTry,
    arpuTry,
    churned30d,
    monthlyChurnRate,
    totalStorageMb,
    estimatedMonthlyCostPerActiveUserTry,
    estimatedTotalMonthlyInfraTry,
    estimatedGrossMarginPercent,
    verifiedTeachersCount,
    weeklyPostsCount: input.weeklyPostsCount,
  };
}

/**
 * Queries live Supabase data (admin/metrics client) and builds the North Star snapshot.
 */
export async function getNorthStarMetrics(
  supabase: SupabaseClient<Database>,
): Promise<NorthStarMetricsSnapshot> {
  const now = new Date();
  const since24h = new Date(now.getTime() - DAY_MS).toISOString();
  const since7d = new Date(now.getTime() - 7 * DAY_MS).toISOString();
  const since30d = new Date(now.getTime() - 30 * DAY_MS).toISOString();

  const [usersRes, subsRes, posts30dRes, mediaRes] = await Promise.all([
    supabase
      .from("users")
      .select("id, role, is_premium, is_verified, created_at")
      .limit(10000),
    untypedFrom(supabase, "user_subscriptions")
      .select("user_id, plan_id, status, current_period_end, updated_at")
      .limit(5000),
    supabase
      .from("social_posts")
      .select("author_id, created_at")
      .gte("created_at", since30d)
      .limit(5000),
    untypedFrom(supabase, "media_uploads")
      .select("byte_size")
      .is("deleted_at", null)
      .limit(5000),
  ]);

  const users = (usersRes.data ?? []) as RawInvestorData["users"];
  const subscriptions = (subsRes.data ?? []) as RawInvestorData["subscriptions"];
  const posts30d = (posts30dRes.data ?? []) as Array<{ author_id: string; created_at: string }>;
  const mediaRows = (mediaRes.data ?? []) as Array<{ byte_size?: number | null }>;

  const active24h: string[] = [];
  const active7d: string[] = [];
  const active30d: string[] = [];
  let weeklyPostsCount = 0;

  for (const post of posts30d) {
    active30d.push(post.author_id);
    if (post.created_at >= since7d) {
      active7d.push(post.author_id);
      weeklyPostsCount += 1;
    }
    if (post.created_at >= since24h) {
      active24h.push(post.author_id);
    }
  }

  // Also treat recently signed-up users as active in their signup window
  for (const user of users) {
    if (user.created_at >= since30d) active30d.push(user.id);
    if (user.created_at >= since7d) active7d.push(user.id);
    if (user.created_at >= since24h) active24h.push(user.id);
  }

  const totalStorageBytes = mediaRows.reduce((sum, row) => sum + (Number(row.byte_size) || 0), 0);

  return computeNorthStarMetrics({
    now,
    users,
    subscriptions,
    recentActivityUserIds24h: active24h,
    recentActivityUserIds7d: active7d,
    recentActivityUserIds30d: active30d,
    totalStorageBytes,
    weeklyPostsCount,
  });
}
