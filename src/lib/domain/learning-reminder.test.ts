import { describe, expect, it } from "vitest";

import {
  decideLearningReminder,
  formatMissionProgressLabel,
} from "@/lib/domain/learning-reminder";

describe("learning-reminder", () => {
  it("reminds students with incomplete missions", () => {
    const decision = decideLearningReminder({
      role: "student",
      completedMissionCount: 2,
      streakDays: 4,
    });
    expect(decision.shouldNotify).toBe(true);
    expect(decision.reason).toBe("incomplete_missions");
    expect(decision.href).toBe("/student");
  });

  it("skips non-students", () => {
    expect(
      decideLearningReminder({
        role: "parent",
        completedMissionCount: 0,
        streakDays: 0,
      }).shouldNotify,
    ).toBe(false);
  });

  it("formats mission progress", () => {
    expect(formatMissionProgressLabel(3)).toBe("3/5");
  });
});
