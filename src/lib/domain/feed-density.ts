import type { SupabaseClient } from "@supabase/supabase-js";

import type { Database } from "@/lib/supabase/database.types";

export const PRIORITY_EXAM_AGE_GROUPS = ["TYT", "AYT", "YKS"] as const;

export const EXAM_DENSITY_AGE_GROUPS = ["TYT", "AYT", "YKS", "KPSS", "DGS", "ALES"] as const;

export type PriorityExamAgeGroup = (typeof PRIORITY_EXAM_AGE_GROUPS)[number];
export type ExamDensityAgeGroup = (typeof EXAM_DENSITY_AGE_GROUPS)[number];
export type DensityBand = "empty" | "thin" | "healthy";

export type AreaFeedDensityMetric = {
  areaId: number;
  areaName: string;
  ageGroup: string | null;
  postsInWindow: number;
  weeklyCreatorCount: number;
  subscriberCount: number;
  isEmpty: boolean;
  hasWeeklyCreator: boolean;
  densityBand: DensityBand;
};

export type AreaFeedDensityReport = {
  sinceDays: number;
  ageGroups: readonly string[];
  metrics: AreaFeedDensityMetric[];
  priorityAreaCount: number;
  areasWithWeeklyCreator: number;
  coverageRatio: number;
};

export type VerifiedInactiveTeacher = {
  id: string;
  full_name: string;
  email: string;
  organization_type: string | null;
};

export function isExamDensityAgeGroup(value: string): value is ExamDensityAgeGroup {
  return (EXAM_DENSITY_AGE_GROUPS as readonly string[]).includes(value);
}

export function parseDensityAgeGroups(raw: string | null | undefined): ExamDensityAgeGroup[] {
  if (!raw?.trim()) {
    return [...PRIORITY_EXAM_AGE_GROUPS];
  }

  const parsed = raw
    .split(",")
    .map((part) => part.trim().toUpperCase())
    .filter(isExamDensityAgeGroup);

  return parsed.length > 0 ? parsed : [...PRIORITY_EXAM_AGE_GROUPS];
}

export function resolveDensityBand(postsInWindow: number, weeklyCreatorCount: number): DensityBand {
  if (postsInWindow === 0) return "empty";
  if (weeklyCreatorCount < 2) return "thin";
  return "healthy";
}

export function buildAreaFeedDensityMetrics(input: {
  areas: Array<{ id: number; area_name: string; age_group: string | null }>;
  posts: Array<{ area_id: number | null; author_id: string }>;
  interests: Array<{ area_id: number }>;
  verifiedTeacherIds: ReadonlySet<string>;
}): AreaFeedDensityMetric[] {
  const postsByArea = new Map<number, { count: number; authors: Set<string> }>();
  for (const post of input.posts) {
    if (post.area_id == null) continue;
    if (!input.verifiedTeacherIds.has(post.author_id)) continue;
    const bucket = postsByArea.get(post.area_id) ?? { count: 0, authors: new Set<string>() };
    bucket.count += 1;
    bucket.authors.add(post.author_id);
    postsByArea.set(post.area_id, bucket);
  }

  const subscribersByArea = new Map<number, number>();
  for (const interest of input.interests) {
    subscribersByArea.set(interest.area_id, (subscribersByArea.get(interest.area_id) ?? 0) + 1);
  }

  return input.areas
    .map((area) => {
      const bucket = postsByArea.get(area.id);
      const postsInWindow = bucket?.count ?? 0;
      const weeklyCreatorCount = bucket?.authors.size ?? 0;
      return {
        areaId: area.id,
        areaName: area.area_name,
        ageGroup: area.age_group,
        postsInWindow,
        weeklyCreatorCount,
        subscriberCount: subscribersByArea.get(area.id) ?? 0,
        isEmpty: postsInWindow === 0,
        hasWeeklyCreator: weeklyCreatorCount >= 1,
        densityBand: resolveDensityBand(postsInWindow, weeklyCreatorCount),
      };
    })
    .sort((a, b) => {
      const ageCompare = (a.ageGroup ?? "").localeCompare(b.ageGroup ?? "", "tr");
      if (ageCompare !== 0) return ageCompare;
      return a.areaName.localeCompare(b.areaName, "tr");
    });
}

