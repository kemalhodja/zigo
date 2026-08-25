import type { SupabaseClient } from "@supabase/supabase-js";
import { z } from "zod";

import type { Database } from "@/lib/supabase/database.types";

export const quizQuestionSchema = z.object({
  text: z.string().trim().min(3, "Soru en az 3 karakter olmalı.").max(240),
  options: z
    .array(z.string().trim().min(1).max(80))
    .length(4, "Her soruda 4 seçenek olmalı."),
  correctIndex: z.number().int().min(0).max(3),
});

export const userQuizSchema = z.object({
  title: z.string().trim().min(3, "Başlık en az 3 karakter olmalı.").max(80),
  description: z.string().trim().max(200).optional(),
  areaId: z.number().int().positive().nullish(),
  questions: z.array(quizQuestionSchema).min(3, "En az 3 soru ekle.").max(10),
});

export type UserQuizInput = z.infer<typeof userQuizSchema>;
export type UserQuizQuestion = z.infer<typeof quizQuestionSchema>;

export type UserQuizStatus = "pending" | "approved" | "rejected";

export type UserQuizRow = {
  id: string;
  creator_id: string;
  title: string;
  description: string | null;
  status: UserQuizStatus;
  play_count: number;
  created_at: string;
};

/** Strips answer keys for solving — clients must never receive correctIndex. */
export function toSolvePayload(
  quiz: { id: string; title: string; description: string | null; questions: UserQuizQuestion[] },
) {
  return {
    id: quiz.id,
    title: quiz.title,
    description: quiz.description,
    totalQuestions: quiz.questions.length,
    questions: quiz.questions.map((q) => ({
      text: q.text,
      options: q.options,
    })),
  };
}

export async function createUserQuiz(
  supabase: SupabaseClient<Database>,
  creatorId: string,
  input: UserQuizInput,
  options: { autoApprove: boolean },
): Promise<{ ok: true; id: string; status: UserQuizStatus } | { ok: false; error: string }> {
  // Server-side answer-key sanity: correctIndex must point at a real option.
  for (const q of input.questions) {
    if (q.correctIndex >= q.options.length) {
      return { ok: false, error: "Bir soruda doğru cevap işareti geçersiz." };
    }
  }

  const status: UserQuizStatus = options.autoApprove ? "approved" : "pending";
  const { data, error } = await supabase
    .from("user_quizzes")
    .insert({
      creator_id: creatorId,
      title: input.title,
      description: input.description ?? null,
      area_id: input.areaId ?? null,
      questions: input.questions,
      status,
    })
    .select("id")
    .single();

  if (error || !data) {
    return { ok: false, error: "Quiz kaydedilemedi." };
  }
  return { ok: true, id: data.id, status };
}

export async function listApprovedUserQuizzes(
  supabase: SupabaseClient<Database>,
  limit = 20,
): Promise<UserQuizRow[]> {
  const { data } = await supabase
    .from("user_quizzes")
    .select("id, creator_id, title, description, status, play_count, created_at")
    .eq("status", "approved")
    .order("created_at", { ascending: false })
    .limit(limit);
  return (data ?? []) as UserQuizRow[];
}

export async function listOwnUserQuizzes(
  supabase: SupabaseClient<Database>,
  creatorId: string,
): Promise<UserQuizRow[]> {
  const { data } = await supabase
    .from("user_quizzes")
    .select("id, creator_id, title, description, status, play_count, created_at")
    .eq("creator_id", creatorId)
    .order("created_at", { ascending: false })
    .limit(50);
  return (data ?? []) as UserQuizRow[];
}
