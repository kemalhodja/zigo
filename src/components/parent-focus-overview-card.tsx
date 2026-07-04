"use client";

import Link from "next/link";

import type { ParentFocusOverview } from "@/lib/domain/focus-analytics";
import { formatFeedTimestamp } from "@/lib/format-time";
import { useMessages } from "@/lib/i18n/locale-context";

type ParentFocusOverviewCardProps = {
  overview: ParentFocusOverview;
  showPreview?: boolean;
};

export function ParentFocusOverviewCard({ overview, showPreview = false }: ParentFocusOverviewCardProps) {
  const p = useMessages().parentFocus;

  return (
    <section className="-mx-4 space-y-3 bg-gradient-to-br from-slate-900 to-indigo-950 px-4 py-4 text-white">
      <div className="flex items-end justify-between gap-3">
        <div>
          <p className="text-xs font-black uppercase tracking-[0.18em] text-amber-300">{p.focusPulse}</p>
          <h2 className="mt-1 text-lg font-black">{p.studyActivityAreas}</h2>
        </div>
        <Link className="text-xs font-black text-amber-200" href="/focus">
          {p.studentFocus}
        </Link>
      </div>

      <div className="grid grid-cols-2 gap-2">
        <div className="rounded-xl bg-white/10 px-3 py-3">
          <p className="text-[0.62rem] font-black uppercase tracking-[0.12em] text-white/70">{p.sharedMoments}</p>
          <p className="mt-1 text-2xl font-black">{overview.matchedStudyMoments}</p>
        </div>
        <div className="rounded-xl bg-white/10 px-3 py-3">
          <p className="text-[0.62rem] font-black uppercase tracking-[0.12em] text-white/70">{p.focusMinutesWeek}</p>
          <p className="mt-1 text-2xl font-black">{overview.focusMinutesInAreas}</p>
        </div>
      </div>

      {overview.latestTopic && overview.latestStudentName ? (
        <div className="rounded-xl border border-white/10 bg-white/5 px-4 py-3">
          <p className="text-xs font-black uppercase tracking-[0.12em] text-white/60">{p.latestStudyWithMe}</p>
          <p className="mt-1 text-sm font-black">
            {overview.latestStudentName} · {overview.latestTopic}
          </p>
          {overview.latestCreatedAt ? (
            <p className="mt-1 text-xs font-bold text-white/70">{formatFeedTimestamp(overview.latestCreatedAt)}</p>
          ) : null}
        </div>
      ) : (
        <p className="text-sm font-bold leading-6 text-white/75">{p.emptyPulseDesc}</p>
      )}

      {showPreview ? <p className="text-xs font-bold text-white/60">{p.demoPreviewData}</p> : null}

      <p className="text-xs font-bold text-amber-200/90">{p.zigoPlusHint}</p>
    </section>
  );
}
