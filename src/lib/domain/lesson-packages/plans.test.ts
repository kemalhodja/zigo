import { describe, expect, it } from "vitest";

import {
  findLessonPackagePlan,
  LESSON_PACKAGE_PLANS,
} from "@/lib/domain/lesson-packages/plans";

describe("lesson package plans", () => {
  it("defines basic, pro and premium tiers", () => {
    expect(LESSON_PACKAGE_PLANS.map((plan) => plan.id)).toEqual(["basic", "pro", "premium"]);
  });

  it("returns increasing lesson counts", () => {
    expect(findLessonPackagePlan("basic")?.lessonsIncluded).toBe(2);
    expect(findLessonPackagePlan("pro")?.lessonsIncluded).toBe(5);
    expect(findLessonPackagePlan("premium")?.lessonsIncluded).toBe(12);
  });
});
