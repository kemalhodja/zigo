import { PRIORITY_EXAM_AGE_GROUPS, type PriorityExamAgeGroup } from "@/lib/domain/feed-density";
import { isGeneralInterestArea } from "@/lib/domain/general-interest-areas";

/**
 * Foundation launch freeze: demand and supply ops default to these exam tracks.
 * Expand only when Match-Feed coverage holds on the frozen set.
 */
export const LAUNCH_PRIORITY_TRACKS = PRIORITY_EXAM_AGE_GROUPS;

/** Exam tracks deferred until expansion gate is green. */
export const LAUNCH_BLOCKED_EXAM_TRACKS = ["KPSS", "DGS", "ALES"] as const;

export type LaunchPriorityTrack = PriorityExamAgeGroup;
export type LaunchBlockedExamTrack = (typeof LAUNCH_BLOCKED_EXAM_TRACKS)[number];

export function isLaunchPriorityTrack(value: string | null | undefined): value is LaunchPriorityTrack {
  return Boolean(value && (LAUNCH_PRIORITY_TRACKS as readonly string[]).includes(value));
}

export function isLaunchBlockedExamTrack(
  value: string | null | undefined,
): value is LaunchBlockedExamTrack {
  return Boolean(value && (LAUNCH_BLOCKED_EXAM_TRACKS as readonly string[]).includes(value));
}

export function filterLaunchPriorityAreas<T extends { age_group: string | null }>(areas: T[]): T[] {
  return areas.filter((area) => isLaunchPriorityTrack(area.age_group));
}

export function shouldEnforceLaunchFreezeForGrade(gradeLevel: string | null | undefined) {
  const normalized = gradeLevel?.trim().toUpperCase() ?? "";
  return normalized === "YKS" || normalized === "TYT" || normalized === "AYT";
}

/**
 * Demand-side picker filter:
 * - always drop KPSS/DGS/ALES dilution
 * - for YKS/TYT/AYT grades, keep only launch tracks (+ general interest hobbies)
 */
export function filterAreasForLaunchScopedSelection<T extends { age_group: string | null }>(
  areas: T[],
  gradeLevel: string | null | undefined,
): T[] {
  const withoutBlocked = areas.filter((area) => !isLaunchBlockedExamTrack(area.age_group));

  if (!shouldEnforceLaunchFreezeForGrade(gradeLevel)) {
    return withoutBlocked;
  }

  return withoutBlocked.filter(
    (area) => isLaunchPriorityTrack(area.age_group) || isGeneralInterestArea(area),
  );
}

export function findLaunchFreezeRejectedAreaIds(
  catalog: Array<{ id: number; age_group: string | null }>,
  areaIds: number[],
  mode: "admin_supply" | "learner_demand",
  gradeLevel?: string | null,
) {
  const byId = new Map(catalog.map((area) => [area.id, area]));

  return areaIds.filter((id) => {
    const area = byId.get(id);
    if (!area) return true;

    if (mode === "admin_supply") {
      return !isLaunchPriorityTrack(area.age_group);
    }

    if (isLaunchBlockedExamTrack(area.age_group)) return true;

    if (shouldEnforceLaunchFreezeForGrade(gradeLevel)) {
      return !isLaunchPriorityTrack(area.age_group) && !isGeneralInterestArea(area);
    }

    return false;
  });
}

export function assertAreaIdsAllowedUnderLaunchFreeze(
  catalog: Array<{ id: number; age_group: string | null }>,
  areaIds: number[],
  mode: "admin_supply" | "learner_demand",
  gradeLevel?: string | null,
) {
  const rejected = findLaunchFreezeRejectedAreaIds(catalog, areaIds, mode, gradeLevel);
  if (rejected.length === 0) return;

  if (mode === "admin_supply") {
    throw new Error("Launch freeze: teacher areas must be TYT, AYT or YKS only.");
  }

  throw new Error("Launch freeze: KPSS/DGS/ALES and out-of-scope exam areas are locked.");
}

export const LAUNCH_COVERAGE_TARGET = 0.7;
