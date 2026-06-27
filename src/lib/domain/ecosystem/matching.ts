import type { SupabaseClient } from "@supabase/supabase-js";
import { z } from "zod";

import type { Database } from "@/lib/supabase/database.types";

export const upsertStudentNeedSchema = z.object({
  studentUserId: z.string().uuid().optional(),
  childProfileId: z.string().uuid().optional(),
  areaId: z.number().int().positive(),
  weaknessLevel: z.number().int().min(1).max(5),
});

export type MatchedTeacher = {
  teacher_id: string;
  full_name: string;
  reputation_score: number;
  matched_area_id: number;
  area_name: string;
  weakness_level: number;
  match_score: number;
};

export async function upsertStudentNeed(
  supabase: SupabaseClient<Database>,
  input: z.infer<typeof upsertStudentNeedSchema>,
) {
  const parsed = upsertStudentNeedSchema.parse(input);
  if (!parsed.studentUserId && !parsed.childProfileId) {
    throw new Error("studentUserId or childProfileId is required.");
  }

  let query = supabase.from("student_needs").select("id");

  if (parsed.studentUserId) {
    query = query.eq("student_user_id", parsed.studentUserId).eq("area_id", parsed.areaId);
  } else {
    query = query.eq("child_profile_id", parsed.childProfileId!).eq("area_id", parsed.areaId);
  }

  const { data: existing, error: readError } = await query.maybeSingle();
  if (readError) throw readError;

  if (existing?.id) {
    const { data, error } = await supabase
      .from("student_needs")
      .update({
        weakness_level: parsed.weaknessLevel,
        updated_at: new Date().toISOString(),
      })
      .eq("id", existing.id)
      .select("*")
      .single();
    if (error) throw error;
    return data;
  }

  const { data, error } = await supabase
    .from("student_needs")
    .insert({
      student_user_id: parsed.studentUserId ?? null,
      child_profile_id: parsed.childProfileId ?? null,
      area_id: parsed.areaId,
      weakness_level: parsed.weaknessLevel,
    })
    .select("*")
    .single();

  if (error) throw error;
  return data;
}

export async function findBestTeachers(
  supabase: SupabaseClient<Database>,
  input: {
    studentUserId?: string;
    childProfileId?: string;
    limit?: number;
  },
): Promise<MatchedTeacher[]> {
  const { data, error } = await supabase.rpc("find_best_teacher", {
    for_student_user_id: input.studentUserId ?? undefined,
    for_child_profile_id: input.childProfileId ?? undefined,
    limit_count: input.limit ?? 5,
  });

  if (error) throw error;
  return (data ?? []) as MatchedTeacher[];
}

export async function findTeachersBySubject(
  supabase: SupabaseClient<Database>,
  subject: string,
  limit = 5,
): Promise<MatchedTeacher[]> {
  const term = subject.trim();
  if (!term) return [];

  const { data: areas, error: areaError } = await supabase
    .from("education_areas")
    .select("id, area_name")
    .ilike("area_name", `%${term}%`)
    .limit(10);

  if (areaError) throw areaError;
  if (!areas?.length) return [];

  const areaIds = areas.map((area) => area.id);
  const { data: interests, error: interestError } = await supabase
    .from("user_interests")
    .select("area_id, user_id")
    .in("area_id", areaIds);

  if (interestError) throw interestError;
  if (!interests?.length) return [];

  const userIds = [...new Set(interests.map((interest) => interest.user_id))];
  const { data: teachers, error: teacherError } = await supabase
    .from("users")
    .select("id, full_name, reputation_score, role, is_verified")
    .in("id", userIds)
    .eq("role", "teacher")
    .eq("is_verified", true);

  if (teacherError) throw teacherError;

  const teacherById = new Map((teachers ?? []).map((teacher) => [teacher.id, teacher]));
  const areaNameById = new Map(areas.map((area) => [area.id, area.area_name]));
  const ranked = interests
    .map((interest) => {
      const teacher = teacherById.get(interest.user_id);
      if (!teacher) return null;

      const areaName = areaNameById.get(interest.area_id) ?? term;
      return {
        teacher_id: teacher.id,
        full_name: teacher.full_name,
        reputation_score: teacher.reputation_score ?? 0,
        matched_area_id: interest.area_id,
        area_name: areaName,
        weakness_level: 3,
        match_score: Number(teacher.reputation_score ?? 0) + 30,
      } satisfies MatchedTeacher;
    })
    .filter((teacher): teacher is MatchedTeacher => teacher !== null)
    .sort((left, right) => right.match_score - left.match_score || right.reputation_score - left.reputation_score);

  const uniqueTeachers = new Map<string, MatchedTeacher>();
  for (const teacher of ranked) {
    if (!uniqueTeachers.has(teacher.teacher_id)) {
      uniqueTeachers.set(teacher.teacher_id, teacher);
    }
  }

  return [...uniqueTeachers.values()].slice(0, Math.max(1, Math.min(limit, 20)));
}

function normalizeRelation<T>(value: T | T[] | null | undefined): T | null {
  if (Array.isArray(value)) return value[0] ?? null;
  return value ?? null;
}
