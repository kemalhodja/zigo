import Link from "next/link";

import { getServerMessages } from "@/lib/i18n/server";

type LearningProgressCardProps = {
  duelWins?: number;
  focusSessions?: number;
  eventCount: number;
  gems: number;
  isPreview?: boolean;
  level: number;
  leagueLabel: string;
  levelProgress: number;
  points: number;
  pointsToNextLevel: number;
  quizCompletions?: number;
  reelWatches: number;
};

export async function LearningProgressCard({
  duelWins = 0,
  focusSessions = 0,
  eventCount,
  gems,
  isPreview = false,
  level,
  leagueLabel,
  levelProgress,
  points,
  pointsToNextLevel,
  quizCompletions = 0,
  reelWatches,
}: LearningProgressCardProps) {
  const m = await getServerMessages();
  const p = m.progress;

  return (
    <section className="-mx-4 bg-gradient-to-br from-crystal via-berry to-aqua px-4 py-4 text-white">
      <div className="flex items-center justify-between gap-3">
        <div className="min-w-0">
          <p className="text-xs font-black uppercase tracking-[0.18em] text-white/75">{p.wallet}</p>
          <h2 className="mt-1 text-2xl font-black leading-tight">
            {points.toLocaleString()} {m.common.points}
          </h2>
          <p className="mt-1 text-xs font-black text-white/80">
            {p.levelLeague
              .replace("{level}", String(level))
              .replace("{league}", leagueLabel)
              .replace("{gems}", String(gems))}
          </p>
        </div>
        <div className="flex shrink-0 flex-wrap justify-end gap-1.5 text-xs font-black">
          <span className="zigo-compact-pill rounded-lg bg-white/18 px-3 py-1 text-white backdrop-blur">
            {p.microCount.replace("{n}", String(reelWatches))}
          </span>
          <span className="zigo-compact-pill rounded-lg bg-white/18 px-3 py-1 text-white backdrop-blur">
            {p.quizCount.replace("{n}", String(quizCompletions))}
          </span>
          <span className="zigo-compact-pill rounded-lg bg-white/18 px-3 py-1 text-white backdrop-blur">
            {p.duelCount.replace("{n}", String(duelWins))}
          </span>
          <span className="zigo-compact-pill rounded-lg bg-white/18 px-3 py-1 text-white backdrop-blur">
            {p.focusCount.replace("{n}", String(focusSessions))}
          </span>
          <Link className="zigo-compact-pill tap-scale zigo-quick-action-primary rounded-lg text-white" href="/focus">
            {m.zigo.focusMode}
          </Link>
          <Link className="zigo-compact-pill tap-scale rounded-lg bg-white px-3 py-1 text-crystal" href="/store">
            {m.dashboard.student.store}
          </Link>
        </div>
      </div>
      <div className="mt-4 h-2 overflow-hidden rounded-lg bg-white/20">
        <span className="block h-full rounded-lg bg-white" style={{ width: `${levelProgress}%` }} />
      </div>
      <p className="mt-2 text-xs font-bold text-white/80">
        {p.pointsToLevel
          .replace("{points}", String(pointsToNextLevel))
          .replace("{level}", String(level + 1))}
      </p>
      <p className="mt-1 text-xs font-bold text-white/70">
        {p.verifiedActions.replace("{count}", String(eventCount))}
        {isPreview ? ` (${m.common.preview})` : ""}.
      </p>
    </section>
  );
}
