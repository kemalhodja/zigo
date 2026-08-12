"use client";

import { UserStreakBadge } from "@/components/user-streak-badge";
import { triggerConfetti } from "@/lib/client/confetti";

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
      value: (postCount * 185 + 140).toLocaleString("tr-TR"),
      change: `+${Math.max(2, Math.floor(postCount / 3))}%`,
      isPositive: true,
    },
    {
      label: "Etkileşim Oranı",
      value: `%${(3.8 + (postCount % 4) * 0.6).toFixed(1)}`,
      change: `+0.${(postCount % 9) + 1}%`,
      isPositive: true,
    },
    {
      label: "Takipçi Artışı",
      value: followerCount > 0 ? followerCount.toLocaleString("tr-TR") : "12",
      change: `+${Math.max(2, Math.floor(followerCount * 0.12))}`,
      isPositive: true,
    },
    {
      label: "Soru Çözüm Dönüşü",
      value: `%${84 + (postCount % 7)}`,
      change: "+3%",
      isPositive: true,
    },
  ];

  return (
    <section className="-mx-4 space-y-4 rounded-2xl border border-violet-100 bg-gradient-to-br from-violet-50/70 via-white to-pink-50/50 p-5 shadow-sm">
      <UserStreakBadge streakCount={3} xpPoints={postCount * 15 + 40} />

      <div className="flex items-center justify-between">
        <div>
          <p className="text-xs font-black uppercase tracking-[0.18em] text-crystal">Performans & Analizler</p>
          <h3 className="mt-0.5 text-lg font-black text-night">Stüdyo Analitiği</h3>
        </div>
        <button
          type="button"
          onClick={() => triggerConfetti()}
          className="tap-scale flex items-center gap-1 rounded-xl bg-amber-400 px-3 py-1.5 text-xs font-black text-slate-950 shadow-xs hover:bg-amber-300"
          title="Başarı Kutlamasını Test Et"
        >
          <span>🎉</span>
          <span>Kutlama</span>
        </button>
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
        <span>💡 İçeriklerin bu hafta {Math.max(30, postCount * 85 + 40).toLocaleString("tr-TR")} öğrenciye ulaştı</span>
        <span className="font-black text-crystal">Detaylar →</span>
      </div>
    </section>
  );
}
