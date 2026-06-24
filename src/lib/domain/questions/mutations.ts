import type { SupabaseClient } from "@supabase/supabase-js";
import type { z } from "zod";

import { runModeratedFieldsAction, runModeratedSafeTextAction } from "@/lib/domain/moderation-policy";
import type { Database } from "@/lib/supabase/database.types";

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
      const { data, error } = await supabase
        .from("questions")
        .insert({
          author_id: parsed.authorId,
          area_id: parsed.areaId,
          title,
          description,
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
      const { data, error } = await supabase
        .from("answers")
        .insert({
          question_id: parsed.questionId,
          teacher_id: parsed.teacherId,
          content,
        })
        .select("*")
        .single();

      if (error) throw error;
      return data;
    },
  );
}

export async function approveAnswer(supabase: SupabaseClient<Database>, answerId: string) {
  const { error } = await supabase.rpc("approve_answer", { answer_id: answerId });

  if (error) throw error;
}
