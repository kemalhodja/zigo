import { describe, expect, it } from "vitest";

import {
  buildOrgDashboardSnapshot,
  listOrgDashboardMetricIds,
  resolveOrgDashboardFocus,
} from "@/lib/domain/org-dashboard";

describe("org-dashboard", () => {
  it("builds snapshot for institution accounts", () => {
    const snapshot = buildOrgDashboardSnapshot({
      organizationType: "kurs",
      assignedAreaNames: ["TYT Matematik", "TYT Türkçe"],
      postsTotal: 12,
      postsLast7Days: 3,
      followers: 40,
      activeSponsoredCount: 1,
      openQuestionsInAreas: 5,
    });

    expect(snapshot).toMatchObject({
      organizationType: "kurs",
      organizationLabel: "Kurs",
      billingTier: "institution",
      assignedAreaCount: 2,
      postsLast7Days: 3,
      openQuestionsInAreas: 5,
    });
    expect(resolveOrgDashboardFocus(snapshot!.billingTier)).toBe("institution");
    expect(listOrgDashboardMetricIds("institution")).toEqual([
      "postsLast7Days",
      "followers",
      "assignedAreas",
      "openQuestions",
      "activeSponsored",
    ]);
  });

  it("prioritizes catalog metrics for publishers", () => {
    const snapshot = buildOrgDashboardSnapshot({
      organizationType: "yayinevi",
      assignedAreaNames: ["AYT Matematik"],
      postsTotal: 20,
      postsLast7Days: 4,
      followers: 100,
      activeSponsoredCount: 2,
      openQuestionsInAreas: 0,
    });

    expect(snapshot?.billingTier).toBe("publisher");
    expect(listOrgDashboardMetricIds("publisher")).toEqual([
      "postsLast7Days",
      "postsTotal",
      "followers",
      "assignedAreas",
      "activeSponsored",
    ]);
  });

  it("prioritizes network metrics for platforms", () => {
    expect(listOrgDashboardMetricIds("platform")).toEqual([
      "postsLast7Days",
      "postsTotal",
      "followers",
      "assignedAreas",
      "openQuestions",
    ]);
  });
});
