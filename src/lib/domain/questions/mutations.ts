import type { SupabaseClient } from "@supabase/supabase-js";
import type { z } from "zod";

import { runModeratedFieldsAction, runModeratedSafeTextAction } from "@/lib/domain/moderation-policy";
import type { Database } from "@/lib/supabase/database.types";
import { asUntyped } from "@/lib/supabase/helpers";

import { createAnswerSchema, createQuestionSchema } from "./schemas";

export async function createQuestion(
  supabase: SupabaseClient<Database>,
  input: z.infer<typeof createQuestionSchema>,
) {
  const parsed = createQuestionSchema.parse(input);

  return runModeratedFieldsAction(
    supabase,
    {
      userId: parsed.authorId,
      contentKind: "question",
      fields: [
        { label: "title", text: parsed.title },
        { label: "description", text: parsed.description },
      ],
    },
    async ([title, description]) => {
      const { data, error } = await asUntyped(supabase)
        .from("questions")
        .insert({
          author_id: parsed.authorId,
          area_id: parsed.areaId,
          title,
          description,
          image_url: parsed.imageUrl ?? null,
        })
        .select("*")
        .single();

      if (error) throw error;
      return data;
    },
  );
}

export async function createTeacherAnswer(
  supabase: SupabaseClient<Database>,
  input: z.infer<typeof createAnswerSchema>,
) {
  const parsed = createAnswerSchema.parse(input);

  return runModeratedSafeTextAction(
    supabase,
    {
      userId: parsed.teacherId,
      contentKind: "answer",
      text: parsed.content,
    },
    async (content) => {
      const { data, error } = await asUntyped(supabase)
        .from("answers")
        .insert({
          question_id: parsed.questionId,
          teacher_id: parsed.teacherId,
          content,
          video_url: parsed.videoUrl ?? null,
          audio_url: parsed.audioUrl ?? null,
          media_duration_sec: parsed.mediaDurationSec ?? null,
        })
        .select("*")
        .single();

      if (error) throw error;

      // Automatically mark question as answered/resolved
      await asUntyped(supabase)
        .from("questions")
        .update({ is_resolved: true })
        .eq("id", parsed.questionId);

      return data;
    },
  );
}

export async function approveAnswer(supabase: SupabaseClient<Database>, answerId: string) {
  const { error } = await supabase.rpc("approve_answer", { answer_id: answerId });

  if (error) throw error;
}
