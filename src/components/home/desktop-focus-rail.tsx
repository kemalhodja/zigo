"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

import { formatCountdown, getRoomPhase, type RoomPhase } from "@/lib/domain/focus-rooms";

/**
 * Desktop right rail: globally-synced focus block countdown + shortcuts.
 * Only rendered on lg+ screens when the desktopLayout flag is enabled.
 */
export function DesktopFocusRail() {
  const [phase, setPhase] = useState<RoomPhase>(() => getRoomPhase());

  useEffect(() => {
    const timer = setInterval(() => setPhase(getRoomPhase(Date.now())), 1000);
    return () => clearInterval(timer);
  }, []);

  return (
    <aside className="sticky top-6 hidden h-fit w-[320px] shrink-0 space-y-4 lg:block">
      <div className="overflow-hidden rounded-3xl bg-slate-900 p-6 text-white shadow-xl">
        <p
          className={`text-xs font-black uppercase tracking-widest ${
            phase.phase === "focus" ? "text-emerald-400" : "text-amber-300"
          }`}
        >
          {phase.phase === "focus" ? "🎯 Odak Bloğu Sürüyor" : "☕ Mola Ver"}
        </p>
        <p className="mt-2 font-mono text-4xl font-black tabular-nums tracking-wider">
          {formatCountdown(phase.secondsRemaining)}
        </p>
        <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-white/10">
          <div
            className={`h-full transition-all duration-1000 ${
              phase.phase === "focus" ? "bg-emerald-500" : "bg-amber-400"
            }`}
            style={{
              width: `${Math.round(
                ((phase.phase === "focus" ? 25 * 60 : 5 * 60) - phase.secondsRemaining) /
                  (phase.phase === "focus" ? 25 * 60 : 5 * 60) *
                  100,
              )}%`,
            }}
          />
        </div>
        <Link
          href="/rooms"
          className="tap-scale mt-5 block rounded-xl bg-white/10 py-2.5 text-center text-sm font-black text-white transition hover:bg-white/20"
        >
          Odak Odasına Katıl
        </Link>
      </div>

      <div className="rounded-3xl border border-slate-100 bg-white p-5 shadow-sm">
        <p className="text-xs font-black uppercase tracking-widest text-slate-400">Bugün</p>
        <ul className="mt-3 space-y-2.5 text-sm font-bold text-slate-600">
          <li>
            <Link href="/student/games/math" className="flex items-center gap-2 transition hover:text-indigo-600">
              🧮 Matematik Ustası&apos;nda turnuvaya katıl
            </Link>
          </li>
          <li>
            <Link href="/learn" className="flex items-center gap-2 transition hover:text-indigo-600">
              📚 Günlük görevlerini tamamla
            </Link>
          </li>
          <li>
            <Link href="/exams" className="flex items-center gap-2 transition hover:text-indigo-600">
              🏁 Sınav geri sayımına bak
            </Link>
          </li>
          <li>
            <Link href="/questions" className="flex items-center gap-2 transition hover:text-indigo-600">
              ❓ Takıldığın soruyu sor
            </Link>
          </li>
        </ul>
      </div>
    </aside>
  );
}
