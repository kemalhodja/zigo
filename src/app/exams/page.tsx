import Link from "next/link";

import { getNextExams, seasonPhase } from "@/lib/domain/exam-season";
import { getCurrentProfile } from "@/lib/domain/profiles";
import { createClient } from "@/lib/supabase/server";

export const metadata = { title: "Sınav Sezonu | Zigo" };
export const dynamic = "force-dynamic";

type LeagueRow = {
  user_id: string;
  full_name: string | null;
  avatar_url: string | null;
  weekly_points: number;
  rank: number;
};

async function getLeague(): Promise<LeagueRow[]> {
  const supabase = await createClient();
  const profile = await getCurrentProfile(supabase);
  if (!profile) return [];
  const { data } = await supabase.rpc("get_weekly_league", { p_limit: 20 });
  return ((data ?? []) as Omit<LeagueRow, "rank">[]).map((row, i) => ({ ...row, rank: i + 1 }));
}

export default async function ExamSeasonPage() {
  const supabase = await createClient();
  const profile = await getCurrentProfile(supabase);
  const exams = getNextExams();
  const league = await getLeague();

  return (
    <div className="min-h-screen bg-slate-50 pb-20">
      <header className="sticky top-0 z-20 flex items-center justify-between border-b border-slate-100 bg-white/80 px-4 py-3 backdrop-blur-md">
        <Link
          href="/"
          className="flex h-10 w-10 items-center justify-center rounded-full bg-slate-50 text-slate-500 transition-colors hover:bg-slate-100"
        >
          ←
        </Link>
        <h1 className="text-lg font-bold text-night">🏁 Sınav Sezonu</h1>
        <div className="w-10" />
      </header>

      <main className="mx-auto max-w-xl space-y-6 p-4">
        {/* Countdown cards */}
        {exams.map((exam) => {
          const phase = seasonPhase(exam.daysRemaining);
          const urgent = exam.daysRemaining <= 30;
          return (
            <div
              key={`${exam.key}-${exam.year}`}
              className={`overflow-hidden rounded-3xl border shadow-sm ${
                urgent ? "border-rose-200 bg-gradient-to-br from-rose-50 to-white" : "border-indigo-100 bg-gradient-to-br from-indigo-50 to-white"
              }`}
            >
              <div className="flex items-center justify-between p-5">
                <div>
                  <p className="text-xs font-black uppercase tracking-widest text-slate-400">
                    {exam.audience} · {exam.year}
                  </p>
                  <h2 className="text-lg font-black text-night">{exam.shortName}</h2>
                </div>
                <div className="text-right">
                  <p className={`text-4xl font-black tabular-nums ${urgent ? "text-rose-600" : "text-indigo-600"}`}>
                    {exam.daysRemaining}
                  </p>
                  <p className="text-xs font-bold uppercase tracking-wider text-slate-400">gün kaldı</p>
                </div>
              </div>
              <div className="border-t border-white/60 bg-white/60 px-5 py-3">
                <span className={`rounded-full px-2.5 py-1 text-[0.65rem] font-black uppercase tracking-wider ${urgent ? "bg-rose-100 text-rose-700" : "bg-indigo-100 text-indigo-700"}`}>
                  {phase.label}
                </span>
                <p className="mt-2 text-sm font-semibold text-slate-600">{phase.tip}</p>
              </div>
            </div>
          );
        })}

        {/* Quick actions */}
        <div className="grid grid-cols-3 gap-2">
          <Link href="/rooms" className="tap-scale rounded-2xl border border-slate-100 bg-white p-3 text-center shadow-sm transition hover:shadow-md">
            <p className="text-xl">🎯</p>
            <p className="mt-1 text-[0.7rem] font-black text-night">Odak Odası</p>
          </Link>
          <Link href="/quizzes" className="tap-scale rounded-2xl border border-slate-100 bg-white p-3 text-center shadow-sm transition hover:shadow-md">
            <p className="text-xl">🏆</p>
            <p className="mt-1 text-[0.7rem] font-black text-night">Quiz Arena</p>
          </Link>
          <Link href="/reviews" className="tap-scale rounded-2xl border border-slate-100 bg-white p-3 text-center shadow-sm transition hover:shadow-md">
            <p className="text-xl">🧠</p>
            <p className="mt-1 text-[0.7rem] font-black text-night">Bugünün Tekrarı</p>
          </Link>
        </div>

        {/* Weekly league */}
        <section>
          <h3 className="mb-2 flex items-center gap-2 text-sm font-bold uppercase tracking-wider text-slate-500">
            ⚡ Haftalık Lig
            <span className="rounded-full bg-amber-50 px-2 py-0.5 text-[0.65rem] font-black text-amber-600">
              son 7 gün
            </span>
          </h3>

          {!profile ? (
            <p className="rounded-xl border border-dashed border-slate-200 bg-white p-6 text-center text-sm font-semibold text-slate-400">
              Lige girmek için giriş yap.
            </p>
          ) : league.length === 0 ? (
            <p className="rounded-xl border border-dashed border-slate-200 bg-white p-6 text-center text-sm font-semibold text-slate-400">
              Bu hafta henüz puan yok. İlk sıralara girmek için bir odak bloğu tamamla!
            </p>
          ) : (
            <div className="overflow-hidden rounded-2xl border border-slate-100 bg-white shadow-sm">
              {league.map((row) => {
                const isViewer = row.user_id === profile?.id;
                return (
                  <div
                    key={row.user_id}
                    className={`flex items-center gap-3 border-b border-slate-50 px-4 py-2.5 last:border-0 ${
                      isViewer ? "bg-indigo-50/70" : ""
                    }`}
                  >
                    <span
                      className={`w-7 text-center text-sm font-black ${
                        row.rank === 1 ? "text-amber-500" : row.rank === 2 ? "text-slate-400" : row.rank === 3 ? "text-orange-400" : "text-slate-300"
                      }`}
                    >
                      {row.rank <= 3 ? ["🥇", "🥈", "🥉"][row.rank - 1] : row.rank}
                    </span>
                    <span className="min-w-0 flex-1 truncate text-sm font-bold text-night">
                      {row.full_name || "Öğrenci"}
                      {isViewer ? <span className="ml-1 text-xs font-black text-indigo-500">(sen)</span> : null}
                    </span>
                    <span className="text-sm font-black tabular-nums text-indigo-600">
                      {Number(row.weekly_points)} puan
                    </span>
                  </div>
                );
              })}
            </div>
          )}
        </section>
      </main>
    </div>
  );
}
