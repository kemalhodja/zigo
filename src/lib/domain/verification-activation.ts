import type { SupabaseClient } from "@supabase/supabase-js";

import { getUserInterestAreaIds } from "@/lib/domain/profiles";
import { countUserPosts } from "@/lib/domain/social/helpers";
import type { Database } from "@/lib/supabase/database.types";

export type ActivationStepStatus = "done" | "pending" | "required" | "locked";

export type TeacherActivationStepId =
  | "completeProfile"
  | "assignAreas"
  | "platformVerify"
  | "publishingUnlock";

export type TeacherActivationStep = {
  id: TeacherActivationStepId;
  status: ActivationStepStatus;
};

export type TeacherActivationState = {
  hasProfile: boolean;
  hasAreas: boolean;
  isVerified: boolean;
  hasFirstPost: boolean;
  areaCount: number;
  postCount: number;
  steps: TeacherActivationStep[];
  isActivated: boolean;
};

export type TeacherActivationFunnel = {
  totalTeachers: number;
  pendingVerification: number;
  verifiedMissingAreas: number;
  verifiedNoPosts: number;
  activated: number;
};

export function resolveTeacherActivationSteps(input: {
  hasProfile: boolean;
  hasAreas: boolean;
  isVerified: boolean;
  hasFirstPost: boolean;
}): TeacherActivationStep[] {
  return [
    {
      id: "completeProfile",
      status: input.hasProfile ? "done" : "required",
    },
    {
      id: "assignAreas",
      status: input.hasAreas ? "done" : input.isVerified ? "required" : "pending",
    },
    {
      id: "platformVerify",
      status: input.isVerified ? "done" : "pending",
    },
    {
      id: "publishingUnlock",
      status: input.isVerified && input.hasAreas ? "done" : "locked",
    },
  ];
}

export function buildTeacherActivationState(input: {
  fullName: string | null | undefined;
  isVerified: boolean;
  areaCount: number;
  postCount: number;
}): TeacherActivationState {
  const hasProfile = Boolean(input.fullName?.trim());
  const hasAreas = input.areaCount > 0;
  const hasFirstPost = input.postCount > 0;
  const steps = resolveTeacherActivationSteps({
    hasProfile,
    hasAreas,
    isVerified: input.isVerified,
    hasFirstPost,
  });

  return {
    hasProfile,
    hasAreas,
    isVerified: input.isVerified,
    hasFirstPost,
    areaCount: input.areaCount,
    postCount: input.postCount,
    steps,
    isActivated: input.isVerified && hasAreas && hasFirstPost,
  };
}

export function summarizeTeacherActivationFunnel(
  teachers: Array<{
    id: string;
    is_verified: boolean;
    areaCount: number;
    postCount: number;
  }>,
): TeacherActivationFunnel {
  let pendingVerification = 0;
  let verifiedMissingAreas = 0;
  let verifiedNoPosts = 0;
  let activated = 0;

  for (const teacher of teachers) {
    if (!teacher.is_verified) {
      pendingVerification += 1;
      continue;
    }
    if (teacher.areaCount === 0) {
      verifiedMissingAreas += 1;
      continue;
    }
    if (teacher.postCount === 0) {
      verifiedNoPosts += 1;
      continue;
    }
    activated += 1;
  }

  return {
    totalTeachers: teachers.length,
    pendingVerification,
    verifiedMissingAreas,
    verifiedNoPosts,
    activated,
  };
}

export async function getTeacherActivationState(
  supabase: SupabaseClient<Database>,
  input: {
    userId: string;
    fullName: string | null | undefined;
    isVerified: boolean;
  },
): Promise<TeacherActivationState> {
  const [areaIds, postCount] = await Promise.all([
    getUserInterestAreaIds(supabase, input.userId),
    countUserPosts(supabase, input.userId),
  ]);

  return buildTeacherActivationState({
    fullName: input.fullName,
    isVerified: input.isVerified,
    areaCount: areaIds.length,
    postCount,
  });
}

export async function getTeacherActivationFunnel(
  supabase: SupabaseClient<Database>,
): Promise<TeacherActivationFunnel> {
  const { data: teachers, error } = await supabase
    .from("users")
    .select("id, is_verified")
    .eq("role", "teacher");

  if (error) throw error;

  const rows = teachers ?? [];
  if (rows.length === 0) {
    return summarizeTeacherActivationFunnel([]);
  }

  const teacherIds = rows.map((teacher) => teacher.id);

  const [interestsResult, postsResult] = await Promise.all([
    supabase.from("user_interests").select("user_id").in("user_id", teacherIds),
    supabase.from("social_posts").select("author_id").in("author_id", teacherIds),
  ]);

  if (interestsResult.error) throw interestsResult.error;
  if (postsResult.error) throw postsResult.error;

  const areaCounts = new Map<string, number>();
  for (const row of interestsResult.data ?? []) {
    areaCounts.set(row.user_id, (areaCounts.get(row.user_id) ?? 0) + 1);
  }

  const postCounts = new Map<string, number>();
  for (const row of postsResult.data ?? []) {
    postCounts.set(row.author_id, (postCounts.get(row.author_id) ?? 0) + 1);
  }

  return summarizeTeacherActivationFunnel(
    rows.map((teacher) => ({
      id: teacher.id,
      is_verified: teacher.is_verified,
      areaCount: areaCounts.get(teacher.id) ?? 0,
      postCount: postCounts.get(teacher.id) ?? 0,
    })),
  );
}
