import { describe, expect, it } from "vitest";

import { evaluateExpansionReadiness } from "@/lib/domain/expansion-readiness";
import { buildRevenueOpsSnapshot } from "@/lib/domain/revenue-ops";

describe("revenue-ops", () => {
  it("counts active premium org vs individual payers", () => {
    const now = new Date("2026-07-23T12:00:00.000Z");
    const snapshot = buildRevenueOpsSnapshot({
      now,
      subscriptions: [
        { user_id: "u1", tier: "zigo_plus", current_period_end: "2026-08-01T00:00:00.000Z" },
        { user_id: "u2", tier: "zigo_plus", current_period_end: "2026-08-01T00:00:00.000Z" },
        { user_id: "u3", tier: "zigo_plus", current_period_end: "2026-07-01T00:00:00.000Z" },
        { user_id: "u4", tier: "free", current_period_end: null },
      ],
      usersById: new Map([
        ["u1", { organization_type: "kurs" }],
        ["u2", { organization_type: null }],
        ["u3", { organization_type: "yayinevi" }],
        ["u4", { organization_type: null }],
      ]),
      activeSponsorCampaigns: 2,
      expiringSponsorsSoon: 1,
      pendingBankTransfers: 1,
      sponsorsReconciled: 3,
    });

    expect(snapshot.activePremiumCount).toBe(2);
    expect(snapshot.orgPremiumCount).toBe(1);
    expect(snapshot.individualPremiumCount).toBe(1);
    expect(snapshot.activeSponsorCampaigns).toBe(2);
    expect(snapshot.expiringSponsorsSoon).toBe(1);
    expect(snapshot.pendingBankTransfers).toBe(1);
    expect(snapshot.sponsorsReconciled).toBe(3);
  });
});

describe("expansion-readiness", () => {
  it("requires coverage, SLA, and D7 together", () => {
    const blocked = evaluateExpansionReadiness({
      feedCoverageRatio: 0.8,
      moderationOnTarget: true,
      moderationBreaches: 0,
      learningRetentionRatio: 0.1,
      learningCohortSize: 10,
    });
    expect(blocked.ready).toBe(false);
    expect(blocked.readyCount).toBe(2);

    const ready = evaluateExpansionReadiness({
      feedCoverageRatio: 0.8,
      moderationOnTarget: true,
      moderationBreaches: 0,
      learningRetentionRatio: 0.3,
      learningCohortSize: 10,
    });
    expect(ready.ready).toBe(true);
    expect(ready.readyCount).toBe(3);
  });
});
