import type { SupabaseClient } from "@supabase/supabase-js";

// ─── Kullanıcı Büyüme ──────────────────────────────────────────────────────

export type DailySignupPoint = {
  date: string;
  count: number;
  students: number;
  teachers: number;
  parents: number;
  others: number;
};

export async function getDailySignups(
  supabase: SupabaseClient,
  sinceDays = 30,
): Promise<DailySignupPoint[]> {
  const since = new Date();
  since.setDate(since.getDate() - sinceDays);

  const { data, error } = await supabase
    .from("users")
    .select("created_at, role")
    .gte("created_at", since.toISOString())
    .order("created_at", { ascending: true });

  if (error || !data) return [];

  const byDate: Record<string, DailySignupPoint> = {};

  for (const row of data) {
    const date = row.created_at.slice(0, 10);
    if (!byDate[date]) {
      byDate[date] = { date, count: 0, students: 0, teachers: 0, parents: 0, others: 0 };
    }
    byDate[date].count++;
    if (row.role === "student") byDate[date].students++;
    else if (row.role === "teacher") byDate[date].teachers++;
    else if (row.role === "parent") byDate[date].parents++;
    else byDate[date].others++;
  }

  return Object.values(byDate).sort((a, b) => a.date.localeCompare(b.date));
}

// ─── Rol Dağılımı ────────────────────────────────────────────────────────────

export type RoleDistributionPoint = {
  role: string;
  label: string;
  count: number;
};

export async function getRoleDistribution(
  supabase: SupabaseClient,
): Promise<RoleDistributionPoint[]> {
  const { data, error } = await supabase
    .from("users")
    .select("role");

  if (error || !data) return [];

  const roleLabels: Record<string, string> = {
    student: "Öğrenci",
    teacher: "Öğretmen",
    parent: "Veli",
    education_institution: "Kurum",
    education_platform: "Platform",
    publisher: "Yayınevi",
  };

  const counts: Record<string, number> = {};
  for (const row of data) {
    counts[row.role] = (counts[row.role] ?? 0) + 1;
  }

  return Object.entries(counts).map(([role, count]) => ({
    role,
    label: roleLabels[role] ?? role,
    count,
  })).sort((a, b) => b.count - a.count);
}

// ─── Cohort Retention ────────────────────────────────────────────────────────

export type CohortWeek = {
  week: string; // "W1", "W2" vs.
  cohortSize: number;
  day7: number;
  day14: number;
  day30: number;
  day7Pct: number;
  day14Pct: number;
  day30Pct: number;
};

export async function getCohortRetention(
  supabase: SupabaseClient,
  weeksBack = 6,
): Promise<CohortWeek[]> {
  const results: CohortWeek[] = [];

  for (let w = weeksBack; w >= 1; w--) {
    const cohortStart = new Date();
    cohortStart.setDate(cohortStart.getDate() - w * 7 - 7);
    const cohortEnd = new Date();
    cohortEnd.setDate(cohortEnd.getDate() - w * 7);

    const { data: cohortUsers } = await supabase
      .from("users")
      .select("id, created_at")
      .gte("created_at", cohortStart.toISOString())
      .lt("created_at", cohortEnd.toISOString());

    if (!cohortUsers || cohortUsers.length === 0) {
      results.push({ week: `H-${w}`, cohortSize: 0, day7: 0, day14: 0, day30: 0, day7Pct: 0, day14Pct: 0, day30Pct: 0 });
      continue;
    }

    const userIds = cohortUsers.map((u) => u.id);
    const cohortSize = userIds.length;

    const d7End = new Date(cohortEnd);
    d7End.setDate(d7End.getDate() + 7);
    const d14End = new Date(cohortEnd);
    d14End.setDate(d14End.getDate() + 14);
    const d30End = new Date(cohortEnd);
    d30End.setDate(d30End.getDate() + 30);

    async function countActive(untilDate: Date): Promise<number> {
      const { count } = await supabase
        .from("learning_events")
        .select("user_id", { count: "exact", head: true })
        .in("user_id", userIds.slice(0, 500))
        .gte("created_at", cohortEnd.toISOString())
        .lt("created_at", untilDate.toISOString());
      return count ?? 0;
    }

    const [day7, day14, day30] = await Promise.all([
      countActive(d7End),
      countActive(d14End),
      countActive(d30End),
    ]);

    results.push({
      week: `H-${w}`,
      cohortSize,
      day7,
      day14,
      day30,
      day7Pct: cohortSize > 0 ? Math.round((day7 / cohortSize) * 100) : 0,
      day14Pct: cohortSize > 0 ? Math.round((day14 / cohortSize) * 100) : 0,
      day30Pct: cohortSize > 0 ? Math.round((day30 / cohortSize) * 100) : 0,
    });
  }

  return results;
}

// ─── Platform Sağlık Skoru ───────────────────────────────────────────────────

export type PlatformHealthScore = {
  total: number; // 0–100
  breakdown: {
    retention: number;     // 0–25
    moderation: number;    // 0–25
    coverage: number;      // 0–25
    growth: number;        // 0–25
  };
  label: "Kritik" | "Düşük" | "Orta" | "İyi" | "Mükemmel";
  color: string;
};

export function computePlatformHealthScore(opts: {
  retentionRatio: number;
  moderationOnTarget: boolean;
  moderationBreaches: number;
  coverageRatio: number;
  dailySignups: number; // son 7 gün ortalaması
}): PlatformHealthScore {
  const retention = Math.min(25, Math.round(opts.retentionRatio * 25));
  const moderation = opts.moderationOnTarget
    ? 25
    : Math.max(0, 25 - opts.moderationBreaches * 5);
  const coverage = Math.min(25, Math.round(opts.coverageRatio * 25));
  const growth = Math.min(25, Math.round(Math.min(opts.dailySignups / 20, 1) * 25));

  const total = retention + moderation + coverage + growth;

  let label: PlatformHealthScore["label"];
  let color: string;
  if (total >= 85) { label = "Mükemmel"; color = "#10b981"; }
  else if (total >= 65) { label = "İyi"; color = "#3b82f6"; }
  else if (total >= 45) { label = "Orta"; color = "#f59e0b"; }
  else if (total >= 25) { label = "Düşük"; color = "#f97316"; }
  else { label = "Kritik"; color = "#ef4444"; }

  return { total, breakdown: { retention, moderation, coverage, growth }, label, color };
}

// ─── Gelir Kırılımı ───────────────────────────────────────────────────────────

export type RevenueSplit = {
  source: string;
  amount: number;
  color: string;
};

export async function getRevenueBreakdown(
  supabase: SupabaseClient,
): Promise<RevenueSplit[]> {
  const { data: subs } = await supabase
    .from("user_subscriptions")
    .select("plan_id, status")
    .eq("status", "active");

  const { data: bankTransfers } = await supabase
    .from("bank_transfer_requests")
    .select("amount_try")
    .eq("status", "approved");

  const { data: ads } = await supabase
    .from("sponsored_campaigns")
    .select("budget")
    .eq("status", "active");

  const premiumCount = subs?.length ?? 0;
  const bankTotal = (bankTransfers ?? []).reduce((s, t) => s + (t.amount_try ?? 0), 0);
  const adBudget = (ads ?? []).reduce((s, a) => s + (a.budget ?? 0), 0);

  return [
    { source: "Abonelik", amount: premiumCount * 79, color: "#8b5cf6" },
    { source: "Havale/EFT", amount: bankTotal, color: "#10b981" },
    { source: "Reklam Bütçesi", amount: adBudget, color: "#f59e0b" },
  ];
}
