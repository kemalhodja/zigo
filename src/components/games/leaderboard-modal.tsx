"use client";

import { useEffect, useState } from "react";

type LeaderboardEntry = {
  user_id: string;
  full_name: string;
  avatar_url: string | null;
  high_score: number;
  last_level: number;
};

type LeaderboardModalProps = {
  isOpen: boolean;
  onClose: () => void;
  gameType: string;
  gameTitle: string;
};

export function LeaderboardModal({ isOpen, onClose, gameType, gameTitle }: LeaderboardModalProps) {
  const [data, setData] = useState<LeaderboardEntry[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!isOpen) return;
    
    setLoading(true);
    fetch(`/api/games/leaderboard?game_type=${gameType}`)
      .then((r) => r.json())
      .then((d) => {
        if (Array.isArray(d)) setData(d);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, [isOpen, gameType]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in duration-200 select-none">
      <div className="bg-gradient-to-br from-slate-900 to-slate-800 border border-white/10 rounded-3xl p-6 max-w-sm w-full shadow-2xl relative animate-in zoom-in-95 duration-300">
        
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 w-8 h-8 flex items-center justify-center rounded-full bg-white/10 text-slate-300 hover:bg-white/20 transition-colors"
        >
          ✕
        </button>

        {/* Header */}
        <div className="text-center mb-6 mt-2">
          <div className="w-16 h-16 bg-gradient-to-br from-amber-400 to-orange-500 rounded-2xl flex items-center justify-center mx-auto mb-3 shadow-lg shadow-amber-500/30 text-3xl">
            🏆
          </div>
          <h2 className="text-xl font-black text-white">{gameTitle} Liderleri</h2>
          <p className="text-xs font-medium text-slate-400 mt-1">En yüksek skora sahip 20 oyuncu</p>
        </div>

        {/* List */}
        <div className="space-y-3 max-h-[50vh] overflow-y-auto pr-2 custom-scrollbar">
          {loading ? (
            <div className="text-center py-6 text-slate-400 animate-pulse text-sm font-medium">
              Yükleniyor...
            </div>
          ) : data.length === 0 ? (
            <div className="text-center py-6 text-slate-500 text-sm font-medium">
              Henüz skor kaydedilmemiş. İlk giren sen ol!
            </div>
          ) : (
            data.map((player, idx) => (
              <div 
                key={player.user_id + idx} 
                className={`flex items-center gap-3 p-3 rounded-2xl border transition-all ${
                  idx === 0 ? "bg-gradient-to-r from-amber-500/20 to-amber-700/20 border-amber-400/80 shadow-[0_0_15px_rgba(251,191,36,0.4)] scale-[1.02] z-10 relative" :
                  idx === 1 ? "bg-gradient-to-r from-slate-300/20 to-slate-500/20 border-slate-300/80 shadow-[0_0_12px_rgba(203,213,225,0.3)] scale-[1.01] z-10 relative" :
                  idx === 2 ? "bg-gradient-to-r from-orange-500/20 to-orange-700/20 border-orange-500/80 shadow-[0_0_12px_rgba(249,115,22,0.3)] z-10 relative" :
                  "bg-white/5 border-white/5"
                }`}
              >
                <div className={`w-8 h-8 rounded-full flex items-center justify-center font-black text-sm shrink-0 ${
                  idx === 0 ? "bg-amber-400 text-amber-950 shadow-[0_0_10px_rgba(251,191,36,0.8)]" :
                  idx === 1 ? "bg-slate-300 text-slate-900 shadow-[0_0_10px_rgba(203,213,225,0.6)]" :
                  idx === 2 ? "bg-orange-500 text-orange-950 shadow-[0_0_10px_rgba(249,115,22,0.6)]" :
                  "bg-slate-700 text-slate-300"
                }`}>
                  {idx + 1}
                </div>
                
                <div className="flex-1 min-w-0">
                  <div className="font-bold text-sm text-slate-200 truncate">
                    {player.full_name}
                  </div>
                  <div className="text-[0.65rem] font-medium text-slate-500">
                    Seviye {player.last_level}
                  </div>
                </div>
                
                <div className="text-right shrink-0">
                  <div className="font-black text-emerald-400 text-sm">
                    {player.high_score}
                  </div>
                  <div className="text-[0.6rem] font-bold text-slate-500 uppercase">
                    Puan
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
