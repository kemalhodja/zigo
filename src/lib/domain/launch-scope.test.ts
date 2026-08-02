import { describe, expect, it } from "vitest";

import {
  LAUNCH_BLOCKED_EXAM_TRACKS,
  LAUNCH_COVERAGE_TARGET,
  LAUNCH_PRIORITY_TRACKS,
  assertAreaIdsAllowedUnderLaunchFreeze,
  filterAreasForLaunchScopedSelection,
  filterLaunchPriorityAreas,
  findLaunchFreezeRejectedAreaIds,
  isLaunchBlockedExamTrack,
  isLaunchPriorityTrack,
  shouldEnforceLaunchFreezeForGrade,
} from "@/lib/domain/launch-scope";

describe("launch-scope", () => {
  it("freezes launch priority to TYT/AYT/YKS", () => {
    expect(LAUNCH_PRIORITY_TRACKS).toEqual(["TYT", "AYT", "YKS"]);
    expect(LAUNCH_BLOCKED_EXAM_TRACKS).toEqual(["KPSS", "DGS", "ALES"]);
    expect(LAUNCH_COVERAGE_TARGET).toBe(0.7);
    expect(isLaunchPriorityTrack("TYT")).toBe(true);
    expect(isLaunchPriorityTrack("KPSS")).toBe(false);
    expect(isLaunchBlockedExamTrack("KPSS")).toBe(true);
  });

  it("filters education areas to launch tracks", () => {
    const areas = filterLaunchPriorityAreas([
      { age_group: "TYT", id: 1 },
      { age_group: "KPSS", id: 2 },
      { age_group: "AYT", id: 3 },
      { age_group: null, id: 4 },
    ]);
    expect(areas.map((area) => area.id)).toEqual([1, 3]);
  });

  it("scopes learner demand by grade and blocked tracks", () => {
    const areas = [
      { id: 1, age_group: "TYT" },
      { id: 2, age_group: "KPSS" },
      { id: 3, age_group: "LGS" },
      { id: 4, age_group: "Genel İlgi" },
      { id: 5, age_group: "AYT" },
    ];

    expect(filterAreasForLaunchScopedSelection(areas, "YKS").map((area) => area.id)).toEqual([
      1, 4, 5,
    ]);
    expect(filterAreasForLaunchScopedSelection(areas, "8").map((area) => area.id)).toEqual([
      1, 3, 4, 5,
    ]);
    expect(shouldEnforceLaunchFreezeForGrade("tyt")).toBe(true);
  });

  it("rejects admin supply and learner demand out of freeze", () => {
    const catalog = [
      { id: 1, age_group: "TYT" },
      { id: 2, age_group: "KPSS" },
      { id: 3, age_group: "Genel İlgi" },
    ];

    expect(findLaunchFreezeRejectedAreaIds(catalog, [1, 2], "admin_supply")).toEqual([2]);
    expect(() => assertAreaIdsAllowedUnderLaunchFreeze(catalog, [1, 2], "admin_supply")).toThrow(
      /TYT, AYT or YKS/,
    );

    expect(findLaunchFreezeRejectedAreaIds(catalog, [2], "learner_demand", "YKS")).toEqual([2]);
    expect(
      findLaunchFreezeRejectedAreaIds(catalog, [3], "learner_demand", "YKS"),
    ).toEqual([]);
  });
});
