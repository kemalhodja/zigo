"use client";

import Link from "next/link";

import { StudyMomentCheerButton } from "@/components/study-moment-cheer-button";
import { FOCUS_PRODUCT_POSITIONING } from "@/lib/domain/focus-gamification";
import type { StudyMoment } from "@/lib/domain/study-moments";
import { formatFeedTimestamp } from "@/lib/format-time";
import { useMessages } from "@/lib/i18n/locale-context";

type StudyWithMeRailProps = {
  moments: StudyMoment[];
  showPreview?: boolean;
};

export function StudyWithMeRail({ moments, showPreview = false }: StudyWithMeRailProps) {
  const r = useMessages().studyWithMeRail;
  const previewMoments: StudyMoment[] = [
    {
      id: "demo-1",
      user_id: "demo",
      full_name: "Elif",
      area_id: 1,
      area_name: "Mathematics",
      topic_label: r.demoTopicFractions,
      duration_minutes: 25,
      caption: "Finished a Pomodoro before the quiz.",
      created_at: new Date(Date.now() - 1000 * 60 * 18).toISOString(),
      cheer_count: 0,
    },
    {
      id: "demo-2",
      user_id: "demo-2",
      full_name: "Can",
      area_id: 2,
      area_name: "Science",
      topic_label: r.demoTopicPlantCells,
      duration_minutes: 25,
      caption: null,
      created_at: new Date(Date.now() - 1000 * 60 * 52).toISOString(),
      cheer_count: 3,
    },
  ];
  const items = moments.length > 0 ? moments : showPreview ? previewMoments : [];

  return (
    <section className="-mx-4 space-y-3 bg-white px-4 py-4">
      <div className="flex items-end justify-between gap-3">
        <div>
          <p className="zigo-eyebrow text-crystal">{FOCUS_PRODUCT_POSITIONING.studyWithMe}</p>
          <h2 className="zigo-title-sm mt-1 font-black text-night">{r.title}</h2>
        </div>
        <Link className="text-xs font-black text-crystal" href="/focus">
          {r.startFocus}
        </Link>
      </div>

      {items.length === 0 ? (
        <div className="rounded-xl bg-slate-50 px-4 py-4">
          <p className="text-sm font-semibold leading-6 text-slate-500">{r.emptyDesc}</p>
          <Link className="tap-scale zigo-cta mt-3 inline-flex rounded-lg px-4 py-2 text-xs font-black text-white" href="/focus">
            {r.startStudyWithMe}
          </Link>
        </div>
      ) : (
        <div className="flex gap-3 overflow-x-auto pb-1">
          {items.map((moment) => (
            <article
              className="min-w-[11.5rem] shrink-0 rounded-xl border border-violet-100 bg-gradient-to-br from-violet-50 to-white p-3"
              key={moment.id}
            >
              <p className="text-xs font-black uppercase tracking-[0.12em] text-crystal">{moment.area_name}</p>
              <p className="mt-1 text-sm font-black leading-snug text-night">{moment.topic_label}</p>
              <p className="mt-1 text-xs font-bold text-slate-500">
                {moment.full_name} · {moment.duration_minutes}m · {formatFeedTimestamp(moment.created_at)}
              </p>
              {moment.caption ? (
                <p className="zigo-fit-text mt-2 text-xs font-semibold leading-5 text-slate-600">{moment.caption}</p>
              ) : null}
              <StudyMomentCheerButton initialCount={moment.cheer_count ?? 0} momentId={moment.id} />
            </article>
          ))}
        </div>
      )}
    </section>
  );
}
