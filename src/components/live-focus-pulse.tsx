"use client";

import { useEffect, useState } from "react";
import { Users, Flame } from "lucide-react";

export function LiveFocusPulse() {
  const [activeCount, setActiveCount] = useState<number>(1420);

  useEffect(() => {
    // Generate realistic fluctuating live focus numbers around 1400-1500
    const interval = setInterval(() => {
      setActiveCount((prev) => {
        const delta = Math.floor(Math.random() * 7) - 3;
        const next = prev + delta;
        return next < 1350 ? 1350 : next > 1550 ? 1550 : next;
      });
    }, 4000);

    return () => clearInterval(interval);
  }, []);

  return (
    <div className="flex items-center gap-2 rounded-2xl border border-emerald-200/80 bg-gradient-to-r from-emerald-50 via-teal-50/50 to-white px-3.5 py-2.5 shadow-2xs">
      <span className="relative flex size-2.5">
        <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75"></span>
        <span className="relative inline-flex size-2.5 rounded-full bg-emerald-500"></span>
      </span>
      <div className="flex items-center gap-1.5 min-w-0">
        <span className="text-xs font-black text-slate-900">
          {activeCount.toLocaleString()} Öğrenci
        </span>
        <span className="text-xs font-semibold text-slate-600 truncate">
          şu an odaklanma modunda ders çalışıyor
        </span>
      </div>
      <div className="ml-auto hidden sm:flex items-center gap-1 rounded-md bg-emerald-100/70 px-1.5 py-0.5 text-[10px] font-black text-emerald-800">
        <Flame className="size-3 text-orange-500 fill-orange-500" />
        Canlı
      </div>
    </div>
  );
}
