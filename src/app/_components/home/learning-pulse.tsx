"use client";

import Link from "next/link";
import { useState } from "react";

import { useMessages } from "@/lib/i18n/locale-context";

export function HomeLearningPulse() {
  const m = useMessages();
  const f = m.feed;
  const [collapsed, setCollapsed] = useState(false);

  return (
    <section className="feed-pulse-hero -mx-4 overflow-hidden text-white transition-all duration-300">
      <div className="relative z-[1] flex items-center justify-between border-b border-white/10 px-4 py-3">
        <div className="flex items-center gap-2">
          <span className="relative flex h-2 w-2">
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-pink-400 opacity-75" />
            <span className="relative inline-flex h-2 w-2 rounded-full bg-pink-500" />
          </span>
          <h2 className="text-sm font-black uppercase tracking-wider">{f.feedPulse || "Akış Nabzı"}</h2>
        </div>
        <button
          className="tap-scale rounded-lg bg-white/10 px-2.5 py-1 text-xs font-bold transition hover:bg-white/20"
          onClick={() => setCollapsed(!collapsed)}
          type="button"
        >
          {collapsed ? m.common.open : m.common.close}
        </button>
      </div>

      {!collapsed ? (
        <div className="relative z-[1] space-y-4 px-4 py-4">
          <p className="text-xs font-medium leading-relaxed text-white/85">
            Senin için hazırlanmış kısa dersleri ve mücadeleleri keşfet.
          </p>

          <div className="zigo-action-grid">
            <Link className="zigo-action-chip tap-scale rounded-xl bg-white/12 text-white shadow-sm shadow-black/10 hover:bg-white/18" href="/micro">
              <span className="flex flex-col items-center">
                <span className="text-xs font-black">{m.nav.micro || "Kısa Ders"}</span>
                <span className="text-[10px] font-bold text-pink-200">+10 puan</span>
              </span>
            </Link>
            <Link className="zigo-action-chip tap-scale rounded-xl bg-white/12 text-white shadow-sm shadow-black/10 hover:bg-white/18" href="/learn">
              <span className="flex flex-col items-center">
                <span className="text-xs font-black">Quiz</span>
                <span className="text-[10px] font-bold text-cyan-200">Pratik</span>
              </span>
            </Link>
          </div>


        </div>
      ) : null}
    </section>
  );
}
