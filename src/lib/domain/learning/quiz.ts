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

  const [title, moderatedQuestions] = await Promise.all([
    assertSafeStudentTextAsync(parsed.title),
    Promise.all(
      parsed.questions.map(async (question) => ({
        questionText: await assertSafeStudentTextAsync(question.questionText),
        options: await Promise.all(question.options.map((option) => assertSafeStudentTextAsync(option))),
        correctOption: question.correctOption,
        imageUrl: question.imageUrl ?? null,
      })),
    ),
  ]);

  const moderatedFirst = moderatedQuestions[0]!;

  const { data, error } = await supabase
    .from("quizzes")
    .insert({
      teacher_id: parsed.teacherId,
      area_id: parsed.areaId,
      title,
      // Legacy single-question columns keep Q1 for older feed/list surfaces.
      question_text: moderatedFirst.questionText,
      options: moderatedFirst.options,
      correct_option: moderatedFirst.correctOption,
      points_reward: parsed.pointsReward,
    })
    .select("*")
    .single();

  if (error) throw error;

  const { error: questionsError } = await (supabase.from("quiz_questions") as unknown as { insert: (data: Record<string, unknown>[]) => Promise<{ error: unknown }> }).insert(
    moderatedQuestions.map((question, index) => ({
      quiz_id: data.id,
      question_text: question.questionText,
      options: question.options,
      correct_option: question.correctOption,
      sort_order: index,
      image_url: question.imageUrl ?? null,
    })),
  );

  if (questionsError) {
    await supabase.from("quizzes").delete().eq("id", data.id);
    throw questionsError;
  }

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
