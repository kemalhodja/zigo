import { describe, expect, it } from "vitest";

import {
  buildTeacherActivationState,
  resolveTeacherActivationSteps,
  summarizeTeacherActivationFunnel,
} from "@/lib/domain/verification-activation";

describe("verification-activation", () => {
  it("marks incomplete profile as required", () => {
    const steps = resolveTeacherActivationSteps({
      hasProfile: false,
      hasAreas: false,
      isVerified: false,
      hasFirstPost: false,
    });
    expect(steps[0]).toEqual({ id: "completeProfile", status: "required" });
    expect(steps[1]?.status).toBe("pending");
    expect(steps[2]?.status).toBe("pending");
    expect(steps[3]?.status).toBe("locked");
  });

  it("requires areas after verification when missing", () => {
    const state = buildTeacherActivationState({
      fullName: "Aylin Teacher",
      isVerified: true,
      areaCount: 0,
      postCount: 0,
    });
    expect(state.steps.find((step) => step.id === "assignAreas")?.status).toBe("required");
    expect(state.steps.find((step) => step.id === "platformVerify")?.status).toBe("done");
    expect(state.steps.find((step) => step.id === "publishingUnlock")?.status).toBe("locked");
    expect(state.isActivated).toBe(false);
  });

  it("unlocks publishing when verified with areas", () => {
    const state = buildTeacherActivationState({
      fullName: "Aylin Teacher",
      isVerified: true,
      areaCount: 2,
      postCount: 1,
    });
    expect(state.steps.every((step) => step.status === "done")).toBe(true);
    expect(state.isActivated).toBe(true);
  });

  it("summarizes activation funnel buckets", () => {
    const funnel = summarizeTeacherActivationFunnel([
      { id: "1", is_verified: false, areaCount: 0, postCount: 0 },
      { id: "2", is_verified: true, areaCount: 0, postCount: 0 },
      { id: "3", is_verified: true, areaCount: 2, postCount: 0 },
      { id: "4", is_verified: true, areaCount: 1, postCount: 3 },
    ]);

    expect(funnel).toEqual({
      totalTeachers: 4,
      pendingVerification: 1,
      verifiedMissingAreas: 1,
      verifiedNoPosts: 1,
      activated: 1,
    });
  });
});
