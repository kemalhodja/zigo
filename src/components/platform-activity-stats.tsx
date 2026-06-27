"use client";

import { CountUpStat } from "@/components/count-up-stat";

type PlatformActivityStatsProps = {
  totalCompletedLessons: number;
  completedStudentCount: number;
  avgResponseMinutes: number;
  className?: string;
};

export function PlatformActivityStats({
  totalCompletedLessons,
  completedStudentCount,
  avgResponseMinutes,
  className = "",
}: PlatformActivityStatsProps) {
  const items: Array<{ label: string; value: number; suffix: string; showDash: boolean }> = [
    { label: "Toplam Verilen Ders", value: totalCompletedLessons, suffix: "", showDash: false },
    { label: "Tamamlanan Öğrenci", value: completedStudentCount, suffix: "", showDash: false },
    {
      label: "Ort. Dönüş Süresi",
      value: avgResponseMinutes,
      suffix: " dk",
      showDash: avgResponseMinutes <= 0,
    },
  ];

  return (
    <section className={`rounded-2xl border border-slate-100 bg-white p-4 ${className}`}>
      <div className="flex items-center justify-between gap-2">
        <div>
          <p className="text-xs font-black uppercase tracking-[0.18em] text-crystal">Platform İstatistikleri</p>
          <p className="mt-1 text-sm font-semibold text-slate-600">Doğrulanmış işlem geçmişi · canlı motor</p>
        </div>
        <span className="rounded-full bg-emerald-50 px-2.5 py-1 text-[0.62rem] font-black uppercase text-emerald-700 ring-1 ring-emerald-100">
          Verified Activity
        </span>
      </div>
      <div className="mt-4 grid grid-cols-1 gap-2 sm:grid-cols-3">
        {items.map((item) => (
          <div className="rounded-xl bg-slate-50 px-3 py-3 text-center ring-1 ring-inset ring-slate-100" key={item.label}>
            <p className="text-lg font-black text-night">
              {item.showDash ? (
                "—"
              ) : (
                <CountUpStat suffix={item.suffix} value={item.value} />
              )}
            </p>
            <p className="mt-1 text-[0.62rem] font-black uppercase tracking-wide text-slate-500">{item.label}</p>
          </div>
        ))}
      </div>
    </section>
  );
}
