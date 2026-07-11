import type { ChildActivityItem } from "@/lib/domain/parent-dashboard";

type ChildActivityTimelineProps = {
  activity: ChildActivityItem[];
  isLocked?: boolean;
  labels: {
    title: string;
    empty: string;
    points: string;
    types: Record<ChildActivityItem["activity_type"], string>;
    quizScore: string;
  };
};

export function ChildActivityTimeline({ activity, isLocked = false, labels }: ChildActivityTimelineProps) {
  return (
    <section className="rounded-lg border border-slate-100 bg-slate-50/80 p-4" data-testid="child-activity-timeline">
      <p className="text-xs font-black uppercase tracking-[0.18em] text-slate-500">{labels.title}</p>

      {isLocked ? (
        <div className="mt-3 relative rounded-xl border border-pink-200 bg-gradient-to-br from-pink-50 via-white to-purple-50 p-5 text-center shadow-sm">
          <div className="mx-auto flex size-12 items-center justify-center rounded-full bg-gradient-to-r from-crystal to-berry text-white text-xl shadow-md">
            👑
          </div>
          <h3 className="mt-2.5 text-sm font-black text-night">Öğrenci Detaylı Takip Modu Abone Özeldir</h3>
          <p className="mt-1 text-xs leading-5 text-slate-600 max-w-sm mx-auto">
            Çocuğunuzun günlük çalışma adımlarını, izlediği içerikleri, quiz skorlarını ve zaman çizelgesini canlı takip etmek için Veli Aboneliği (Zigo Plus) gereklidir.
          </p>
          <a
            href="#zigo-plus-plans"
            className="mt-3 inline-block rounded-lg bg-gradient-to-r from-crystal to-berry px-4 py-2 text-xs font-black text-white shadow transition hover:opacity-95"
          >
            Veli Aboneliği Al & Detayları Aç
          </a>
        </div>
      ) : activity.length === 0 ? (
        <p className="mt-3 rounded-lg bg-white px-3 py-3 text-sm font-bold text-slate-500">{labels.empty}</p>
      ) : (
        <ul className="mt-3 space-y-2">
          {activity.map((item) => {
            const scorePercent =
              item.activity_type === "quiz_complete" && typeof item.metadata.score_percent === "number"
                ? item.metadata.score_percent
                : null;

            return (
              <li className="rounded-lg bg-white px-3 py-3" key={item.activity_id}>
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="text-[0.65rem] font-black uppercase tracking-[0.14em] text-crystal">
                      {labels.types[item.activity_type]}
                    </p>
                    <p className="mt-1 truncate text-sm font-black text-night">{item.title}</p>
                    {scorePercent !== null ? (
                      <p className="mt-1 text-xs font-bold text-slate-500">
                        {labels.quizScore.replace("{score}", String(scorePercent))}
                      </p>
                    ) : null}
                  </div>
                  <div className="shrink-0 text-right">
                    <p className="text-sm font-black text-crystal">
                      {labels.points.replace("{points}", String(item.points_awarded))}
                    </p>
                    <p className="mt-0.5 text-[0.65rem] font-bold text-slate-400">
                      {new Date(item.created_at).toLocaleDateString("tr-TR", {
                        day: "numeric",
                        month: "short",
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </p>
                  </div>
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </section>
  );
}
