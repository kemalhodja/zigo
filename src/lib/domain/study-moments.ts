import type { SupabaseClient } from "@supabase/supabase-js";
import { z } from "zod";

import { isLocalDemoSupabase } from "@/lib/domain/demo-env";
import { POMODORO_SECONDS } from "@/lib/domain/focus-gamification";
import { assertSafeStudentTextAsync } from "@/lib/domain/moderation";
import type { Database } from "@/lib/supabase/database.types";

export type StudyMoment = {
  id: string;
  user_id: string;
  full_name: string;
  area_id: number;
  area_name: string;
  topic_label: string;
  duration_minutes: number;
  caption: string | null;
  created_at: string;
  cheer_count?: number;
};

export type FocusSessionRow = {
  id: string;
  user_id: string;
  area_id: number | null;
  topic_label: string;
  target_seconds: number;
  started_at: string;
  completed_at: string | null;
  status: "in_progress" | "completed" | "cancelled";
  points_awarded: number;
};

export const startFocusSessionSchema = z.object({
  areaId: z.coerce.number().int().positive().optional(),
  topicLabel: z.string().trim().min(2).max(120).default("Focused study"),
  targetSeconds: z.coerce.number().int().min(60).max(1500).optional(),
  childProfileId: z.string().uuid().optional(),
});

export const completeFocusSessionSchema = z.object({
  sessionId: z.string().uuid(),
});

export const shareStudyMomentSchema = z.object({
  sessionId: z.string().uuid(),
  caption: z.string().trim().max(280).optional(),
});

export async function startFocusSession(
  supabase: SupabaseClient<Database>,
  input: z.infer<typeof startFocusSessionSchema>,
) {
  const parsed = startFocusSessionSchema.parse(input);
  const targetSeconds =
    parsed.targetSeconds ??
    (isLocalDemoSupabase() || process.env.NEXT_PUBLIC_FOCUS_DEMO_SECONDS === "true" ? 90 : POMODORO_SECONDS);

  const topicLabel = await assertSafeStudentTextAsync(parsed.topicLabel);

  const { data, error } = await supabase.rpc("start_focus_session", {
    p_area_id: parsed.areaId ?? undefined,
    p_topic_label: topicLabel,
    p_target_seconds: targetSeconds,
    p_child_profile_id: parsed.childProfileId,
  });

  if (error) throw error;
  return data as FocusSessionRow;
}

export async function completeFocusSession(
  supabase: SupabaseClient<Database>,
  input: z.infer<typeof completeFocusSessionSchema>,
) {
  const parsed = completeFocusSessionSchema.parse(input);

  const { data, error } = await supabase.rpc("complete_focus_session", {
    p_session_id: parsed.sessionId,
  });

  if (error) throw error;
  const [result] = data ?? [];
  if (!result) {
    throw new Error("Focus session could not be completed.");
  }

  return result as {
    event_id: string | null;
    points_awarded: number;
    already_awarded: boolean;
    total_points: number;
    session_id: string;
  };
}

export async function shareStudyMoment(
  supabase: SupabaseClient<Database>,
  input: z.infer<typeof shareStudyMomentSchema>,
) {
  const parsed = shareStudyMomentSchema.parse(input);
  const caption = parsed.caption ? await assertSafeStudentTextAsync(parsed.caption) : undefined;

  const { data, error } = await supabase.rpc("share_study_moment", {
    p_session_id: parsed.sessionId,
    p_caption: caption,
  });

  if (error) throw error;
  return data;
}

export async function getMatchedStudyMoments(supabase: SupabaseClient<Database>) {
  const { data, error } = await supabase.rpc("get_matched_study_moments");
  if (error) throw error;
  return (data ?? []) as StudyMoment[];
}
