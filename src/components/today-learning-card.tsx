import Link from "next/link";

import type { Messages } from "@/lib/i18n/server";

export function TodayLearningCard({ copy }: { copy: Messages["feedEnhancements"] }) {
  return (
    <section className="-mx-4 px-4">
      <div className="overflow-hidden rounded-2xl border border-violet-100 bg-gradient-to-br from-night via-violet-900 to-crystal p-4 text-white shadow-sm">
        <p className="text-[0.62rem] font-black uppercase tracking-[0.18em] text-white/70">{copy.todayCardTitle}</p>
        <h2 className="mt-1 text-lg font-black leading-tight">{copy.todayCardSubtitle}</h2>
        <div className="mt-3 grid grid-cols-2 gap-2">
          <Link
            className="tap-scale rounded-xl bg-white/15 px-3 py-3 text-center backdrop-blur transition hover:bg-white/25"
            href="/learn"
          >
            <p className="text-sm font-black">{copy.todayQuiz}</p>
            <p className="mt-1 text-[0.65rem] font-bold text-white/75">{copy.startQuiz}</p>
          </Link>
          <Link
            className="tap-scale rounded-xl bg-white/15 px-3 py-3 text-center backdrop-blur transition hover:bg-white/25"
            href="/duels"
          >
            <p className="text-sm font-black">{copy.todayDuel}</p>
            <p className="mt-1 text-[0.65rem] font-bold text-white/75">{copy.startDuel}</p>
          </Link>
        </div>
      </div>
    </section>
  );
}
