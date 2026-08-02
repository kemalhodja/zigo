import type { SupabaseClient } from "@supabase/supabase-js";

import type { Database } from "@/lib/supabase/database.types";

export const LEARNING_RETENTION_TARGET = 0.25;

export type LearningEventStamp = {
  user_id: string;
  created_at: string;
};

export type LearningActionRetentionReport = {
  cohortStartDaysAgo: number;
  cohortEndDaysAgo: number;
  returnWithinDays: number;
  cohortSize: number;
  retainedCount: number;
  retentionRatio: number;
  onTarget: boolean;
};

function daysToMs(days: number) {
  return days * 24 * 60 * 60 * 1000;
}

export function buildLearningActionRetention(
  events: LearningEventStamp[],
  options?: {
    now?: Date;
    cohortStartDaysAgo?: number;
    cohortEndDaysAgo?: number;
    returnWithinDays?: number;
    targetRatio?: number;
  },
): LearningActionRetentionReport {
  const now = options?.now ?? new Date();
  const cohortStartDaysAgo = options?.cohortStartDaysAgo ?? 7;
  const cohortEndDaysAgo = options?.cohortEndDaysAgo ?? 14;
  const returnWithinDays = options?.returnWithinDays ?? 7;
  const targetRatio = options?.targetRatio ?? LEARNING_RETENTION_TARGET;

  const cohortWindowStart = now.getTime() - daysToMs(cohortEndDaysAgo);
  const cohortWindowEnd = now.getTime() - daysToMs(cohortStartDaysAgo);

  const eventsByUser = new Map<string, number[]>();
  for (const event of events) {
    const stamp = new Date(event.created_at).getTime();
    if (Number.isNaN(stamp)) continue;
    const list = eventsByUser.get(event.user_id) ?? [];
    list.push(stamp);
    eventsByUser.set(event.user_id, list);
  }

  let cohortSize = 0;
  let retainedCount = 0;

  for (const stamps of eventsByUser.values()) {
    stamps.sort((a, b) => a - b);
    const first = stamps[0];
    if (first == null) continue;
    if (first < cohortWindowStart || first > cohortWindowEnd) continue;

    cohortSize += 1;
    const returnDeadline = first + daysToMs(returnWithinDays);
    const returned = stamps.some((stamp) => stamp > first && stamp <= returnDeadline);
    if (returned) retainedCount += 1;
  }

  const retentionRatio = cohortSize === 0 ? 0 : retainedCount / cohortSize;

  return {
    cohortStartDaysAgo,
    cohortEndDaysAgo,
    returnWithinDays,
    cohortSize,
    retainedCount,
    retentionRatio,
    onTarget: retentionRatio >= targetRatio,
  };
}

export function formatRetentionPercent(ratio: number) {
  return `${Math.round(ratio * 100)}%`;
}

export async function getLearningActionRetention(
  supabase: SupabaseClient<Database>,
  options?: {
    cohortStartDaysAgo?: number;
    cohortEndDaysAgo?: number;
    returnWithinDays?: number;
  },
): Promise<LearningActionRetentionReport> {
  const cohortEndDaysAgo = options?.cohortEndDaysAgo ?? 14;
  const returnWithinDays = options?.returnWithinDays ?? 7;
  // Look back far enough that the earliest stamp in-window approximates cohort "day 0".
  const lookbackDays = Math.max(30, cohortEndDaysAgo + returnWithinDays);
  const sinceIso = new Date(Date.now() - daysToMs(lookbackDays)).toISOString();

  const { data, error } = await supabase
    .from("learning_events")
    .select("user_id, created_at")
    .gte("created_at", sinceIso)
    .order("created_at", { ascending: true });

  if (error) throw error;

  return buildLearningActionRetention(data ?? [], {
    cohortStartDaysAgo: options?.cohortStartDaysAgo,
    cohortEndDaysAgo,
    returnWithinDays,
  });
}
