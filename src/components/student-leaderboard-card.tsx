import Link from "next/link";

import type { AreaLeaderboardEntry } from "@/lib/domain/student-leaderboard";

type StudentLeaderboardCardProps = {
  areaName: string;
  entries: AreaLeaderboardEntry[];
  viewerId?: string | null;
  title: string;
  empty: string;
};

export function StudentLeaderboardCard({
  areaName,
  entries,
  viewerId,
  title,
  empty,
}: StudentLeaderboardCardProps) {
  return (
    <section className="-mx-4 border border-amber-100 bg-gradient-to-br from-amber-50 to-white px-4 py-4">
      <p className="text-[0.65rem] font-black uppercase tracking-[0.16em] text-amber-700">{title}</p>
      <h2 className="mt-1 text-lg font-black text-night">{areaName}</h2>
      {entries.length === 0 ? (
        <p className="mt-3 text-sm font-semibold text-slate-500">{empty}</p>
      ) : (
        <ol className="mt-3 space-y-2">
          {entries.map((entry) => {
            const isSelf = entry.userId === viewerId;
            return (
              <li
                className={`flex items-center justify-between rounded-xl px-3 py-2 ${
                  isSelf ? "bg-amber-100/80" : "bg-white/80"
                }`}
                key={entry.userId}
              >
                <div className="flex min-w-0 items-center gap-3">
                  <span className="flex size-7 items-center justify-center rounded-full bg-night text-xs font-black text-white">
                    {entry.rank}
                  </span>
                  <Link className="truncate text-sm font-black text-night" href={`/profile/${entry.userId}`}>
                    {entry.fullName}
                    {isSelf ? " (sen)" : ""}
                  </Link>
                </div>
                <span className="shrink-0 text-xs font-black text-slate-600">{entry.totalPoints} puan</span>
              </li>
            );
          })}
        </ol>
      )}
    </section>
  );
}
