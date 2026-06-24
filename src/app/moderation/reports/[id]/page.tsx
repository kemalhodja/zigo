import Link from "next/link";

import { SocialPill } from "@/components/social-primitives";
import { StateCard } from "@/components/state-card";
import { hasSupabaseEnv } from "@/lib/config";
import { getCurrentProfile } from "@/lib/domain/profiles";
import { getUserContentReports, type UserContentReport } from "@/lib/domain/social";
import { getServerMessages } from "@/lib/i18n/server";
import { createClient } from "@/lib/supabase/server";

type ReportDetailPageProps = {
  params: Promise<{ id: string }>;
};

type ReportDetail = {
  id: string;
  caption: string;
  reason: string;
  status: string;
  mediaType: string;
  createdAt: string;
};

export default async function ReportDetailPage({ params }: ReportDetailPageProps) {
  const { id } = await params;
  const m = await getServerMessages();
  const rd = m.reportDetailPage;
  const report = await getReportDetail(id, rd.reportedPostFallback);

  if (!report) {
    return (
      <StateCard
        action={<Link className="font-black text-crystal" href="/moderation?queue=reports">{rd.backToReports}</Link>}
        description={rd.reportNotFoundDesc}
        title={rd.reportNotFound}
      />
    );
  }

  const timeline = getReportTimeline(report.status, rd);

  return (
    <div className="space-y-5 pb-3">
      <section className="-mx-4 border-b border-pink-100 bg-white px-4 pb-4">
        <p className="text-xs font-black uppercase tracking-[0.2em] text-slate-500">{rd.reportDetail}</p>
        <h1 className="mt-1 text-2xl font-black leading-tight text-night">{report.caption}</h1>
        <p className="mt-2 text-sm leading-6 text-slate-500">{rd.reportDetailDesc}</p>
        <div className="mt-4 flex flex-wrap gap-2">
          <SocialPill tone={report.status === "open" ? "primary" : "light"}>{report.status}</SocialPill>
          <span className="rounded-lg bg-slate-100 px-3 py-1 text-xs font-black text-slate-600">
            {report.reason.replaceAll("_", " ")}
          </span>
          <span className="rounded-lg bg-slate-100 px-3 py-1 text-xs font-black text-slate-600">
            {report.mediaType}
          </span>
          <span className="rounded-lg bg-slate-100 px-3 py-1 text-xs font-black text-slate-600">
            {new Intl.DateTimeFormat("en", { dateStyle: "medium" }).format(new Date(report.createdAt))}
          </span>
        </div>
      </section>

      <section className="-mx-4 bg-white px-4 py-4">
        <p className="text-xs font-black uppercase tracking-[0.18em] text-crystal">{rd.auditTimeline}</p>
        <div className="mt-4 space-y-3">
          {timeline.map((item) => (
            <div className="flex gap-3" key={item.title}>
              <span className={`mt-1 size-3 shrink-0 rounded-full ${item.done ? "bg-crystal" : "bg-slate-200"}`} />
              <div>
                <p className="text-sm font-black text-night">{item.title}</p>
                <p className="mt-1 text-xs font-bold leading-5 text-slate-500">{item.detail}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      <section className="-mx-4 bg-gradient-to-r from-violet-50 via-pink-50 to-cyan-50 px-4 py-4">
        <p className="text-sm font-black text-night">{rd.safetyNote}</p>
        <p className="mt-1 text-sm font-bold leading-6 text-slate-600">{rd.safetyNoteDesc}</p>
      </section>

      <Link className="tap-scale block rounded-lg bg-gradient-to-r from-crystal via-berry to-aqua px-4 py-3 text-center text-sm font-black text-white" href="/moderation?queue=reports">
        {rd.backToReportQueue}
      </Link>
    </div>
  );
}

async function getReportDetail(id: string, reportedPostFallback: string): Promise<ReportDetail | null> {
  if (!hasSupabaseEnv() || id.startsWith("demo-")) {
    return {
      id,
      caption: id.includes("2") ? "Comment preview before student display" : "Fractions in 60 seconds",
      createdAt: new Date().toISOString(),
      mediaType: id.includes("2") ? "image" : "video",
      reason: id.includes("2") ? "bullying" : "safety_review",
      status: id.includes("2") ? "reviewing" : "open",
    };
  }

  const supabase = await createClient();
  const profile = await getCurrentProfile(supabase);
  if (!profile) return null;

  const reports = await getUserContentReports(supabase, profile.id);
  const report = reports.find((item) => item.id === id);
  return report ? toReportDetail(report, reportedPostFallback) : null;
}

function toReportDetail(report: UserContentReport, reportedPostFallback: string): ReportDetail {
  return {
    id: report.id,
    caption: report.post?.caption.slice(0, 90) || reportedPostFallback,
    createdAt: report.created_at,
    mediaType: report.post?.media_type ?? "post",
    reason: report.reason,
    status: report.status,
  };
}

function getReportTimeline(
  status: string,
  rd: Awaited<ReturnType<typeof getServerMessages>>["reportDetailPage"],
) {
  return [
    {
      detail: rd.timelineSubmittedDesc,
      done: true,
      title: rd.timelineSubmitted,
    },
    {
      detail: rd.timelineReviewDesc,
      done: ["reviewing", "resolved", "dismissed"].includes(status),
      title: rd.timelineReview,
    },
    {
      detail: rd.timelineResolutionDesc,
      done: ["resolved", "dismissed"].includes(status),
      title: rd.timelineResolution,
    },
  ];
}
