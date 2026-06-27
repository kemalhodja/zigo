import type { SupabaseClient } from "@supabase/supabase-js";

import {
  findBestTeachers,
  findTeachersBySubject,
  type MatchedTeacher,
} from "@/lib/domain/ecosystem/matching";
import type { Database } from "@/lib/supabase/database.types";

import { analyzeWeaknesses, type DetectedWeakness } from "./weakness-analysis.service";

export type SmartRecommendationsResult = {
  sessionsAnalyzed: number;
  weaknesses: DetectedWeakness[];
  teachers: MatchedTeacher[];
};

export async function getSmartRecommendations(
  supabase: SupabaseClient<Database>,
  input: {
    studentUserId?: string;
    childProfileId?: string;
    limit?: number;
    autoAnalyze?: boolean;
  },
): Promise<SmartRecommendationsResult> {
  const analysis = input.autoAnalyze === false
    ? { sessionsAnalyzed: 0, weaknesses: [] as DetectedWeakness[] }
    : await analyzeWeaknesses(supabase, {
        studentUserId: input.studentUserId,
        childProfileId: input.childProfileId,
        syncNeeds: true,
      });

  const teachers = await findBestTeachers(supabase, {
    studentUserId: input.studentUserId,
    childProfileId: input.childProfileId,
    limit: input.limit ?? 5,
  });

  return {
    ...analysis,
    teachers,
  };
}

export async function getTeachersForSubject(
  supabase: SupabaseClient<Database>,
  subject: string,
  limit = 5,
): Promise<MatchedTeacher[]> {
  return findTeachersBySubject(supabase, subject, limit);
}
