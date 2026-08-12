import Link from "next/link";

import { ShareLearningCardButton } from "@/components/share-learning-card-button";
import type { Messages } from "@/lib/i18n/server";

export function TodayLearningCard({
  copy,
  streakDays = 0,
  points = 0,
  missionDone = 0,
  missionTotal = 5,
}: {
  copy: Messages["feedEnhancements"];
  streakDays?: number;
  points?: number;
  missionDone?: number;
  missionTotal?: number;
}) {
  return (
    <section className="-mx-4 px-4">
      <div className="group overflow-hidden rounded-2xl border border-violet-200/50 bg-gradient-to-br from-indigo-900 via-violet-900 to-fuchsia-900 p-5 text-white shadow-lg transition-all duration-300 hover:shadow-xl hover:shadow-violet-900/20">
        <p className="text-[0.65rem] font-black uppercase tracking-[0.2em] text-white/70">{copy.todayCardTitle}</p>
        <h2 className="mt-1.5 text-xl font-black leading-tight tracking-tight">{copy.todayCardSubtitle}</h2>
        <div className="mt-4 grid grid-cols-2 gap-3">
          <Link
            className="tap-scale rounded-xl bg-white/10 px-4 py-3.5 text-center backdrop-blur-sm transition-all hover:bg-white/20 hover:scale-[1.02] col-span-2 border border-white/5"
            href="/learn"
          >
            <p className="text-sm font-black">{copy.todayQuiz}</p>
            <p className="mt-1 text-[0.65rem] font-bold text-white/75">{copy.startQuiz}</p>
          </Link>
        </div>
        <ShareLearningCardButton
          missionDone={missionDone}
          missionTotal={missionTotal}
          points={points}
          streakDays={streakDays}
        />
      </div>
    </section>
  );
}
