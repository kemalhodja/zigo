"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  WEEKLY_LEAGUE_TIERS,
  type WeeklyLeagueParticipant,
  type WeeklyLeagueTier,
  getCountdownToWeeklyReset,
} from "@/lib/domain/weekly-leagues";

interface WeeklyLeagueResponse {
  tier: WeeklyLeagueTier;
  participants: WeeklyLeagueParticipant[];
  viewer: WeeklyLeagueParticipant | null;
  viewerRank: number | null;
}

export function WeeklyLeagueCard() {
  const [data, setData] = useState<WeeklyLeagueResponse | null>(null);
  const [selectedTier, setSelectedTier] = useState<WeeklyLeagueTier>("bronze");
  const [loading, setLoading] = useState(true);
  const [countdown, setCountdown] = useState<string>("");

  useEffect(() => {
    const updateTime = () => {
      setCountdown(getCountdownToWeeklyReset().formatted);
    };
    updateTime();
    const interval = setInterval(updateTime, 60000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    let isMounted = true;
    async function loadLeague() {
      try {
        setLoading(true);
        const res = await fetch(`/api/leagues/weekly?tier=${selectedTier}`);
        if (!res.ok) return;
        const json = await res.json();
        if (isMounted && json.data) {
          setData(json.data);
          if (json.data.tier && !selectedTier) {
            setSelectedTier(json.data.tier);
          }
        }
      } catch (err) {
        console.error("Haftalık lig yüklenemedi:", err);
      } finally {
        if (isMounted) setLoading(false);
      }
    }
    loadLeague();
    return () => {
      isMounted = false;
    };
  }, [selectedTier]);

  const activeTierConfig = WEEKLY_LEAGUE_TIERS[selectedTier] || WEEKLY_LEAGUE_TIERS.bronze;

  return (
    <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-5">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-2xl">{activeTierConfig.emoji}</span>
            <h3 className="text-xl font-black text-slate-900 tracking-tight">
              {activeTierConfig.name}
            </h3>
          </div>
          <p className="text-xs text-slate-500 font-medium mt-0.5">
            İlk 5 sonraki lige terfi eder 🚀 · Son 5 bir alt lige düşer 🔻
          </p>
        </div>

        {/* Countdown Badge */}
        <div className="flex items-center gap-1.5 self-start sm:self-auto px-3 py-1.5 rounded-full bg-indigo-50 border border-indigo-100 text-indigo-700 text-xs font-black">
          <span>⏱️ Kalan:</span>
          <span>{countdown || "Hesaplanıyor..."}</span>
        </div>
      </div>

      {/* Tier Switcher Tabs */}
      <div className="grid grid-cols-4 gap-2 mt-4">
        {(Object.keys(WEEKLY_LEAGUE_TIERS) as WeeklyLeagueTier[]).map((tierKey) => {
          const cfg = WEEKLY_LEAGUE_TIERS[tierKey];
          const isSelected = selectedTier === tierKey;
          return (
            <button
              key={tierKey}
              type="button"
              onClick={() => setSelectedTier(tierKey)}
              className={`tap-scale flex flex-col items-center py-2 px-1 rounded-2xl border text-xs font-black transition-all ${
                isSelected
                  ? "border-crystal bg-crystal/5 text-crystal shadow-sm scale-102"
                  : "border-slate-100 bg-slate-50/70 text-slate-500 hover:bg-slate-100"
              }`}
            >
              <span className="text-lg">{cfg.emoji}</span>
              <span className="mt-1 truncate">{cfg.name.split(" ")[0]}</span>
            </button>
          );
        })}
      </div>

      {/* Participants List */}
      <div className="mt-5 divide-y divide-slate-100 max-h-[380px] overflow-y-auto pr-1">
        {loading ? (
          <div className="py-12 text-center text-xs font-bold text-slate-400 animate-pulse">
            Lig sıralaması yükleniyor...
          </div>
        ) : !data || data.participants.length === 0 ? (
          <div className="py-12 text-center text-xs font-bold text-slate-400">
            Bu ligde henüz puan kazanan yarışmacı bulunmuyor. İlk sen ol! 🎯
          </div>
        ) : (
          data.participants.map((p, idx) => {
            const isTop5 = idx < 5;
            const isBottom5 =
              selectedTier !== "bronze" &&
              idx >= Math.max(0, data.participants.length - 5);
            const isMe = data.viewer?.user_id === p.user_id;

            return (
              <div
                key={p.user_id}
                className={`flex items-center justify-between py-3 px-3 rounded-xl transition-colors ${
                  isMe ? "bg-amber-50 border border-amber-200" : "hover:bg-slate-50/80"
                }`}
              >
                <div className="flex items-center gap-3">
                  {/* Rank Badge */}
                  <span
                    className={`flex h-7 w-7 items-center justify-center rounded-lg text-xs font-black tabular-nums ${
                      idx === 0
                        ? "bg-amber-400 text-white shadow-sm"
                        : idx === 1
                        ? "bg-slate-300 text-slate-800"
                        : idx === 2
                        ? "bg-amber-700 text-white"
                        : isTop5
                        ? "bg-emerald-100 text-emerald-700"
                        : isBottom5
                        ? "bg-rose-100 text-rose-700"
                        : "bg-slate-100 text-slate-600"
                    }`}
                  >
                    {idx + 1}
                  </span>

                  {/* Avatar / Name */}
                  <div className="flex items-center gap-2.5">
                    {p.avatar_url ? (
                      <img
                        src={p.avatar_url}
                        alt={p.full_name}
                        className="h-8 w-8 rounded-full object-cover border border-slate-200"
                      />
                    ) : (
                      <div className="h-8 w-8 rounded-full bg-indigo-100 text-indigo-700 flex items-center justify-center text-xs font-black">
                        {(p.full_name || "Ö").slice(0, 2).toUpperCase()}
                      </div>
                    )}
                    <div>
                      <p className="text-xs font-black text-slate-800 flex items-center gap-1.5">
                        <span className="truncate max-w-[130px] sm:max-w-[200px]">
                          {p.full_name || "Anonim Öğrenci"}
                        </span>
                        {isMe && (
                          <span className="rounded bg-amber-200 px-1 py-0.2 text-[0.6rem] font-black text-amber-900">
                            Sen
                          </span>
                        )}
                      </p>
                      {isTop5 && (
                        <span className="text-[0.65rem] font-bold text-emerald-600 flex items-center gap-0.5">
                          ▲ Terfi Bölgesi
                        </span>
                      )}
                      {isBottom5 && (
                        <span className="text-[0.65rem] font-bold text-rose-500 flex items-center gap-0.5">
                          ▼ Düşme Hattı
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                {/* Points */}
                <div className="text-right">
                  <span className="text-xs font-black text-crystal tabular-nums">
                    {Number(p.weekly_points).toLocaleString("tr-TR")}
                  </span>
                  <span className="text-[0.65rem] font-bold text-slate-400 ml-1">
                    puan
                  </span>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Footer Info */}
      <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-[0.7rem] text-slate-400 font-bold">
        <span>30 Kişilik Haftalık Grup</span>
        <Link
          href="/games"
          className="text-crystal hover:underline font-black flex items-center gap-1"
        >
          Oyun Oyna & Puan Topla →
        </Link>
      </div>
    </div>
  );
}
