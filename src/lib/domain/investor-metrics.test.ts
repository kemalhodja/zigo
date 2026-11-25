import { describe, expect, it } from "vitest";

import { computeNorthStarMetrics } from "./investor-metrics";

describe("computeNorthStarMetrics (P4.2 Angel Investor KPI Engine)", () => {
  it("computes DAU/MAU, D1/D7/D30 retention, trial conversion, MRR/ARR, and unit economics", () => {
    const now = new Date("2026-11-26T12:00:00Z");
    const daysAgo = (days: number) => new Date(now.getTime() - days * 86_400_000).toISOString();

    const snapshot = computeNorthStarMetrics({
      now,
      users: [
        { id: "t1", role: "teacher", is_premium: true, is_verified: true, created_at: daysAgo(45), last_active_at: daysAgo(0.2) },
        { id: "t2", role: "teacher", is_premium: false, is_verified: true, created_at: daysAgo(10), last_active_at: daysAgo(2) },
        { id: "s1", role: "student", is_premium: true, is_verified: false, created_at: daysAgo(20), last_active_at: daysAgo(0.5) },
        { id: "s2", role: "student", is_premium: false, is_verified: false, created_at: daysAgo(3), last_active_at: daysAgo(2) },
        { id: "inst1", role: "education_institution", is_premium: true, is_verified: true, created_at: daysAgo(40), last_active_at: daysAgo(0.1) },
      ],
      subscriptions: [
        { user_id: "t1", plan_id: "zigo-plus-teachers-monthly", status: "active", current_period_end: daysAgo(-20) },
        { user_id: "s1", plan_id: "zigo-plus-student-monthly", status: "active", current_period_end: daysAgo(-15) },
        { user_id: "inst1", plan_id: "zigo-plus-educational-institutions-monthly", status: "active", current_period_end: daysAgo(-25) },
        { user_id: "churned1", plan_id: "zigo-plus-student-monthly", status: "canceled", current_period_end: daysAgo(5) },
      ],
      recentActivityUserIds24h: ["t1", "s1", "inst1"],
      recentActivityUserIds7d: ["t1", "t2", "s1", "s2", "inst1"],
      recentActivityUserIds30d: ["t1", "t2", "s1", "s2", "inst1"],
      totalStorageBytes: 512 * 1024 * 1024, // 512 MB
      weeklyPostsCount: 18,
    });

    expect(snapshot.totalUsers).toBe(5);
    expect(snapshot.dau).toBe(3);
    expect(snapshot.mau).toBe(5);
    expect(snapshot.dauMauRatio).toBe(60);

    // 149 (teacher) + 79 (student) + 1490 (institution) = 1718 TRY MRR
    expect(snapshot.activePaidCount).toBe(3);
    expect(snapshot.mrrTry).toBe(1718);
    expect(snapshot.arrTry).toBe(1718 * 12);
    expect(snapshot.churned30d).toBe(1);
    expect(snapshot.monthlyChurnRate).toBe(25);

    // Conversion segments
    expect(snapshot.teacherConversion.paidUsers).toBe(1);
    expect(snapshot.teacherConversion.inTrialUsers).toBe(1);
    expect(snapshot.teacherConversion.conversionRate).toBe(50);
    expect(snapshot.learnerConversion.paidUsers).toBe(1);
    expect(snapshot.learnerConversion.inTrialUsers).toBe(1);

    // Unit economics
    expect(snapshot.totalStorageMb).toBe(512);
    expect(snapshot.estimatedGrossMarginPercent).toBeGreaterThan(80);
    expect(snapshot.verifiedTeachersCount).toBe(2);
  });
});
