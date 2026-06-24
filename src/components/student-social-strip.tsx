import Link from "next/link";

import { getCompactLeague, getGemBalance } from "@/lib/domain/student-gamification";
import { getServerMessages } from "@/lib/i18n/server";

type StudentSocialStripProps = {
  points: number;
  streakDays?: number;
};

export async function StudentSocialStrip({ points, streakDays = 0 }: StudentSocialStripProps) {
  const { studentStrip: s } = await getServerMessages();
  const league = getCompactLeague(points);
  const gems = getGemBalance(points);
  const displayStreak = Math.max(streakDays, 0);

  return (
    <section className="student-social-strip -mx-4 border-b border-violet-100 px-4 py-3.5">
      <div className="flex items-center gap-3">
        <div className="student-streak-ring flex size-12 shrink-0 items-center justify-center rounded-2xl bg-white text-lg font-black text-crystal shadow-sm">
          {displayStreak}
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <p className="text-[0.62rem] font-black uppercase tracking-[0.16em] text-crystal">{s.label}</p>
            <span className={`zigo-compact-pill rounded-full px-2 py-0.5 text-[0.62rem] font-black uppercase tracking-wide ${league.tone}`}>
              {league.label}
            </span>
          </div>
          <p className="zigo-fit-text mt-1 text-sm font-black text-night">
            {s.pointsGems.replace("{points}", points.toLocaleString()).replace("{gems}", String(gems))}
          </p>
          <p className="zigo-fit-text mt-0.5 text-[0.68rem] font-bold text-slate-500">
            {displayStreak > 0
              ? s.streakActive.replace("{days}", String(displayStreak))
              : s.streakEmpty}
          </p>
        </div>
      </div>
      <div className="zigo-action-grid mt-3">
        <Link className="zigo-action-chip tap-scale zigo-pill-btn rounded-xl bg-white text-crystal" href="/focus">
          {s.focus}
        </Link>
        <Link className="zigo-action-chip tap-scale zigo-pill-btn rounded-xl bg-white text-crystal" href="/learn">
          {s.quiz}
        </Link>
        <Link className="zigo-action-chip tap-scale zigo-pill-btn rounded-xl zigo-quick-action-primary text-white" href="/micro">
          {s.micro}
        </Link>
        <Link className="zigo-action-chip tap-scale zigo-pill-btn rounded-xl zigo-quick-action-primary text-white" href="/store">
          {s.store}
        </Link>
      </div>
    </section>
  );
}
