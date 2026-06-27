import type { WeeklyProgressSummary } from "@/lib/domain/ecosystem";

type ParentWeeklyProgressCardProps = {
  summary: WeeklyProgressSummary;
  labels: {
    eyebrow: string;
    title: string;
    reports: string;
    average: string;
    topArea: string;
    bookings: string;
    empty: string;
  };
};

export function ParentWeeklyProgressCard({ summary, labels }: ParentWeeklyProgressCardProps) {
  const hasData =
    summary.reportCount > 0 || summary.completedBookings > 0 || summary.averageScore > 0;

  return (
    <section className="-mx-4 border-y border-cyan-100 bg-gradient-to-br from-cyan-50 to-white px-4 py-4">
      <p className="text-xs font-black uppercase tracking-[0.18em] text-crystal">{labels.eyebrow}</p>
      <h2 className="mt-2 text-lg font-black text-night">{labels.title}</h2>
      {!hasData ? (
        <p className="mt-3 text-sm font-semibold text-slate-500">{labels.empty}</p>
      ) : (
        <div className="mt-4 grid grid-cols-2 gap-2">
          <Stat label={labels.reports} value={String(summary.reportCount)} />
          <Stat label={labels.average} value={`${summary.averageScore}`} />
          <Stat label={labels.topArea} value={summary.topArea ?? "—"} />
          <Stat label={labels.bookings} value={String(summary.completedBookings)} />
        </div>
      )}
    </section>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg bg-white px-3 py-3 shadow-sm ring-1 ring-cyan-100">
      <p className="text-lg font-black text-night">{value}</p>
      <p className="mt-1 text-xs font-bold text-slate-500">{label}</p>
    </div>
  );
}
