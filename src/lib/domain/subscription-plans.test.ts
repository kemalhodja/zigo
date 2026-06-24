import { describe, expect, it } from "vitest";

import {
  formatTryPrice,
  resolveProfilePlanGroups,
} from "@/lib/domain/subscription-plans";

describe("subscription-plans", () => {
  it("formats Turkish lira prices", () => {
    expect(formatTryPrice(99)).toContain("99");
    expect(formatTryPrice(1499)).toContain("1.499");
  });

  it("uses 3x compare-at pricing", () => {
    const student = resolveProfilePlanGroups("student")[0];
    expect(student?.plans[0]?.priceTry).toBe(99);
    expect(student?.plans[0]?.compareAtTry).toBe(297);
    expect(student?.plans[2]?.priceTry).toBe(900);
    expect(student?.plans[2]?.compareAtTry).toBe(2700);
  });

  it("returns teacher creator pricing", () => {
    const teacher = resolveProfilePlanGroups("teacher")[0];
    expect(teacher?.plans.map((plan) => plan.priceTry)).toEqual([199, 1000, 1499]);
  });

  it("offers family package for parents with linked children", () => {
    const groups = resolveProfilePlanGroups("parent", true);
    expect(groups[0]?.id).toBe("family");
    expect(groups[0]?.plans.map((plan) => plan.priceTry)).toEqual([149, 700, 1200]);
    expect(groups[1]?.id).toBe("parent");
  });

  it("uses individual parent pricing without children", () => {
    const groups = resolveProfilePlanGroups("parent", false);
    expect(groups).toHaveLength(1);
    expect(groups[0]?.id).toBe("parent");
  });

  it("returns institution org pricing for kurs and okul", () => {
    const kurs = resolveProfilePlanGroups("teacher", false, "kurs");
    expect(kurs).toHaveLength(1);
    expect(kurs[0]?.id).toBe("institution");
    expect(kurs[0]?.plans.find((item) => item.interval === "yearly")?.priceTry).toBe(5000);
    expect(kurs[0]?.plans.find((item) => item.interval === "yearly")?.compareAtTry).toBe(15000);
  });

  it("shows only institution plans for registration institution accounts", () => {
    const groups = resolveProfilePlanGroups("teacher", false, "egitim_kurumu");
    expect(groups).toHaveLength(1);
    expect(groups[0]?.id).toBe("institution");
    expect(groups.some((group) => group.id === "teacher")).toBe(false);
  });

  it("shows only platform plans for registration platform accounts", () => {
    const groups = resolveProfilePlanGroups("teacher", false, "egitim_platformu");
    expect(groups).toHaveLength(1);
    expect(groups[0]?.id).toBe("platform");
    expect(groups[0]?.plans.find((item) => item.interval === "yearly")?.priceTry).toBe(4000);
  });
});
