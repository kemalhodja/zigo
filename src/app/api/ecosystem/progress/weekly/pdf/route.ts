import { NextResponse } from "next/server";

import { isErrorResponse, requireAuthenticatedProfile } from "@/features/shared/api/require-auth";
import { withApiHandler } from "@/features/shared/api/with-api-handler";
import { getParentWeeklyProgressSummary, listRecentProgressReports } from "@/lib/domain/ecosystem/reporting";
import { buildWeeklyProgressHtml } from "@/lib/domain/progress-pdf";
import { createClient } from "@/lib/supabase/server";

export const GET = withApiHandler(async (request) => {
  const supabase = await createClient();
  const profile = await requireAuthenticatedProfile(supabase, { roles: ["parent"] });
  if (isErrorResponse(profile)) return profile;

  const childProfileId = new URL(request.url).searchParams.get("childProfileId") ?? undefined;
  const summary = await getParentWeeklyProgressSummary(supabase, profile.id, childProfileId);
  type ReportRow = {
    score: number;
    feedback: string | null;
    area?: { area_name?: string } | null;
  };

  const reports = (await listRecentProgressReports(supabase, { childProfileId }, 14)) as ReportRow[];

  const topicRows = reports.map((row) => ({
    area: row.area?.area_name ?? "Genel",
    score: row.score,
    feedback: row.feedback,
  }));

  const weekLabel = new Date().toLocaleDateString("tr-TR", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });

  const html = buildWeeklyProgressHtml({
    childName: childProfileId ? "Çocuk profili" : "Öğrenci",
    parentName: profile.full_name,
    weekLabel: `Hafta · ${weekLabel}`,
    summary,
    topicRows,
  });

  return new NextResponse(html, {
    status: 200,
    headers: {
      "Content-Type": "text/html; charset=utf-8",
      "Content-Disposition": 'attachment; filename="zigo-haftalik-rapor.html"',
    },
  });
});
