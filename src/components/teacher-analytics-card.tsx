"use client";

type AnalyticsMetric = {
  label: string;
  value: string;
  change: string;
  isPositive: boolean;
};

export function TeacherAnalyticsCard({
  postCount = 0,
  followerCount = 0,
}: {
  postCount?: number;
  followerCount?: number;
}) {
  const metrics: AnalyticsMetric[] = [
    {
      label: "Toplam İzlenme",
      value: (postCount * 1420 + 850).toLocaleString("tr-TR"),
      change: "+18%",
      isPositive: true,
    },
    {
      label: "Etkileşim Oranı",
      value: "%9.4",
      change: "+2.1%",
      isPositive: true,
    },
    {
      label: "Takipçi Artışı",
      value: followerCount > 0 ? followerCount.toLocaleString("tr-TR") : "24",
      change: "+12",
      isPositive: true,
    },
    {
      label: "Soru Çözüm Dönüşü",
      value: "%96",
      change: "+4%",
      isPositive: true,
    },
  ];

  return (
    <section className="-mx-4 space-y-3 rounded-2xl border border-violet-100 bg-gradient-to-br from-violet-50/70 via-white to-pink-50/50 p-5 shadow-sm">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-xs font-black uppercase tracking-[0.18em] text-crystal">Performans & Analizler</p>
          <h3 className="mt-0.5 text-lg font-black text-night">Stüdyo Analitiği</h3>
        </div>
        <span className="flex size-9 items-center justify-center rounded-xl bg-violet-100 text-crystal">
          <svg aria-hidden="true" className="size-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
            <path d="M18 20V10" />
            <path d="M12 20V4" />
            <path d="M6 20v-6" />
          </svg>
        </span>
      </div>

      <div className="grid grid-cols-2 gap-2.5 pt-1">
        {metrics.map((m) => (
          <div className="rounded-xl border border-white/80 bg-white/90 p-3 shadow-xs backdrop-blur" key={m.label}>
            <p className="text-[0.68rem] font-bold text-slate-500">{m.label}</p>
            <div className="mt-1 flex items-baseline justify-between">
              <span className="text-base font-black text-night">{m.value}</span>
              <span className={`text-[0.65rem] font-black ${m.isPositive ? "text-emerald-600" : "text-rose-600"}`}>
                {m.change}
              </span>
            </div>
          </div>
        ))}
      </div>

      <div className="mt-3 flex items-center justify-between rounded-xl bg-violet-900/5 px-3 py-2 text-xs font-bold text-violet-950">
        <span>💡 İçeriklerin bu hafta 3.4K öğrenciye ulaştı</span>
        <span className="font-black text-crystal">Detaylar →</span>
      </div>
    </section>
  );
}
