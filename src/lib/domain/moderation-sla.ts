import type { SupabaseClient } from "@supabase/supabase-js";

import type { ContentReportStatus, Database } from "@/lib/supabase/database.types";

/** Target max age for open reports / pending safety items before SLA breach. */
export const MODERATION_SLA_HOURS = 24;

export type ModerationQueueStamp = {
  id: string;
  created_at: string;
  status?: string;
  resolved_at?: string | null;
};

export type ModerationSlaReport = {
  slaHours: number;
  openReports: number;
  breachedReports: number;
  pendingSafety: number;
  breachedSafety: number;
  resolvedSampleSize: number;
  medianResolveHours: number | null;
  onTarget: boolean;
};

function hoursBetween(startMs: number, endMs: number) {
  return (endMs - startMs) / (1000 * 60 * 60);
}

export function ageHours(createdAt: string, now = new Date()) {
  return hoursBetween(new Date(createdAt).getTime(), now.getTime());
}

export function isSlaBreached(createdAt: string, options?: { now?: Date; slaHours?: number }) {
  const slaHours = options?.slaHours ?? MODERATION_SLA_HOURS;
  return ageHours(createdAt, options?.now) > slaHours;
}

/** Oldest breached first, then oldest non-breached — actionable triage order. */
export function sortModerationQueueBySla<T extends { created_at: string }>(
  items: T[],
  options?: { now?: Date; slaHours?: number },
): T[] {
  const now = options?.now ?? new Date();
  const slaHours = options?.slaHours ?? MODERATION_SLA_HOURS;

  return [...items].sort((left, right) => {
    const leftBreached = isSlaBreached(left.created_at, { now, slaHours });
    const rightBreached = isSlaBreached(right.created_at, { now, slaHours });
    if (leftBreached !== rightBreached) return leftBreached ? -1 : 1;
    return new Date(left.created_at).getTime() - new Date(right.created_at).getTime();
  });
}

export function formatSlaAgeHours(createdAt: string, now = new Date()) {
  const hours = ageHours(createdAt, now);
  if (hours < 1) return "<1h";
  if (hours < 24) return `${Math.floor(hours)}h`;
  const days = Math.floor(hours / 24);
  const rem = Math.floor(hours % 24);
  return rem > 0 ? `${days}d ${rem}h` : `${days}d`;
}

export function median(values: number[]) {
  if (values.length === 0) return null;
  const sorted = [...values].sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);
  if (sorted.length % 2 === 0) {
    return ((sorted[mid - 1] ?? 0) + (sorted[mid] ?? 0)) / 2;
  }
  return sorted[mid] ?? null;
}

export function buildModerationSlaReport(input: {
  reports: ModerationQueueStamp[];
  safetyItems: ModerationQueueStamp[];
  now?: Date;
  slaHours?: number;
}): ModerationSlaReport {
  const now = input.now ?? new Date();
  const slaHours = input.slaHours ?? MODERATION_SLA_HOURS;

  const openReports = input.reports.filter(
    (report) => report.status === "open" || report.status === "reviewing",
  );
  const breachedReports = openReports.filter((report) => isSlaBreached(report.created_at, { now, slaHours }));

  const pendingSafety = input.safetyItems;
  const breachedSafety = pendingSafety.filter((item) => isSlaBreached(item.created_at, { now, slaHours }));

  const resolveHours = input.reports
    .filter((report) => report.resolved_at && (report.status === "resolved" || report.status === "dismissed"))
    .map((report) => hoursBetween(new Date(report.created_at).getTime(), new Date(report.resolved_at!).getTime()))
    .filter((value) => Number.isFinite(value) && value >= 0);

  const medianResolveHours = median(resolveHours);

  return {
    slaHours,
    openReports: openReports.length,
    breachedReports: breachedReports.length,
    pendingSafety: pendingSafety.length,
    breachedSafety: breachedSafety.length,
    resolvedSampleSize: resolveHours.length,
    medianResolveHours,
    onTarget: breachedReports.length === 0 && breachedSafety.length === 0,
  };
}

export function resolveAtForStatus(
  nextStatus: ContentReportStatus,
  previousResolvedAt: string | null | undefined,
  now = new Date(),
) {
  if (nextStatus === "resolved" || nextStatus === "dismissed") {
    return previousResolvedAt ?? now.toISOString();
  }
  return null;
}

export async function getModerationSlaReport(
  supabase: SupabaseClient<Database>,
  options?: { slaHours?: number },
): Promise<ModerationSlaReport> {
  const [reportsResult, commentsResult, repliesResult] = await Promise.all([
    supabase
      .from("content_reports")
      .select("id, status, created_at, resolved_at")
      .order("created_at", { ascending: true })
      .limit(500),
    supabase
      .from("post_comments")
      .select("id, created_at, moderation_status")
      .eq("moderation_status", "pending")
      .order("created_at", { ascending: true })
      .limit(200),
    supabase
      .from("story_replies")
      .select("id, created_at, moderation_status")
      .eq("moderation_status", "pending")
      .order("created_at", { ascending: true })
      .limit(200),
  ]);

  if (reportsResult.error) throw reportsResult.error;
  if (commentsResult.error) throw commentsResult.error;
  if (repliesResult.error) throw repliesResult.error;

  return buildModerationSlaReport({
    reports: reportsResult.data ?? [],
    safetyItems: [
      ...(commentsResult.data ?? []).map((item) => ({
        id: item.id,
        created_at: item.created_at,
        status: item.moderation_status,
      })),
      ...(repliesResult.data ?? []).map((item) => ({
        id: item.id,
        created_at: item.created_at,
        status: item.moderation_status,
      })),
    ],
    slaHours: options?.slaHours,
  });
}
