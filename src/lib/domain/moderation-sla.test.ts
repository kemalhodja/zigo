import { describe, expect, it } from "vitest";

import {
  MODERATION_SLA_HOURS,
  buildModerationSlaReport,
  formatSlaAgeHours,
  isSlaBreached,
  median,
  resolveAtForStatus,
  sortModerationQueueBySla,
} from "@/lib/domain/moderation-sla";

describe("moderation-sla", () => {
  const now = new Date("2026-07-23T12:00:00.000Z");

  it("flags open reports older than SLA hours", () => {
    expect(isSlaBreached("2026-07-22T11:00:00.000Z", { now, slaHours: 24 })).toBe(true);
    expect(isSlaBreached("2026-07-23T01:00:00.000Z", { now, slaHours: 24 })).toBe(false);
  });

  it("sorts breached items first, then oldest", () => {
    const sorted = sortModerationQueueBySla(
      [
        { id: "fresh", created_at: "2026-07-23T10:00:00.000Z" },
        { id: "old-breach", created_at: "2026-07-20T12:00:00.000Z" },
        { id: "newer-breach", created_at: "2026-07-21T12:00:00.000Z" },
        { id: "mid", created_at: "2026-07-23T01:00:00.000Z" },
      ],
      { now, slaHours: 24 },
    );
    expect(sorted.map((item) => item.id)).toEqual(["old-breach", "newer-breach", "mid", "fresh"]);
  });

  it("formats age labels for triage badges", () => {
    expect(formatSlaAgeHours("2026-07-23T11:30:00.000Z", now)).toBe("<1h");
    expect(formatSlaAgeHours("2026-07-23T01:00:00.000Z", now)).toBe("11h");
    expect(formatSlaAgeHours("2026-07-21T12:00:00.000Z", now)).toBe("2d");
  });

  it("builds queue breach and median resolve metrics", () => {
    const report = buildModerationSlaReport({
      now,
      slaHours: 24,
      reports: [
        {
          id: "r1",
          status: "open",
          created_at: "2026-07-21T12:00:00.000Z",
          resolved_at: null,
        },
        {
          id: "r2",
          status: "resolved",
          created_at: "2026-07-20T12:00:00.000Z",
          resolved_at: "2026-07-20T18:00:00.000Z",
        },
        {
          id: "r3",
          status: "dismissed",
          created_at: "2026-07-19T12:00:00.000Z",
          resolved_at: "2026-07-20T12:00:00.000Z",
        },
      ],
      safetyItems: [
        { id: "c1", created_at: "2026-07-23T10:00:00.000Z", status: "pending" },
        { id: "c2", created_at: "2026-07-21T10:00:00.000Z", status: "pending" },
      ],
    });

    expect(report.openReports).toBe(1);
    expect(report.breachedReports).toBe(1);
    expect(report.pendingSafety).toBe(2);
    expect(report.breachedSafety).toBe(1);
    expect(report.resolvedSampleSize).toBe(2);
    expect(report.medianResolveHours).toBe(15);
    expect(report.onTarget).toBe(false);
    expect(MODERATION_SLA_HOURS).toBe(24);
  });

  it("computes median and resolve_at transitions", () => {
    expect(median([1, 3, 2])).toBe(2);
    expect(median([1, 2, 3, 4])).toBe(2.5);
    expect(resolveAtForStatus("resolved", null, now)).toBe(now.toISOString());
    expect(resolveAtForStatus("open", "2026-07-01T00:00:00.000Z", now)).toBeNull();
  });
});
