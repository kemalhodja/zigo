import { describe, expect, it } from "vitest";

import { buildParentAnalyticsSummary, buildParentDigest, classifyAccuracy } from "@/lib/domain/parent-analytics";
import type { ChildQuizActivityItem } from "@/lib/domain/parent-dashboard";

const NOW = new Date("2026-10-14T12:00:00Z");

function attempt(overrides: Partial<ChildQuizActivityItem>): ChildQuizActivityItem {
  return {
    attempt_id: crypto.randomUUID(),
    quiz_id: "q1",
    quiz_title: "Üslü Sayılar",
    total_questions: 10,
    correct_answers: 8,
    score_percent: 80,
    points_awarded: 20,
    completed_at: "2026-10-13T10:00:00Z",
    ...overrides,
  };
}

describe("parent analytics", () => {
  it("returns an honest empty state with no fabricated numbers", () => {
    const summary = buildParentAnalyticsSummary([], NOW);
    expect(summary.totalQuestions).toBe(0);
    expect(summary.accuracy).toBeNull();
    expect(summary.weeklyTrendPercent).toBeNull();
    expect(buildParentDigest("Ada", summary)).toContain("henüz quiz çözmedi");
  });

  it("aggregates accuracy, points and per-quiz insights from real attempts", () => {
    const summary = buildParentAnalyticsSummary(
      [
        attempt({ quiz_id: "q1", quiz_title: "Üslü Sayılar", correct_answers: 9 }),
        attempt({ quiz_id: "q2", quiz_title: "Fiilimsiler", correct_answers: 4 }),
      ],
      NOW,
    );
    expect(summary.totalQuestions).toBe(20);
    expect(summary.accuracy).toBe(65);
    expect(summary.pointsEarned).toBe(40);
    expect(summary.strongest?.quizTitle).toBe("Üslü Sayılar");
    expect(summary.weakest?.quizTitle).toBe("Fiilimsiler");
    expect(summary.weakest?.level).toBe("needs_support");
  });

  it("computes week-over-week trend only when a previous week exists", () => {
    const summary = buildParentAnalyticsSummary(
      [
        attempt({ completed_at: "2026-10-13T10:00:00Z" }),
        attempt({ completed_at: "2026-10-12T10:00:00Z" }),
        attempt({ completed_at: "2026-10-04T10:00:00Z" }),
      ],
      NOW,
    );
    expect(summary.last7DaysAttempts).toBe(2);
    expect(summary.previous7DaysAttempts).toBe(1);
    expect(summary.weeklyTrendPercent).toBe(100);
  });

  it("clamps corrupt rows instead of producing impossible accuracy", () => {
    const summary = buildParentAnalyticsSummary([attempt({ total_questions: 5, correct_answers: 9 })], NOW);
    expect(summary.accuracy).toBe(100);
  });

  it("classifies accuracy bands", () => {
    expect(classifyAccuracy(90)).toBe("strong");
    expect(classifyAccuracy(70)).toBe("steady");
    expect(classifyAccuracy(40)).toBe("needs_support");
  });
});
