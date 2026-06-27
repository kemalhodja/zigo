import type { SupabaseClient } from "@supabase/supabase-js";

import { listBookingsForUser, type LessonBookingListItem } from "@/lib/domain/ecosystem/calendar";
import { getParentWeeklyProgressSummary, type WeeklyProgressSummary } from "@/lib/domain/ecosystem/reporting";
import { getChildProfiles } from "@/lib/domain/children";
import type { Database } from "@/lib/supabase/database.types";

export type TopicSuccessPoint = {
  areaId: number;
  areaName: string;
  successPercent: number;
  attemptCount: number;
};

export type GrowthCurvePoint = {
  date: string;
  averageScore: number;
  activityCount: number;
};

export type UpcomingLessonItem = {
  id: string;
  startTime: string;
  endTime: string;
  teacherName: string;
  childName: string | null;
  areaName: string | null;
  meetingUrl: string | null;
  status: "booked" | "completed" | "cancelled";
};

export type ParentDevelopmentDashboardData = {
  weeklyProgress: WeeklyProgressSummary;
  topicSuccess: TopicSuccessPoint[];
  growthCurve: GrowthCurvePoint[];
  upcomingLessons: UpcomingLessonItem[];
};

export async function getParentDevelopmentDashboardData(
  supabase: SupabaseClient<Database>,
  parentId: string,
  childProfileId?: string,
): Promise<ParentDevelopmentDashboardData> {
  const [weeklyProgress, children, bookings] = await Promise.all([
    getParentWeeklyProgressSummary(supabase, parentId, childProfileId),
    getChildProfiles(supabase),
    listBookingsForUser(supabase, parentId, "parent"),
  ]);

  const childIds = childProfileId
    ? [childProfileId]
    : children.map((child) => child.id);
  const childNameById = new Map(children.map((child) => [child.id, child.display_name]));

  const [topicSuccess, growthCurve] = await Promise.all([
    getTopicSuccessByArea(supabase, childIds),
    getMonthlyGrowthCurve(supabase, childIds),
  ]);

  return {
    weeklyProgress,
    topicSuccess,
    growthCurve,
    upcomingLessons: mapUpcomingLessons(bookings, childNameById),
  };
}

async function getTopicSuccessByArea(
  supabase: SupabaseClient<Database>,
  childProfileIds: string[],
): Promise<TopicSuccessPoint[]> {
  if (childProfileIds.length === 0) return [];

  const since = new Date();
  since.setDate(since.getDate() - 30);

  const { data, error } = await supabase
    .from("quiz_attempts")
    .select(
      `
      score_percent,
      quiz:quiz_id (
        area_id,
        education_areas:area_id ( area_name )
      )
    `,
    )
    .in("child_profile_id", childProfileIds)
    .gte("completed_at", since.toISOString())
    .not("completed_at", "is", null);

  if (error) throw error;

  const byArea = new Map<number, { areaName: string; scores: number[] }>();

  for (const row of data ?? []) {
    const quiz = normalizeRelation(row.quiz);
    const area = normalizeRelation(quiz?.education_areas);
    const areaId = quiz?.area_id;
    if (!areaId || !area?.area_name) continue;

    const bucket = byArea.get(areaId) ?? { areaName: area.area_name, scores: [] };
    bucket.scores.push(Number(row.score_percent ?? 0));
    byArea.set(areaId, bucket);
  }

  return [...byArea.entries()]
    .map(([areaId, value]) => ({
      areaId,
      areaName: value.areaName,
      successPercent: Math.round(
        value.scores.reduce((total, score) => total + score, 0) / value.scores.length,
      ),
      attemptCount: value.scores.length,
    }))
    .sort((left, right) => left.successPercent - right.successPercent);
}

async function getMonthlyGrowthCurve(
  supabase: SupabaseClient<Database>,
  childProfileIds: string[],
): Promise<GrowthCurvePoint[]> {
  if (childProfileIds.length === 0) return [];

  const since = new Date();
  since.setDate(since.getDate() - 30);
  const sinceIso = since.toISOString().slice(0, 10);

  const [quizResult, reportResult] = await Promise.all([
    supabase
      .from("quiz_attempts")
      .select("score_percent, completed_at")
      .in("child_profile_id", childProfileIds)
      .gte("completed_at", since.toISOString())
      .not("completed_at", "is", null),
    supabase
      .from("progress_reports")
      .select("score, report_date")
      .in("child_profile_id", childProfileIds)
      .gte("report_date", sinceIso),
  ]);

  if (quizResult.error) throw quizResult.error;
  if (reportResult.error) throw reportResult.error;

  const byDate = new Map<string, number[]>();

  for (const row of quizResult.data ?? []) {
    const date = (row.completed_at ?? "").slice(0, 10);
    if (!date) continue;
    const bucket = byDate.get(date) ?? [];
    bucket.push(Number(row.score_percent ?? 0));
    byDate.set(date, bucket);
  }

  for (const row of reportResult.data ?? []) {
    const date = row.report_date;
    if (!date) continue;
    const bucket = byDate.get(date) ?? [];
    bucket.push(Number(row.score ?? 0));
    byDate.set(date, bucket);
  }

  const points: GrowthCurvePoint[] = [];
  for (let offset = 29; offset >= 0; offset -= 1) {
    const day = new Date();
    day.setHours(0, 0, 0, 0);
    day.setDate(day.getDate() - offset);
    const key = day.toISOString().slice(0, 10);
    const scores = byDate.get(key) ?? [];
    points.push({
      date: key,
      averageScore:
        scores.length > 0
          ? Math.round(scores.reduce((total, score) => total + score, 0) / scores.length)
          : 0,
      activityCount: scores.length,
    });
  }

  return points;
}

function mapUpcomingLessons(
  bookings: LessonBookingListItem[],
  childNameById: Map<string, string>,
): UpcomingLessonItem[] {
  const now = Date.now();

  return bookings
    .filter((booking) => booking.status === "booked" && new Date(booking.start_time).getTime() > now)
    .sort((left, right) => new Date(left.start_time).getTime() - new Date(right.start_time).getTime())
    .slice(0, 5)
    .map((booking) => {
      const liveLesson = normalizeRelation(booking.live_lessons);
      return {
        id: booking.id,
        startTime: booking.start_time,
        endTime: booking.end_time,
        teacherName: normalizeRelation(booking.teacher)?.full_name ?? "Öğretmen",
        childName: booking.child_profile_id ? childNameById.get(booking.child_profile_id) ?? null : null,
        areaName: booking.area_id ? String(booking.area_id) : null,
        meetingUrl: liveLesson?.meeting_url ?? null,
        status: booking.status,
      };
    });
}

function normalizeRelation<T>(value: T | T[] | null | undefined): T | null {
  if (Array.isArray(value)) return value[0] ?? null;
  return value ?? null;
}
