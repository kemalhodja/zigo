import { describe, expect, it } from "vitest";

import {
  buildAreaFeedDensityMetrics,
  filterVerifiedInactiveTeachers,
  formatCoveragePercent,
  getAreaFeedDensityMetrics,
  getVerifiedInactiveTeachers,
  parseDensityAgeGroups,
  PRIORITY_EXAM_AGE_GROUPS,
  resolveDensityBand,
  summarizeAreaFeedDensity,
} from "@/lib/domain/feed-density";
import { createMockSupabase } from "@/test/mock-supabase";

describe("feed-density", () => {
  it("defaults density age groups to TYT/AYT/YKS", () => {
    expect(parseDensityAgeGroups(undefined)).toEqual([...PRIORITY_EXAM_AGE_GROUPS]);
    expect(parseDensityAgeGroups("")).toEqual([...PRIORITY_EXAM_AGE_GROUPS]);
    expect(parseDensityAgeGroups("KPSS,DGS")).toEqual(["KPSS", "DGS"]);
    expect(parseDensityAgeGroups("tyt, unknown")).toEqual(["TYT"]);
  });

  it("resolves empty / thin / healthy bands", () => {
    expect(resolveDensityBand(0, 0)).toBe("empty");
    expect(resolveDensityBand(3, 1)).toBe("thin");
    expect(resolveDensityBand(5, 2)).toBe("healthy");
  });

  it("builds per-area metrics from posts, interests, and verified teachers", () => {
    const metrics = buildAreaFeedDensityMetrics({
      areas: [
        { id: 1, area_name: "TYT Matematik", age_group: "TYT" },
        { id: 2, area_name: "AYT Fizik", age_group: "AYT" },
        { id: 3, area_name: "YKS Genel Hazırlık", age_group: "YKS" },
      ],
      posts: [
        { area_id: 1, author_id: "teacher-a" },
        { area_id: 1, author_id: "teacher-a" },
        { area_id: 1, author_id: "teacher-b" },
        { area_id: 2, author_id: "teacher-a" },
        { area_id: 2, author_id: "unverified" },
        { area_id: 3, author_id: "unverified" },
      ],
      interests: [{ area_id: 1 }, { area_id: 1 }, { area_id: 2 }],
      verifiedTeacherIds: new Set(["teacher-a", "teacher-b"]),
    });

    expect(metrics).toHaveLength(3);

    const tyt = metrics.find((item) => item.areaId === 1);
    expect(tyt).toMatchObject({
      postsInWindow: 3,
      weeklyCreatorCount: 2,
      subscriberCount: 2,
      isEmpty: false,
      hasWeeklyCreator: true,
      densityBand: "healthy",
    });

    const ayt = metrics.find((item) => item.areaId === 2);
    expect(ayt).toMatchObject({
      postsInWindow: 1,
      weeklyCreatorCount: 1,
      subscriberCount: 1,
      densityBand: "thin",
    });

    const yks = metrics.find((item) => item.areaId === 3);
    expect(yks).toMatchObject({
      postsInWindow: 0,
      weeklyCreatorCount: 0,
      isEmpty: true,
      hasWeeklyCreator: false,
      densityBand: "empty",
    });
  });

  it("summarizes priority coverage ratio", () => {
    const metrics = buildAreaFeedDensityMetrics({
      areas: [
        { id: 1, area_name: "A", age_group: "TYT" },
        { id: 2, area_name: "B", age_group: "AYT" },
      ],
      posts: [{ area_id: 1, author_id: "teacher-a" }],
      interests: [],
      verifiedTeacherIds: new Set(["teacher-a"]),
    });

    const report = summarizeAreaFeedDensity(metrics, {
      sinceDays: 7,
      ageGroups: PRIORITY_EXAM_AGE_GROUPS,
    });

    expect(report.priorityAreaCount).toBe(2);
    expect(report.areasWithWeeklyCreator).toBe(1);
    expect(report.coverageRatio).toBe(0.5);
    expect(formatCoveragePercent(report.coverageRatio)).toBe("50%");
  });

  it("filters verified teachers with no posts in the window", () => {
    const inactive = filterVerifiedInactiveTeachers(
      [
        { id: "t1", full_name: "Active" },
        { id: "t2", full_name: "Inactive" },
      ],
      new Set(["t1"]),
    );
    expect(inactive).toEqual([{ id: "t2", full_name: "Inactive" }]);
  });

  it("loads density metrics through supabase queries", async () => {
    const supabase = createMockSupabase({
      tables: {
        education_areas: {
          data: [
            { id: 1, area_name: "TYT Matematik", age_group: "TYT" },
            { id: 2, area_name: "AYT Fizik", age_group: "AYT" },
          ],
          error: null,
        },
        social_posts: {
          data: [
            { area_id: 1, author_id: "teacher-a" },
            { area_id: 1, author_id: "teacher-b" },
          ],
          error: null,
        },
        user_interests: {
          data: [{ area_id: 1 }, { area_id: 2 }],
          error: null,
        },
        users: {
          data: [{ id: "teacher-a" }, { id: "teacher-b" }],
          error: null,
        },
      },
    });

    const report = await getAreaFeedDensityMetrics(supabase, {
      ageGroups: ["TYT", "AYT"],
      sinceDays: 7,
    });

    expect(report.priorityAreaCount).toBe(2);
    expect(report.areasWithWeeklyCreator).toBe(1);
    expect(report.metrics.find((item) => item.areaId === 1)?.densityBand).toBe("healthy");
    expect(report.metrics.find((item) => item.areaId === 2)?.densityBand).toBe("empty");
  });

  it("loads verified inactive teachers through supabase queries", async () => {
    const supabase = createMockSupabase({
      tables: {
        users: {
          data: [
            {
              id: "teacher-a",
              full_name: "Active Teacher",
              email: "a@zigo.test",
              organization_type: null,
            },
            {
              id: "teacher-b",
              full_name: "Inactive Teacher",
              email: "b@zigo.test",
              organization_type: "yayinevi",
            },
          ],
          error: null,
        },
        social_posts: {
          data: [{ author_id: "teacher-a" }],
          error: null,
        },
      },
    });

    const inactive = await getVerifiedInactiveTeachers(supabase, { sinceDays: 7 });
    expect(inactive).toHaveLength(1);
    expect(inactive[0]?.id).toBe("teacher-b");
  });
});
