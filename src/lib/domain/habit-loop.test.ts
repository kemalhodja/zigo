import { describe, expect, it } from "vitest";

import {
  buildLearnContinueHref,
  buildParentWeeklyReview,
  orderQuizzesForHabitLoop,
} from "@/lib/domain/habit-loop";
import type { ChildActivityItem } from "@/lib/domain/parent-dashboard";

function activity(
  partial: Partial<ChildActivityItem> & Pick<ChildActivityItem, "activity_id" | "activity_type" | "created_at">,
): ChildActivityItem {
  return {
    title: "Activity",
    points_awarded: 10,
    metadata: {},
    ...partial,
  };
}

describe("habit-loop", () => {
  it("aggregates last-7-day child learning actions", () => {
    const now = new Date("2026-07-23T12:00:00.000Z");
    const summary = buildParentWeeklyReview({
      now,
      children: [
        { id: "c1", name: "Ada" },
        { id: "c2", name: "Mert" },
      ],
      activityByChildId: {
        c1: [
          activity({
            activity_id: "a1",
            activity_type: "micro_video_watched",
            points_awarded: 10,
            created_at: "2026-07-22T10:00:00.000Z",
          }),
          activity({
            activity_id: "a2",
            activity_type: "quiz_complete",
            points_awarded: 10,
            created_at: "2026-07-21T10:00:00.000Z",
          }),
          activity({
            activity_id: "old",
            activity_type: "duel_won",
            points_awarded: 20,
            created_at: "2026-07-01T10:00:00.000Z",
          }),
        ],
        c2: [
          activity({
            activity_id: "a3",
            activity_type: "duel_won",
            points_awarded: 15,
            created_at: "2026-07-20T10:00:00.000Z",
          }),
        ],
      },
    });

    expect(summary.totalActions).toBe(3);
    expect(summary.totalPoints).toBe(35);
    expect(summary.microCount).toBe(1);
    expect(summary.quizCount).toBe(1);
    expect(summary.duelCount).toBe(1);
    expect(summary.activeChildCount).toBe(2);
    expect(summary.children[0]?.childName).toBe("Ada");
  });

  it("orders quizzes to continue the micro habit path", () => {
    const ordered = orderQuizzesForHabitLoop(
      [
        { id: "q1", area_id: 1 },
        { id: "q2", area_id: 2 },
        { id: "q3", area_id: 2 },
      ],
      { preferredQuizId: "q3", preferredAreaId: 2 },
    );
    expect(ordered.map((quiz) => quiz.id)).toEqual(["q3", "q2", "q1"]);
  });

  it("builds learn continue href from micro", () => {
    expect(buildLearnContinueHref({ areaId: 4, quizId: "q1" })).toBe(
      "/learn?from=micro&quizId=q1&areaId=4",
    );
  });
});
