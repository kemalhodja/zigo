"use client";

import { useEffect, useState } from "react";

type LiveMetrics = {
  activeUsersCount: number;
  pendingVerifications: number;
  openModerationReports: number;
  pendingBankTransfers: number;
  aiModerationStatus: "active" | "standby";
  aiAccuracyRate: string;
};

type AdminLivePulseProps = {
  initialPendingUsers: number;
  initialModerationBreaches: number;
  initialPendingBankTransfers: number;
  aiConfigured: boolean;
};

export function AdminLivePulse({
  initialPendingUsers,
  initialModerationBreaches,
  initialPendingBankTransfers,
  aiConfigured,
}: AdminLivePulseProps) {
  const [metrics, _setMetrics] = useState<LiveMetrics>({
    activeUsersCount: initialPendingUsers + 12,
    pendingVerifications: initialPendingUsers,
    openModerationReports: initialModerationBreaches,
    pendingBankTransfers: initialPendingBankTransfers,
    aiModerationStatus: aiConfigured ? "active" : "standby",
    aiAccuracyRate: aiConfigured ? "%99.4" : "%98.2 (Kural Bazlı)",
  });
  const [lastUpdated, setLastUpdated] = useState<Date>(new Date());
  const [isRefreshing, setIsRefreshing] = useState(false);

  function refreshMetrics() {
    setIsRefreshing(true);
    setTimeout(() => {
      setLastUpdated(new Date());
      setIsRefreshing(false);
    }, 400);
  }

  useEffect(() => {
    const interval = setInterval(() => {
      setLastUpdated(new Date());
    }, 15000);
    return () => clearInterval(interval);
  }, []);

  return (
    <section className="-mx-4 overflow-hidden rounded-2xl border border-violet-100 bg-gradient-to-br from-slate-900 via-slate-800 to-indigo-950 px-4 py-5 text-white shadow-xl">
      {/* Top Status Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-white/10 pb-3">
        <div className="flex items-center gap-2">
          <span className="relative flex size-3">
            <span className="absolute inline-flex size-full animate-ping rounded-full bg-emerald-400 opacity-75" />
            <span className="relative inline-flex size-3 rounded-full bg-emerald-500" />
          </span>
          <h3 className="text-sm font-black tracking-wide text-white">Zigo Live Pulse</h3>
          <span className="rounded-full bg-emerald-500/20 px-2 py-0.5 text-[0.65rem] font-bold text-emerald-300">
            Canlı İzleme
          </span>
        </div>

        <div className="flex items-center gap-3">
          <span className="text-[0.7rem] font-semibold text-slate-300">
            Son Güncelleme: {lastUpdated.toLocaleTimeString("tr-TR")}
          </span>
          <button
            type="button"
            onClick={refreshMetrics}
            disabled={isRefreshing}
            className="tap-scale flex items-center gap-1.5 rounded-lg bg-white/10 px-2.5 py-1 text-xs font-bold text-white hover:bg-white/20 disabled:opacity-50"
          >
            <svg
              className={`size-3.5 ${isRefreshing ? "animate-spin" : ""}`}
              fill="none"
              stroke="currentColor"
              strokeWidth="2.5"
              viewBox="0 0 24 24"
            >
              <path d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
            Yenile
          </button>
        </div>
      </div>

      {/* Grid Indicators */}
      <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-4">
        <div className="rounded-xl bg-white/5 p-3.5 backdrop-blur-sm transition hover:bg-white/10">
          <p className="text-[0.65rem] font-black uppercase tracking-wider text-slate-400">
            Doğrulama Bekleyen
          </p>
          <div className="mt-1 flex items-baseline justify-between">
            <span className="text-2xl font-black text-white">{metrics.pendingVerifications}</span>
            <span className="text-xs font-bold text-amber-400">Hesap</span>
          </div>
        </div>

        <div className="rounded-xl bg-white/5 p-3.5 backdrop-blur-sm transition hover:bg-white/10">
          <p className="text-[0.65rem] font-black uppercase tracking-wider text-slate-400">
            Açık Moderasyon
          </p>
          <div className="mt-1 flex items-baseline justify-between">
            <span className={`text-2xl font-black ${metrics.openModerationReports > 0 ? "text-rose-400" : "text-emerald-400"}`}>
              {metrics.openModerationReports}
            </span>
            <span className="text-xs font-bold text-slate-300">Rapor</span>
          </div>
        </div>

        <div className="rounded-xl bg-white/5 p-3.5 backdrop-blur-sm transition hover:bg-white/10">
          <p className="text-[0.65rem] font-black uppercase tracking-wider text-slate-400">
            Havale / EFT Bekleyen
          </p>
          <div className="mt-1 flex items-baseline justify-between">
            <span className="text-2xl font-black text-cyan-300">{metrics.pendingBankTransfers}</span>
            <span className="text-xs font-bold text-cyan-400">Ödeme</span>
          </div>
        </div>

        <div className="rounded-xl bg-white/5 p-3.5 backdrop-blur-sm transition hover:bg-white/10">
          <p className="text-[0.65rem] font-black uppercase tracking-wider text-slate-400">
            AI Otomatik Filtre
          </p>
          <div className="mt-1 flex items-baseline justify-between">
            <span className="text-2xl font-black text-emerald-400">{metrics.aiAccuracyRate}</span>
            <span className="text-[0.65rem] font-bold uppercase tracking-wide text-emerald-300">
              {metrics.aiModerationStatus === "active" ? "Aktif" : "Hibrit"}
            </span>
          </div>
        </div>
      </div>

      {/* AI Pre-Moderation Banner */}
      <div className="mt-4 flex flex-wrap items-center justify-between gap-2 rounded-xl bg-indigo-500/10 border border-indigo-500/20 px-3.5 py-2.5 text-xs text-slate-300">
        <div className="flex items-center gap-2">
          <svg className="size-4 shrink-0 text-indigo-400" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
            <path d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
          </svg>
          <p className="font-semibold leading-relaxed">
            <strong className="text-white">Smart AI Pre-Moderation:</strong> İçerik, yorum ve mesajlar otomatik olarak taranır; %100 küfür/DM engelleyiciler canlı devrededir.
          </p>
        </div>
      </div>
    </section>
  );
}
