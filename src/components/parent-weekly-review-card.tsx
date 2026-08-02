import Link from "next/link";

import type { ParentWeeklyReviewSummary } from "@/lib/domain/habit-loop";

export type ParentWeeklyReviewCopy = {
  eyebrow: string;
  title: string;
  desc: string;
  emptyTitle: string;
  emptyDesc: string;
  metricActions: string;
  metricPoints: string;
  metricMicro: string;
  metricQuiz: string;
  metricDuel: string;
  openFamily: string;
  openLearn: string;
};

export function ParentWeeklyReviewCard({
  summary,
  copy,
}: {
  summary: ParentWeeklyReviewSummary;
  copy: ParentWeeklyReviewCopy;
}) {
  if (summary.totalActions === 0) {
    return (
      <section className="-mx-4 border-b border-slate-100 bg-white px-4 py-4">
        <p className="text-xs font-black uppercase tracking-[0.18em] text-slate-500">{copy.eyebrow}</p>
        <h3 className="mt-1 text-lg font-black text-night">{copy.emptyTitle}</h3>
        <p className="mt-1 text-sm font-bold leading-6 text-slate-500">{copy.emptyDesc}</p>
        <div className="mt-3 flex flex-wrap gap-2">
          <Link className="rounded-lg bg-slate-100 px-3 py-2 text-xs font-black text-night" href="/family">
            {copy.openFamily}
          </Link>
          <Link className="rounded-lg bg-slate-100 px-3 py-2 text-xs font-black text-night" href="/learn">
            {copy.openLearn}
          </Link>
        </div>
      </section>
    );
  }

  return (
    <section className="-mx-4 border-b border-cyan-100 bg-gradient-to-r from-cyan-50 to-blue-50 px-4 py-4">
      <p className="text-xs font-black uppercase tracking-[0.18em] text-slate-500">{copy.eyebrow}</p>
      <h3 className="mt-1 text-lg font-black text-night">{copy.title}</h3>
      <p className="mt-1 text-sm font-bold leading-6 text-slate-600">{copy.desc}</p>

      <div className="mt-4 grid grid-cols-2 gap-2 sm:grid-cols-3">
        <Metric label={copy.metricActions} value={summary.totalActions} />
        <Metric label={copy.metricPoints} value={summary.totalPoints} />
        <Metric label={copy.metricMicro} value={summary.microCount} />
        <Metric label={copy.metricQuiz} value={summary.quizCount} />
        <Metric label={copy.metricDuel} value={summary.duelCount} />
      </div>

      <div className="mt-4 space-y-2">
        {summary.children.map((child) => (
          <div className="flex items-center justify-between rounded-lg bg-white px-3 py-2" key={child.childId}>
            <p className="text-sm font-black text-night">{child.childName}</p>
            <p className="text-xs font-bold text-slate-500">
              {child.actions} · +{child.points}
            </p>
          </div>
        ))}
      </div>
    </section>
  );
}

function Metric({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-lg bg-white p-3">
      <p className="text-lg font-black text-night">{value.toLocaleString()}</p>
      <p className="mt-1 text-[0.65rem] font-black uppercase tracking-[0.12em] text-slate-500">{label}</p>
    </div>
  );
}
