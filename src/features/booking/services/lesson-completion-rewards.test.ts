import { describe, expect, it } from "vitest";

import {
  describeLessonCompletionReward,
  LESSON_COMPLETION_REWARD_POINTS,
} from "@/features/booking/services/lesson-completion-rewards.service";

describe("lesson completion rewards", () => {
  it("documents standard live-lesson reward", () => {
    expect(LESSON_COMPLETION_REWARD_POINTS).toBe(15);
    expect(describeLessonCompletionReward("Ada")).toContain("Ada");
    expect(describeLessonCompletionReward("Ada")).toContain("15");
    expect(describeLessonCompletionReward("Ada")).toContain("lesson_star");
  });
});