export function summarizeAreaFeedDensity(
  metrics: AreaFeedDensityMetric[],
  options: { sinceDays: number; ageGroups: readonly string[] },
): AreaFeedDensityReport {
  const areasWithWeeklyCreator = metrics.filter((item) => item.hasWeeklyCreator).length;
  const priorityAreaCount = metrics.length;
  return {
    sinceDays: options.sinceDays,
    ageGroups: options.ageGroups,
    metrics,
    priorityAreaCount,
    areasWithWeeklyCreator,
    coverageRatio: priorityAreaCount === 0 ? 0 : areasWithWeeklyCreator / priorityAreaCount,
  };
}

export function filterVerifiedInactiveTeachers<T extends { id: string }>(
  teachers: T[],
  activeAuthorIds: ReadonlySet<string>,
): T[] {
  return teachers.filter((teacher) => !activeAuthorIds.has(teacher.id));
}

function windowStartIso(sinceDays: number) {
  const start = new Date();
  start.setUTCDate(start.getUTCDate() - sinceDays);
  return start.toISOString();
}

export async function getAreaFeedDensityMetrics(
  supabase: SupabaseClient<Database>,
  options?: {
    ageGroups?: readonly string[];
    sinceDays?: number;
  },
): Promise<AreaFeedDensityReport> {
  const sinceDays = options?.sinceDays ?? 7;
  const ageGroups = options?.ageGroups?.length
    ? [...options.ageGroups]
    : [...PRIORITY_EXAM_AGE_GROUPS];

  const { data: areas, error: areasError } = await supabase
    .from("education_areas")
    .select("id, area_name, age_group")
    .in("age_group", ageGroups)
    .order("area_name");

  if (areasError) throw areasError;

  const scopedAreas = areas ?? [];
  if (scopedAreas.length === 0) {
    return summarizeAreaFeedDensity([], { sinceDays, ageGroups });
  }

  const areaIds = scopedAreas.map((area) => area.id);
  const sinceIso = windowStartIso(sinceDays);

  const [postsResult, interestsResult, teachersResult] = await Promise.all([
    supabase
      .from("social_posts")
      .select("area_id, author_id")
      .in("area_id", areaIds)
      .gte("created_at", sinceIso),
    supabase.from("user_interests").select("area_id").in("area_id", areaIds),
    supabase.from("users").select("id").eq("role", "teacher").eq("is_verified", true),
  ]);

  if (postsResult.error) throw postsResult.error;
  if (interestsResult.error) throw interestsResult.error;
  if (teachersResult.error) throw teachersResult.error;

  const verifiedTeacherIds = new Set((teachersResult.data ?? []).map((teacher) => teacher.id));
  const metrics = buildAreaFeedDensityMetrics({
    areas: scopedAreas,
    posts: postsResult.data ?? [],
    interests: interestsResult.data ?? [],
    verifiedTeacherIds,
  });

  return summarizeAreaFeedDensity(metrics, { sinceDays, ageGroups });
}

export async function getVerifiedInactiveTeachers(
  supabase: SupabaseClient<Database>,
  options?: { sinceDays?: number },
): Promise<VerifiedInactiveTeacher[]> {
  const sinceDays = options?.sinceDays ?? 7;
  const sinceIso = windowStartIso(sinceDays);

  const [teachersResult, postsResult] = await Promise.all([
    supabase
      .from("users")
      .select("id, full_name, email, organization_type")
      .eq("role", "teacher")
      .eq("is_verified", true)
      .order("full_name"),
    supabase.from("social_posts").select("author_id").gte("created_at", sinceIso),
  ]);

  if (teachersResult.error) throw teachersResult.error;
  if (postsResult.error) throw postsResult.error;

  const activeAuthorIds = new Set((postsResult.data ?? []).map((post) => post.author_id));
  return filterVerifiedInactiveTeachers(teachersResult.data ?? [], activeAuthorIds);
}

export function formatCoveragePercent(coverageRatio: number) {
  return `${Math.round(coverageRatio * 100)}%`;
}
