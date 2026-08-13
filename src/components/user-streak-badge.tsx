"use client";

import { useEffect, useState } from "react";

type UserStreakBadgeProps = {
  streakCount?: number;
  xpPoints?: number;
  compact?: boolean;
};

export function UserStreakBadge({
  streakCount: initialStreak = 3,
  xpPoints: initialXp = 120,
  compact = false,
}: UserStreakBadgeProps) {
  const [streakCount, setStreakCount] = useState(initialStreak);
  const [xpPoints, setXpPoints] = useState(initialXp);

  useEffect(() => {
    const handleStreakUpdate = (e: Event) => {
      const customEvent = e as CustomEvent<{ streak: number; pointsAwarded: number }>;
      if (customEvent.detail) {
        setStreakCount(customEvent.detail.streak);
        setXpPoints((prev) => prev + customEvent.detail.pointsAwarded);
      }
    };

    window.addEventListener("zigo:streak-updated", handleStreakUpdate);
    return () => window.removeEventListener("zigo:streak-updated", handleStreakUpdate);
  }, []);

  if (compact) {
    return (
      <div className="inline-flex items-center gap-1.5 rounded-full border border-amber-300/40 bg-amber-500/10 px-2.5 py-1 text-xs font-black text-amber-500">
        <span className="animate-bounce">🔥</span>
        <span>{streakCount} Gün Seri</span>
      </div>
    );
  }

  return (
    <div className="flex items-center justify-between rounded-2xl border border-amber-300/30 bg-gradient-to-r from-amber-500/15 via-orange-500/10 to-amber-500/15 p-3.5 shadow-sm">
      <div className="flex items-center gap-3">
        <div className="flex size-11 items-center justify-center rounded-xl bg-amber-400 text-2xl shadow-inner animate-pulse">
          🔥
        </div>
        <div>
          <div className="flex items-center gap-1.5">
            <span className="text-sm font-black text-white">{streakCount} Günlük Seri</span>
            <span className="rounded-full bg-amber-400 px-2 py-0.5 text-[0.6rem] font-black uppercase text-slate-950">
              Aktif
            </span>
          </div>
          <p className="text-[0.7rem] font-semibold text-amber-200/90">
            Her gün uygulamaya gir, serini bozma ve hediye XP kazan!
          </p>
        </div>
      </div>
      <div className="text-right">
        <span className="text-xs font-extrabold text-amber-300/70 uppercase tracking-wider block">Toplam XP</span>
        <span className="text-lg font-black text-amber-400">⚡ {xpPoints}</span>
      </div>
    </div>
  );
}
