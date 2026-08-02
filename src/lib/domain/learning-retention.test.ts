import { describe, expect, it } from "vitest";

import {
  LEARNING_RETENTION_TARGET,
  buildLearningActionRetention,
  formatRetentionPercent,
} from "@/lib/domain/learning-retention";

describe("learning-retention", () => {
  it("counts D7 return retention for cohort starters", () => {
    const now = new Date("2026-07-23T12:00:00.000Z");
    const report = buildLearningActionRetention(
      [
        // Cohort: first action 10 days ago, returned day 3
        { user_id: "u1", created_at: "2026-07-13T12:00:00.000Z" },
        { user_id: "u1", created_at: "2026-07-16T12:00:00.000Z" },
        // Cohort: first action 9 days ago, no return
        { user_id: "u2", created_at: "2026-07-14T12:00:00.000Z" },
        // Outside cohort (too recent)
        { user_id: "u3", created_at: "2026-07-20T12:00:00.000Z" },
        { user_id: "u3", created_at: "2026-07-21T12:00:00.000Z" },
        // Outside cohort (too old first event)
        { user_id: "u4", created_at: "2026-07-01T12:00:00.000Z" },
        { user_id: "u4", created_at: "2026-07-10T12:00:00.000Z" },
      ],
      { now, cohortStartDaysAgo: 7, cohortEndDaysAgo: 14, returnWithinDays: 7 },
    );

    expect(report.cohortSize).toBe(2);
    expect(report.retainedCount).toBe(1);
    expect(report.retentionRatio).toBe(0.5);
    expect(report.onTarget).toBe(true);
    expect(formatRetentionPercent(report.retentionRatio)).toBe("50%");
    expect(LEARNING_RETENTION_TARGET).toBe(0.25);
  });

  it("returns zero ratio for empty cohort", () => {
    const report = buildLearningActionRetention([], {
      now: new Date("2026-07-23T12:00:00.000Z"),
    });
    expect(report.cohortSize).toBe(0);
    expect(report.retentionRatio).toBe(0);
    expect(report.onTarget).toBe(false);
  });
});
