import type { SupabaseClient } from "@supabase/supabase-js";
import type { z } from "zod";

import { assertSafeStudentTextAsync } from "@/lib/domain/moderation";
import type { Database } from "@/lib/supabase/database.types";

import { createQuizSchema, submitQuizSchema } from "./schemas";

export async function createTeacherQuiz(
  supabase: SupabaseClient<Database>,
  input: z.infer<typeof createQuizSchema>,
) {
  const parsed = createQuizSchema.parse(input);

  if (parsed.correctOption >= parsed.options.length) {
    throw new Error("Correct option must match one of the quiz options.");
  }

  const [title, questionText, options] = await Promise.all([
    assertSafeStudentTextAsync(parsed.title),
    assertSafeStudentTextAsync(parsed.questionText),
    Promise.all(parsed.options.map((option) => assertSafeStudentTextAsync(option))),
  ]);

  const { data, error } = await supabase
    .from("quizzes")
    .insert({
      teacher_id: parsed.teacherId,
      area_id: parsed.areaId,
      title,
      question_text: questionText,
      options,
      correct_option: parsed.correctOption,
      points_reward: parsed.pointsReward,
    })
    .select("*")
    .single();

  if (error) throw error;

  const { error: syncQuestionsError } = await supabase.rpc("sync_quiz_questions_for_quiz", {
    target_quiz_id: data.id,
  });

  if (syncQuestionsError) throw syncQuestionsError;

  const { error: syncFeedError } = await supabase.rpc("sync_quiz_feed_post", {
    target_quiz_id: data.id,
  });

  if (syncFeedError) throw syncFeedError;
  return data;
}

export async function getQuizQuestionsForPlay(
  supabase: SupabaseClient<Database>,
  quizId: string,
) {
  const { data, error } = await supabase.rpc("get_quiz_questions_for_play", {
    target_quiz_id: quizId,
  });

  if (error) throw error;
  return data ?? [];
}

export async function getMatchedQuizzes(supabase: SupabaseClient<Database>) {
  const { data, error } = await supabase.rpc("get_matched_quizzes");

  if (error) throw error;
  return data;
}

export async function getChildMatchedQuizzes(
  supabase: SupabaseClient<Database>,
  childProfileId: string,
) {
  const { data, error } = await supabase.rpc("get_child_matched_quizzes", {
    target_child_profile_id: childProfileId,
  });

  if (error) throw error;
  return data;
}

export async function submitQuizAttempt(
  supabase: SupabaseClient<Database>,
  input: z.infer<typeof submitQuizSchema>,
) {
  const parsed = submitQuizSchema.parse(input);
  const answerPayload =
    parsed.answers?.map((answer) => ({
      question_id: answer.questionId,
      selected_option: answer.selectedOption,
    })) ?? null;

  if (parsed.childProfileId) {
    if (answerPayload) {
      const { data, error } = await supabase.rpc("submit_child_quiz_attempt_full", {
        target_child_profile_id: parsed.childProfileId,
        target_quiz_id: parsed.quizId,
        answer_payload: answerPayload,
      });

      if (error) throw error;
      return data;
    }

    const { data, error } = await supabase.rpc("submit_child_quiz_attempt", {
      target_child_profile_id: parsed.childProfileId,
      target_quiz_id: parsed.quizId,
      selected_option: parsed.selectedOption ?? 0,
    });

    if (error) throw error;
    return data;
  }

  if (answerPayload) {
    const { data, error } = await supabase.rpc("submit_quiz_attempt_full", {
      target_quiz_id: parsed.quizId,
      answer_payload: answerPayload,
    });

    if (error) throw error;
    return data;
  }

  const { data, error } = await supabase.rpc("submit_quiz_attempt", {
    target_quiz_id: parsed.quizId,
    selected_option: parsed.selectedOption ?? 0,
  });

  if (error) throw error;
  return data;
}
