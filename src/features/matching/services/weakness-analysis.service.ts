import type { SupabaseClient } from "@supabase/supabase-js";

import { upsertStudentNeed } from "@/lib/domain/ecosystem/matching";
import type { Database } from "@/lib/supabase/database.types";

export type AssessmentSession = {
  areaId: number;
  areaName: string;
  scorePercent: number;
  source: "quiz" | "duel";
  completedAt: string;
};

export type DetectedWeakness = {
  areaId: number;
  areaName: string;
  averageScore: number;
  weaknessLevel: number;
  sampleCount: number;
};

export type WeaknessAnalysisResult = {
  sessionsAnalyzed: number;
  weaknesses: DetectedWeakness[];
};

const WEAKNESS_SCORE_THRESHOLD = 70;

export function scoreToWeaknessLevel(averageScore: number): number {
  if (averageScore < 40) return 5;
  if (averageScore < 50) return 4;
  if (averageScore < 60) return 3;
  if (averageScore < 70) return 2;
  return 1;
}

export function detectWeaknessesFromSessions(sessions: AssessmentSession[]): DetectedWeakness[] {
  const weakSessions = sessions.filter((session) => session.scorePercent < WEAKNESS_SCORE_THRESHOLD);
  if (weakSessions.length === 0) return [];

  const byArea = new Map<number, { areaName: string; scores: number[] }>();

  for (const session of weakSessions) {
    const existing = byArea.get(session.areaId);
    if (existing) {
      existing.scores.push(session.scorePercent);
      continue;
    }
    byArea.set(session.areaId, { areaName: session.areaName, scores: [session.scorePercent] });
  }

  return [...byArea.entries()]
    .map(([areaId, value]) => {
      const averageScore =
        value.scores.reduce((total, score) => total + score, 0) / value.scores.length;
      return {
        areaId,
        areaName: value.areaName,
        averageScore: Math.round(averageScore * 10) / 10,
        weaknessLevel: scoreToWeaknessLevel(averageScore),
        sampleCount: value.scores.length,
      };
    })
    .sort((left, right) => left.averageScore - right.averageScore);
}

export function mergeRecentAssessmentSessions(
  quizSessions: AssessmentSession[],
  duelSessions: AssessmentSession[],
  limit = 5,
): AssessmentSession[] {
  return [...quizSessions, ...duelSessions]
    .sort((left, right) => new Date(right.completedAt).getTime() - new Date(left.completedAt).getTime())
    .slice(0, limit);
}

type QuizAttemptRow = {
  score_percent: number | null;
  completed_at: string | null;
  created_at: string;
  quiz: QuizRelation | QuizRelation[] | null;
};

type QuizRelation = {
  area_id: number | null;
  education_areas: AreaRelation | AreaRelation[] | null;
};

type AreaRelation = {
  area_name: string;
};

async function fetchRecentQuizSessions(
  supabase: SupabaseClient<Database>,
  input: { studentUserId?: string; childProfileId?: string },
  limit = 5,
): Promise<AssessmentSession[]> {
  let query = supabase
    .from("quiz_attempts")
    .select(
      `
      score_percent,
      completed_at,
      created_at,
      quiz:quiz_id (
        area_id,
        education_areas:area_id ( area_name )
      )
    `,
    )
    .not("completed_at", "is", null)
    .order("completed_at", { ascending: false })
    .limit(limit);

  if (input.studentUserId) {
    query = query.eq("user_id", input.studentUserId);
  } else if (input.childProfileId) {
    query = query.eq("child_profile_id", input.childProfileId);
  } else {
    return [];
  }

  const { data, error } = await query;
  if (error) throw error;

  const sessions: AssessmentSession[] = [];
  for (const row of (data ?? []) as QuizAttemptRow[]) {
    const quiz = normalizeRelation(row.quiz);
    const area = normalizeRelation(quiz?.education_areas);
    const areaId = quiz?.area_id;
    if (!areaId || !area?.area_name) continue;

    sessions.push({
      areaId,
      areaName: area.area_name,
      scorePercent: Number(row.score_percent ?? 0),
      source: "quiz",
      completedAt: row.completed_at ?? row.created_at ?? new Date().toISOString(),
    });
  }

  return sessions;
}

async function fetchRecentDuelSessions(
  supabase: SupabaseClient<Database>,
  input: { studentUserId?: string; childProfileId?: string },
  limit = 5,
): Promise<AssessmentSession[]> {
  if (!input.studentUserId) return [];

  const { data, error } = await supabase
    .from("learning_events")
    .select("target_id, created_at")
    .eq("user_id", input.studentUserId)
    .eq("action_type", "duel_win")
    .order("created_at", { ascending: false })
    .limit(limit);

  if (error) throw error;

  return mapDuelEventsToSessions(
    supabase,
    (data ?? []).map((row) => ({
      quizId: row.target_id,
      completedAt: row.created_at,
    })),
  );
}

async function mapDuelEventsToSessions(
  supabase: SupabaseClient<Database>,
  events: Array<{ quizId: string; completedAt: string }>,
): Promise<AssessmentSession[]> {
  if (events.length === 0) return [];

  const quizIds = [...new Set(events.map((event) => event.quizId))];
  const { data, error } = await supabase
    .from("quizzes")
    .select("id, area_id, education_areas:area_id ( area_name )")
    .in("id", quizIds);

  if (error) throw error;

  const quizById = new Map(
    (data ?? []).map((quiz) => {
      const area = normalizeRelation(quiz.education_areas as AreaRelation | AreaRelation[] | null);
      return [quiz.id, { areaId: quiz.area_id, areaName: area?.area_name ?? "Düello" }];
    }),
  );

  const sessions: AssessmentSession[] = [];
  for (const event of events) {
    const quiz = quizById.get(event.quizId);
    if (!quiz?.areaId) continue;

    sessions.push({
      areaId: quiz.areaId,
      areaName: quiz.areaName,
      scorePercent: 75,
      source: "duel",
      completedAt: event.completedAt,
    });
  }

  return sessions;
}

export async function analyzeWeaknesses(
  supabase: SupabaseClient<Database>,
  input: { studentUserId?: string; childProfileId?: string; syncNeeds?: boolean },
): Promise<WeaknessAnalysisResult> {
  if (!input.studentUserId && !input.childProfileId) {
    throw new Error("studentUserId or childProfileId is required.");
  }

  const [quizSessions, duelSessions] = await Promise.all([
    fetchRecentQuizSessions(supabase, input, 5),
    fetchRecentDuelSessions(supabase, input, 5),
  ]);

  const recentSessions = mergeRecentAssessmentSessions(quizSessions, duelSessions, 5);
  const weaknesses = detectWeaknessesFromSessions(recentSessions);

  if (input.syncNeeds !== false) {
    await Promise.all(
      weaknesses.map((weakness) =>
        upsertStudentNeed(supabase, {
          studentUserId: input.studentUserId,
          childProfileId: input.childProfileId,
          areaId: weakness.areaId,
          weaknessLevel: weakness.weaknessLevel,
        }),
      ),
    );
  }

  return {
    sessionsAnalyzed: recentSessions.length,
    weaknesses,
  };
}

function normalizeRelation<T>(value: T | T[] | null | undefined): T | null {
  if (Array.isArray(value)) return value[0] ?? null;
  return value ?? null;
}
