import type { SupabaseClient } from "@supabase/supabase-js";
import { z } from "zod";

import type { Database } from "@/lib/supabase/database.types";

export const quizQuestionSchema = z.object({
  text: z.string().trim().min(3, "Soru en az 3 karakter olmalı.").max(500),
  options: z
    .array(z.string().trim().min(1, "Seçenek boş bırakılamaz.").max(140))
    .min(2, "Her soruda en az 2 seçenek olmalı.")
    .max(5, "Her soruda en fazla 5 seçenek olabilir."),
  correctIndex: z.number().int().min(0).max(4),
  type: z.enum(["multiple_choice", "true_false"]).optional().default("multiple_choice"),
  difficulty: z.enum(["easy", "medium", "hard"]).optional().default("medium"),
  explanation: z.string().trim().max(600).optional().nullable(),
  imageUrl: z.string().trim().max(500).optional().nullable(),
});

export const userQuizSchema = z.object({
  title: z.string().trim().min(3, "Başlık en az 3 karakter olmalı.").max(100),
  description: z.string().trim().max(300).optional().nullable(),
  areaId: z.number().int().positive().nullish(),
  difficulty: z.enum(["easy", "medium", "hard", "mixed"]).optional().default("medium"),
  targetGrade: z.string().trim().max(50).optional().nullable(),
  questions: z.array(quizQuestionSchema).min(3, "En az 3 soru ekle.").max(10, "En fazla 10 soru eklenebilir."),
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

/** Strips answer keys and private explanations for solving — clients must never receive correctIndex beforehand. */
export function toSolvePayload(
  quiz: {
    id: string;
    title: string;
    description: string | null;
    difficulty?: "easy" | "medium" | "hard" | "mixed";
    questions: UserQuizQuestion[];
  },
) {
  return {
    id: quiz.id,
    title: quiz.title,
    description: quiz.description,
    difficulty: quiz.difficulty ?? "medium",
    totalQuestions: quiz.questions.length,
    questions: quiz.questions.map((q) => ({
      text: q.text,
      options: q.options,
      type: q.type ?? (q.options.length === 2 ? "true_false" : "multiple_choice"),
      difficulty: q.difficulty ?? "medium",
      imageUrl: q.imageUrl || null,
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
  for (let idx = 0; idx < input.questions.length; idx++) {
    const q = input.questions[idx];
    if (q.correctIndex < 0 || q.correctIndex >= q.options.length) {
      return { ok: false, error: `${idx + 1}. soruda doğru cevap işareti seçenek sayısını aşıyor.` };
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
