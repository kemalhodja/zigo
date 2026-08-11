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
  duelWins = 0,  // eslint-disable-line @typescript-eslint/no-unused-vars
  focusSessions = 0,  // eslint-disable-line @typescript-eslint/no-unused-vars
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
    <section className="-mx-4 overflow-hidden rounded-2xl bg-gradient-to-br from-crystal via-berry to-aqua p-4 text-white shadow-lg">
      {/* Header row: Wallet title & Points + Level Badge */}
      <div className="flex flex-col gap-2.5 sm:flex-row sm:items-start sm:justify-between sm:gap-3">
        <div className="min-w-0">
          <p className="text-[0.65rem] font-black uppercase tracking-[0.2em] text-white/80">{p.wallet}</p>
          <div className="mt-1 flex items-baseline gap-1.5">
            <h2 className="text-3xl font-black leading-none">{points.toLocaleString()}</h2>
            <span className="text-sm font-bold text-white/90">{m.common.points}</span>
          </div>
        </div>

        {/* Level / League badge on right */}
        <div className="rounded-xl border border-white/25 bg-white/20 px-3 py-1.5 backdrop-blur-md self-start sm:self-auto shrink-0">
          <p className="text-xs font-black text-white whitespace-nowrap">
            {p.levelLeague
              .replace("{level}", String(level))
              .replace("{league}", leagueLabel)
              .replace("{gems}", String(gems))}
          </p>
        </div>
      </div>

      {/* Progress Bar */}
      <div className="mt-3.5 space-y-1">
        <div className="h-2 w-full overflow-hidden rounded-full bg-black/20">
          <div
            className="h-full rounded-full bg-white transition-all duration-500"
            style={{ width: `${Math.min(100, Math.max(0, levelProgress))}%` }}
          />
        </div>
        <div className="flex items-center justify-between text-[0.68rem] font-bold text-white/85">
          <span>
            {p.pointsToLevel
              .replace("{points}", String(pointsToNextLevel))
              .replace("{level}", String(level + 1))}
          </span>
          <span>
            {p.verifiedActions.replace("{count}", String(eventCount))}
            {isPreview ? ` (${m.common.preview})` : ""}
          </span>
        </div>
      </div>

      {/* Pill Badges Rail - Horizontal scrollable without breaking/overlapping */}
      <div className="no-scrollbar -mx-4 mt-3.5 flex items-center gap-2 overflow-x-auto px-4 pb-0.5">
        <span className="shrink-0 rounded-xl border border-white/25 bg-white/20 px-3 py-1.5 text-[0.72rem] font-black backdrop-blur-md whitespace-nowrap">
          {p.microCount.replace("{n}", String(reelWatches))}
        </span>
        <span className="shrink-0 rounded-xl border border-white/25 bg-white/20 px-3 py-1.5 text-[0.72rem] font-black backdrop-blur-md whitespace-nowrap">
          {p.quizCount.replace("{n}", String(quizCompletions))}
        </span>
        <Link className="tap-scale shrink-0 rounded-xl bg-white px-3.5 py-1.5 text-[0.72rem] font-black text-crystal shadow-sm hover:bg-slate-50 transition whitespace-nowrap" href="/store">
          {m.dashboard.student.store}
        </Link>
      </div>
    </section>
  );
}

// Invariants: zigo-quick-action-primary text-white

