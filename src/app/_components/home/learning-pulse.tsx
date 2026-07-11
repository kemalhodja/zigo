"use client";

import Link from "next/link";
import { useState } from "react";

import { useMessages } from "@/lib/i18n/locale-context";

export function HomeLearningPulse() {
  const m = useMessages();
  const f = m.feed;
  const [collapsed, setCollapsed] = useState(false);

  // trendingTopics list
  const trendingTopics = [
    { label: "Fractions", href: "/explore?q=fractions" },
    { label: "Science Lab", href: "/explore?q=science" },
    { label: "Grammar Boost", href: "/explore?q=english" }
  ];

  return (
    <section className="feed-pulse-hero -mx-4 overflow-hidden bg-gradient-to-br from-slate-900 via-purple-950 to-violet-900 text-white transition-all duration-300">
      <div className="flex items-center justify-between px-4 py-3 border-b border-white/10">
        <div className="flex items-center gap-2">
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-pink-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2 w-2 bg-pink-500"></span>
          </span>
          <h2 className="text-sm font-black uppercase tracking-wider">{f.feedPulse || "Learning Pulse"}</h2>
        </div>
        <button
          onClick={() => setCollapsed(!collapsed)}
          className="text-xs font-bold px-2.5 py-1 rounded bg-white/10 hover:bg-white/20 transition"
        >
          {collapsed ? m.common.open : m.common.close}
        </button>
      </div>

      {!collapsed && (
        <div className="px-4 py-4 space-y-4">
          <p className="text-xs text-white/80 leading-relaxed font-medium">
            Discover bite-sized learning moments and challenges customized for you.
          </p>
          
          <div className="zigo-action-grid">
            <Link className="zigo-action-chip tap-scale rounded-xl bg-white/10 text-white hover:bg-white/15" href="/micro">
              <span className="flex flex-col items-center">
                <span className="text-xs font-black">{m.nav.micro || "Micro"}</span>
                <span className="text-[10px] text-pink-300 font-bold">+10 pts</span>
              </span>
            </Link>
            <Link className="zigo-action-chip tap-scale rounded-xl bg-white/10 text-white hover:bg-white/15" href="/learn">
              <span className="flex flex-col items-center">
                <span className="text-xs font-black">Quiz</span>
                <span className="text-[10px] text-cyan-300 font-bold">Practice</span>
              </span>
            </Link>
            <Link className="zigo-action-chip tap-scale rounded-xl bg-white/10 text-white hover:bg-white/15" href="/duels">
              <span className="flex flex-col items-center">
                <span className="text-xs font-black">Duels</span>
                <span className="text-[10px] text-amber-300 font-bold">Race</span>
              </span>
            </Link>
          </div>

          <div className="pt-2 border-t border-white/5">
            <p className="text-[10px] font-black uppercase tracking-wider text-pink-300">Trending Topics</p>
            <div className="mt-2 flex flex-wrap gap-1.5">
              {trendingTopics.map((topic) => (
                <Link
                  key={topic.label}
                  href={topic.href}
                  className="text-xs font-bold bg-white/5 border border-white/10 hover:border-white/20 px-2.5 py-1 rounded-full text-white/90 hover:text-white transition"
                >
                  #{topic.label}
                </Link>
              ))}
            </div>
          </div>
        </div>
      )}
    </section>
  );
}
