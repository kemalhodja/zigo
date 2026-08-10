import Image from "next/image";
import Link from "next/link";

export type TeacherLeaderboardEntry = {
  userId: string;
  fullName: string;
  avatarUrl: string | null;
  totalPoints: number;
  rank: number;
};

export function TeacherLeaderboardCard({
  entries,
  viewerId,
}: {
  entries: TeacherLeaderboardEntry[];
  viewerId: string | null;
}) {
  return (
    <section className="-mx-4 space-y-3 bg-white px-4 py-4">
      <div>
        <p className="text-xs font-black uppercase tracking-[0.2em] text-crystal">Haftalık Lig</p>
        <h2 className="mt-1 text-xl font-black leading-tight text-night">Eğitmen Liderlik Tablosu</h2>
        <p className="mt-1 text-xs font-bold text-slate-500">En çok beğeni ve etkileşim alan öğretmenler.</p>
      </div>

      {entries.length === 0 ? (
        <p className="rounded-lg bg-slate-50 px-4 py-3 text-sm font-bold text-slate-500">
          Bu hafta henüz sıralama yok.
        </p>
      ) : (
        <div className="space-y-1">
          {entries.map((entry) => {
            const isViewer = entry.userId === viewerId;
            const bgClass = isViewer
              ? "bg-gradient-to-r from-violet-50 to-fuchsia-50 border border-violet-100"
              : "bg-slate-50 border border-transparent";
            
            let rankNode;
            if (entry.rank === 1) rankNode = <span className="text-xl" title="1.">🏆</span>;
            else if (entry.rank === 2) rankNode = <span className="text-xl" title="2.">🥈</span>;
            else if (entry.rank === 3) rankNode = <span className="text-xl" title="3.">🥉</span>;
            else rankNode = <span className="w-6 text-center text-sm font-black text-slate-400">{entry.rank}</span>;

            return (
              <Link
                key={entry.userId}
                href={`/profile/${entry.userId}`}
                className={`tap-scale flex items-center justify-between rounded-lg px-3 py-2.5 transition-colors ${bgClass}`}
              >
                <div className="flex items-center gap-3">
                  <div className="flex w-6 items-center justify-center shrink-0">
                    {rankNode}
                  </div>
                  <div className="relative size-10 shrink-0 overflow-hidden rounded-full border-2 border-white shadow-sm bg-slate-100">
                    {entry.avatarUrl ? (
                      <Image
                        src={entry.avatarUrl}
                        alt={entry.fullName}
                        fill
                        className="object-cover"
                        sizes="40px"
                      />
                    ) : (
                      <div className="flex size-full items-center justify-center text-xs font-black text-slate-400">
                        {entry.fullName.charAt(0).toUpperCase()}
                      </div>
                    )}
                  </div>
                  <div className="min-w-0">
                    <p className={`truncate text-sm font-black ${isViewer ? "text-violet-900" : "text-night"}`}>
                      {entry.fullName}
                    </p>
                    {isViewer && (
                      <span className="text-[0.65rem] font-bold uppercase tracking-wider text-violet-600">Sen</span>
                    )}
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-sm font-black text-crystal">{entry.totalPoints}</p>
                  <p className="text-[0.65rem] font-bold uppercase tracking-wider text-slate-500">Puan</p>
                </div>
              </Link>
            );
          })}
        </div>
      )}
    </section>
  );
}
