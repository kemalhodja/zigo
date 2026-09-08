"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

import { formatCountdown, getRoomPhase, type RoomPhase } from "@/lib/domain/focus-rooms";

export function FocusBlockWidget() {
  const [phase, setPhase] = useState<RoomPhase>(() => getRoomPhase());

  useEffect(() => {
    const timer = setInterval(() => setPhase(getRoomPhase(Date.now())), 1000);
    return () => clearInterval(timer);
  }, []);

  const isFocus = phase.phase === "focus";
  const totalSeconds = isFocus ? 25 * 60 : 5 * 60;
  const progressPercent = Math.round(((totalSeconds - phase.secondsRemaining) / totalSeconds) * 100);

  return (
    <div className="overflow-hidden rounded-2xl bg-slate-900 p-5 text-white shadow-md">
      <div className="flex items-center justify-between">
        <p
          className={`text-xs font-black uppercase tracking-wider ${
            isFocus ? "text-emerald-400" : "text-amber-300"
          }`}
        >
          {isFocus ? "🎯 Odak Bloğu Sürüyor" : "☕ Mola Zamanı"}
        </p>
        <span className="rounded-full bg-white/10 px-2 py-0.5 text-[10px] font-bold text-slate-300">
          Canlı
        </span>
      </div>

      <p className="mt-2 font-mono text-3xl font-black tabular-nums tracking-wider text-white">
        {formatCountdown(phase.secondsRemaining)}
      </p>

      <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-white/10">
        <div
          className={`h-full transition-all duration-1000 ${
            isFocus ? "bg-emerald-400" : "bg-amber-400"
          }`}
          style={{ width: `${Math.min(100, Math.max(0, progressPercent))}%` }}
        />
      </div>

      <Link
        href="/rooms"
        className="mt-4 block w-full rounded-xl bg-white/15 py-2.5 text-center text-xs font-bold text-white transition-all hover:bg-white/25 active:scale-95"
      >
        Odak Odasına Katıl
      </Link>
    </div>
  );
}
