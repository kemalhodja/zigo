"use client";

import Link from "next/link";

import { useMessages } from "@/lib/i18n/locale-context";

type ChildFocusStat = {
  child_profile_id: string;
  display_name: string;
  completed_sessions: number;
  focus_minutes_week: number;
  total_points: number;
};

type ParentChildrenFocusCardProps = {
  stats: ChildFocusStat[];
  showPreview?: boolean;
};

const previewStats: ChildFocusStat[] = [
  {
    child_profile_id: "demo-child-1",
    display_name: "Ada",
    completed_sessions: 3,
    focus_minutes_week: 75,
    total_points: 340,
  },
];

export function ParentChildrenFocusCard({ stats, showPreview = false }: ParentChildrenFocusCardProps) {
  const p = useMessages().parentFocus;
  const c = useMessages().common;
  const items = stats.length > 0 ? stats : showPreview ? previewStats : [];

  if (items.length === 0) {
    return (
      <section className="-mx-4 bg-white px-4 py-4">
        <p className="text-xs font-black uppercase tracking-[0.18em] text-crystal">{p.childFocusStats}</p>
        <p className="mt-2 text-sm font-semibold leading-6 text-slate-500">{p.linkChildDesc}</p>
        <Link className="tap-scale mt-3 inline-flex rounded-lg bg-gradient-to-r from-crystal to-berry px-4 py-2 text-xs font-black text-white" href="/family">
          {p.openFamilySetup}
        </Link>
      </section>
    );
  }

  return (
    <section className="-mx-4 space-y-3 bg-white px-4 py-4">
      <div className="flex items-end justify-between gap-3">
        <div>
          <p className="text-xs font-black uppercase tracking-[0.18em] text-crystal">{p.childFocusStats}</p>
          <h2 className="mt-1 text-lg font-black text-night">{p.perChildPulse}</h2>
        </div>
        <Link className="text-xs font-black text-crystal" href="/family">
          {p.superviseFocus}
        </Link>
      </div>

      <div className="grid gap-2">
        {items.map((child) => (
          <article className="rounded-xl border border-violet-100 bg-violet-50/60 px-4 py-3" key={child.child_profile_id}>
            <div className="flex items-center justify-between gap-3">
              <p className="text-sm font-black text-night">{child.display_name}</p>
              <span className="rounded-lg bg-white px-2 py-1 text-xs font-black text-crystal">
                {child.total_points} {c.points}
              </span>
            </div>
            <div className="mt-2 grid grid-cols-2 gap-2 text-center">
              <div className="rounded-lg bg-white px-2 py-2">
                <p className="text-lg font-black text-night">{child.completed_sessions}</p>
                <p className="text-[0.62rem] font-bold uppercase tracking-[0.08em] text-slate-500">{p.sessions}</p>
              </div>
              <div className="rounded-lg bg-white px-2 py-2">
                <p className="text-lg font-black text-night">{child.focus_minutes_week}</p>
                <p className="text-[0.62rem] font-bold uppercase tracking-[0.08em] text-slate-500">{p.minPerWeek}</p>
              </div>
            </div>
          </article>
        ))}
      </div>

      {showPreview ? <p className="text-xs font-bold text-slate-400">{p.demoPreviewData}</p> : null}
    </section>
  );
}
