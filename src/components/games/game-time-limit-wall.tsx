"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";

type LimitReason = "night_ban" | "daily_limit" | null;

interface GameTimeLimitWallProps {
  backHref: string;
  backLabel: string;
  children: React.ReactNode;
}

interface LimitStatus {
  allowed: boolean;
  reason?: LimitReason;
  message?: string;
  remainingMinutes?: number;
  activeHours?: string;
}

async function fetchLimitStatus(): Promise<LimitStatus> {
  const r = await fetch("/api/games/check-limit");
  if (!r.ok) return { allowed: true };
  const data = await r.json();
  if (!data.allowed && (data.reason === "unauthenticated" || data.reason === "not_student")) {
    return { allowed: true };
  }
  return data as LimitStatus;
}

export function GameTimeLimitWall({ backHref, backLabel, children }: GameTimeLimitWallProps) {
  const [status, setStatus] = useState<LimitStatus | null>(null);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    try {
      const data = await fetchLimitStatus();
      setStatus(data);
    } catch {
      setStatus({ allowed: true });
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  // Oturum sırasında limit dolarsa yakalamak için periyodik kontrol
  useEffect(() => {
    if (!status?.allowed) return;
    const interval = window.setInterval(() => {
      void refresh();
    }, 60_000);
    return () => window.clearInterval(interval);
  }, [status?.allowed, refresh]);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
        <div className="size-10 rounded-full border-4 border-indigo-500 border-t-transparent animate-spin" />
        <p className="text-sm font-bold text-slate-500">Kontrol ediliyor...</p>
      </div>
    );
  }

  if (!status || status.allowed) {
    return (
      <>
        {status?.remainingMinutes !== undefined && status.remainingMinutes > 0 ? (
          <p className="mb-3 text-center text-[0.65rem] font-bold text-slate-400">
            Bugün kalan oyun süresi: ~{status.remainingMinutes} dk
            {status.activeHours ? ` · Aktif saatler ${status.activeHours}` : ""}
          </p>
        ) : null}
        {children}
      </>
    );
  }

  const isNightBan = status.reason === "night_ban";

  return (
    <div className="min-h-[60vh] flex flex-col items-center justify-center px-6 text-center gap-5">
      <div
        className={`size-24 rounded-3xl flex items-center justify-center shadow-lg ${
          isNightBan
            ? "bg-gradient-to-br from-indigo-900 to-slate-800"
            : "bg-gradient-to-br from-amber-400 to-orange-500"
        }`}
      >
        <span className="text-5xl">{isNightBan ? "🌙" : "⏱️"}</span>
      </div>

      <div>
        <h2 className="text-2xl font-black text-night">
          {isNightBan ? "Gece Modu Aktif" : "Günlük Süren Doldu!"}
        </h2>
        <p className="mt-2 text-sm font-semibold text-slate-500 max-w-xs leading-relaxed">
          {status.message}
        </p>
      </div>

      {!isNightBan ? (
        <div className="w-full max-w-xs bg-amber-50 border border-amber-200 rounded-2xl p-4">
          <p className="text-xs font-bold text-amber-700 uppercase tracking-wide mb-1">Kalan Süre</p>
          <p className="text-3xl font-black text-amber-600">0 dk</p>
          <p className="text-xs font-semibold text-amber-500 mt-1">
            Limit yarın gece yarısında sıfırlanır
          </p>
        </div>
      ) : (
        <div className="w-full max-w-xs bg-indigo-50 border border-indigo-200 rounded-2xl p-4">
          <p className="text-xs font-bold text-indigo-700 uppercase tracking-wide mb-1">
            Oyun Saatleri
          </p>
          <p className="text-lg font-black text-indigo-700">
            {status.activeHours ?? "08:00 – 22:00"}
          </p>
          <p className="text-xs font-semibold text-indigo-500 mt-1">
            Bu saatler arasında oyunlar aktif olacak
          </p>
        </div>
      )}

      <Link
        href={backHref}
        className="mt-2 tap-scale inline-flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white px-6 py-3 rounded-2xl font-black text-sm transition shadow-md shadow-indigo-200"
      >
        <span>←</span>
        <span>{backLabel}</span>
      </Link>
    </div>
  );
}
