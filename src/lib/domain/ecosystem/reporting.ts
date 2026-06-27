import type { SupabaseClient } from "@supabase/supabase-js";
import { z } from "zod";

import type { Database } from "@/lib/supabase/database.types";

export type WeeklyProgressSummary = {
  reportCount: number;
  averageScore: number;
  topArea: string | null;
  completedBookings: number;
};

export const createProgressReportSchema = z.object({
  studentUserId: z.string().uuid().optional(),
  childProfileId: z.string().uuid().optional(),
  areaId: z.number().int().positive(),
  score: z.number().int().min(0).max(100),
  reportDate: z.string().date().optional(),
  feedback: z.string().trim().max(2000).optional(),
});

export async function getParentWeeklyProgressSummary(
  supabase: SupabaseClient<Database>,
  parentId: string,
  childProfileId?: string,
): Promise<WeeklyProgressSummary> {
  const { data, error } = await supabase.rpc("get_parent_weekly_progress_summary", {
    for_parent_id: parentId,
    for_child_profile_id: childProfileId ?? undefined,
  });

  if (error) throw error;

  const summary = (data ?? {}) as Partial<WeeklyProgressSummary>;
  return {
    reportCount: Number(summary.reportCount ?? 0),
    averageScore: Number(summary.averageScore ?? 0),
    topArea: summary.topArea ?? null,
    completedBookings: Number(summary.completedBookings ?? 0),
  };
}

export async function createProgressReport(
  supabase: SupabaseClient<Database>,
  input: z.infer<typeof createProgressReportSchema>,
) {
  const parsed = createProgressReportSchema.parse(input);
  if (!parsed.studentUserId && !parsed.childProfileId) {
    throw new Error("studentUserId or childProfileId is required.");
  }

  const { data, error } = await supabase
    .from("progress_reports")
    .insert({
      student_user_id: parsed.studentUserId ?? null,
      child_profile_id: parsed.childProfileId ?? null,
      area_id: parsed.areaId,
      score: parsed.score,
      report_date: parsed.reportDate ?? new Date().toISOString().slice(0, 10),
      feedback: parsed.feedback ?? null,
    })
    .select("*")
    .single();

  if (error) throw error;
  return data;
}

export async function listRecentProgressReports(
  supabase: SupabaseClient<Database>,
  input: { childProfileId?: string; studentUserId?: string },
  limit = 14,
) {
  let query = supabase
    .from("progress_reports")
    .select("*, area:area_id(area_name)")
    .order("report_date", { ascending: false })
    .limit(limit);

  if (input.childProfileId) {
    query = query.eq("child_profile_id", input.childProfileId);
  } else if (input.studentUserId) {
    query = query.eq("student_user_id", input.studentUserId);
  }

  const { data, error } = await query;
  if (error) throw error;
  return data ?? [];
}
