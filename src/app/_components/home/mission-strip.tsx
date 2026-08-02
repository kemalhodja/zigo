import Link from "next/link";

type HomeMissionStripProps = {
  completedCount: number;
  streakDays: number;
  title: string;
  cta: string;
};

export function HomeMissionStrip({
  completedCount,
  streakDays,
  title,
  cta,
}: HomeMissionStripProps) {
  const total = 5;
  const safeDone = Math.max(0, Math.min(total, completedCount));

  return (
    <section className="-mx-4 border-b border-slate-100 bg-white px-4 py-2.5">
      <div className="flex items-center justify-between gap-3">
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <p className="text-sm font-black text-night">
              {title} {safeDone}/{total}
            </p>
            {streakDays > 0 ? (
              <span className="text-xs font-bold text-slate-500">{streakDays} gün</span>
            ) : null}
          </div>
          <div className="mt-1.5 h-1 overflow-hidden rounded-full bg-slate-100">
            <div
              className="h-full rounded-full bg-crystal transition-all"
              style={{ width: `${(safeDone / total) * 100}%` }}
            />
          </div>
        </div>
        <Link
          className="tap-scale shrink-0 rounded-lg bg-slate-100 px-3 py-2 text-xs font-black text-night"
          href="/student"
        >
          {cta}
        </Link>
      </div>
    </section>
  );
}
