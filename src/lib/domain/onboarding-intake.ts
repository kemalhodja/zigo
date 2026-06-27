import type { SupabaseClient } from "@supabase/supabase-js";
import { z } from "zod";

import type { Database } from "@/lib/supabase/database.types";

import type { ExamGoalType } from "./exam-countdown";

export const onboardingIntakeSchema = z.object({
  gradeLevel: z.string().trim().min(1).max(20),
  goalExam: z.enum(["lgs", "yks", "general"]),
  struggleAreaId: z.number().int().positive().optional(),
});

export type OnboardingIntake = {
  userId: string;
  gradeLevel: string | null;
  goalExam: ExamGoalType;
  struggleAreaId: number | null;
  completedAt: string;
};

export async function getOnboardingIntake(
  supabase: SupabaseClient<Database>,
  userId: string,
): Promise<OnboardingIntake | null> {
  const { data, error } = await supabase
    .from("user_onboarding_intake")
    .select("user_id, grade_level, goal_exam, struggle_area_id, completed_at")
    .eq("user_id", userId)
    .maybeSingle();

  if (error) throw error;
  if (!data) return null;

  return {
    userId: data.user_id,
    gradeLevel: data.grade_level,
    goalExam: data.goal_exam as ExamGoalType,
    struggleAreaId: data.struggle_area_id,
    completedAt: data.completed_at,
  };
}

export async function saveOnboardingIntake(
  supabase: SupabaseClient<Database>,
  userId: string,
  input: z.infer<typeof onboardingIntakeSchema>,
) {
  const parsed = onboardingIntakeSchema.parse(input);
  const { data, error } = await supabase
    .from("user_onboarding_intake")
    .upsert(
      {
        user_id: userId,
        grade_level: parsed.gradeLevel,
        goal_exam: parsed.goalExam,
        struggle_area_id: parsed.struggleAreaId ?? null,
        updated_at: new Date().toISOString(),
      },
      { onConflict: "user_id" },
    )
    .select("user_id, grade_level, goal_exam, struggle_area_id, completed_at")
    .single();

  if (error) throw error;
  return data;
}
