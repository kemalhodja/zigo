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
  currentUserId?: string;
  currentScore?: number;
};

export function LeaderboardModal({
  isOpen,
  onClose,
  gameType,
  gameTitle,
  currentUserId,
  currentScore,
}: LeaderboardModalProps) {
  const [data, setData] = useState<LeaderboardEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [myRank, setMyRank] = useState<number | null>(null);
  const [loadError, setLoadError] = useState(false);
  const [retryNonce, setRetryNonce] = useState(0);

  useEffect(() => {
    if (!isOpen) return;

    setLoading(true);
    setLoadError(false);
    fetch(`/api/games/leaderboard?game_type=${gameType}`)
      .then((r) => {
        if (!r.ok) throw new Error(`leaderboard HTTP ${r.status}`);
        return r.json();
      })
      .then((d) => {
        if (Array.isArray(d)) {
          setData(d);
          if (currentUserId) {
            const rank = d.findIndex((e: LeaderboardEntry) => e.user_id === currentUserId);
            setMyRank(rank >= 0 ? rank + 1 : null);
          }
        } else {
          setLoadError(true);
        }
        setLoading(false);
      })
      .catch(() => {
        setLoadError(true);
        setLoading(false);
      });
  }, [isOpen, gameType, currentUserId, retryNonce]);

  if (!isOpen) return null;

  const medalEmoji = (idx: number) => {
    if (idx === 0) return "🥇";
    if (idx === 1) return "🥈";
    if (idx === 2) return "🥉";
    return null;
  };

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
        <div className="text-center mb-4 mt-2">
          <div className="w-16 h-16 bg-gradient-to-br from-amber-400 to-orange-500 rounded-2xl flex items-center justify-center mx-auto mb-3 shadow-lg shadow-amber-500/30 text-3xl">
            🏆
          </div>
          <h2 className="text-xl font-black text-white">{gameTitle} Liderleri</h2>
          <p className="text-xs font-medium text-slate-400 mt-1">En yüksek skora sahip 20 oyuncu</p>

          {/* Current user's rank badge */}
          {myRank !== null && (
            <div className="mt-3 inline-flex items-center gap-2 bg-indigo-500/20 border border-indigo-400/40 rounded-xl px-3 py-1.5">
              <span className="text-indigo-300 font-black text-sm">Sıran:</span>
              <span className="text-white font-black text-lg">#{myRank}</span>
              {currentScore != null && (
                <span className="text-emerald-400 font-bold text-sm">({currentScore} puan)</span>
              )}
            </div>
          )}
          {myRank === null && currentUserId && !loading && data.length > 0 && (
            <div className="mt-3 inline-flex items-center gap-2 bg-slate-700/40 border border-slate-600/40 rounded-xl px-3 py-1.5">
              <span className="text-slate-400 font-medium text-xs">Henüz ilk 20'de değilsin</span>
            </div>
          )}
        </div>

        {/* List */}
        <div className="space-y-2 max-h-[45vh] overflow-y-auto pr-1">
          {loading ? (
            <div className="text-center py-6 text-slate-400 animate-pulse text-sm font-medium">
              Yükleniyor...
            </div>
          ) : loadError ? (
            <div className="text-center py-6 space-y-3">
              <p className="text-slate-400 text-sm font-medium">
                Sıralama yüklenemedi. Bağlantını kontrol et.
              </p>
              <button
                type="button"
                onClick={() => setRetryNonce((n) => n + 1)}
                className="tap-scale bg-indigo-500/80 hover:bg-indigo-500 text-white text-xs font-black px-4 py-2 rounded-xl transition-colors"
              >
                🔄 Tekrar Dene
              </button>
            </div>
          ) : data.length === 0 ? (
            <div className="text-center py-6 text-slate-500 text-sm font-medium">
              Henüz skor kaydedilmemiş. İlk giren sen ol!
            </div>
          ) : (
            data.map((player, idx) => {
              const isMe = player.user_id === currentUserId;
              const medal = medalEmoji(idx);
              return (
                <div
                  key={player.user_id + idx}
                  className={`flex items-center gap-3 p-3 rounded-2xl border transition-all ${
                    isMe
                      ? "bg-indigo-500/20 border-indigo-400/60 ring-1 ring-indigo-400/40 shadow-[0_0_15px_rgba(99,102,241,0.3)]"
                      : idx === 0 ? "bg-gradient-to-r from-amber-500/20 to-amber-700/20 border-amber-400/60 shadow-[0_0_15px_rgba(251,191,36,0.3)]"
                      : idx === 1 ? "bg-gradient-to-r from-slate-300/15 to-slate-500/15 border-slate-300/50"
                      : idx === 2 ? "bg-gradient-to-r from-orange-500/15 to-orange-700/15 border-orange-500/50"
                      : "bg-white/5 border-white/5"
                  }`}
                >
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center font-black text-sm shrink-0 ${
                    isMe ? "bg-indigo-500 text-white shadow-[0_0_10px_rgba(99,102,241,0.6)]"
                    : idx === 0 ? "bg-amber-400 text-amber-950"
                    : idx === 1 ? "bg-slate-300 text-slate-900"
                    : idx === 2 ? "bg-orange-500 text-orange-950"
                    : "bg-slate-700 text-slate-300"
                  }`}>
                    {medal ?? (idx + 1)}
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className={`font-bold text-sm truncate ${isMe ? "text-indigo-200" : "text-slate-200"}`}>
                      {isMe ? "👤 Sen" : player.full_name}
                    </div>
                    <div className="text-[0.62rem] font-medium text-slate-500">
                      Seviye {player.last_level}
                    </div>
                  </div>

                  <div className="text-right shrink-0">
                    <div className={`font-black text-sm ${isMe ? "text-indigo-300" : "text-emerald-400"}`}>
                      {player.high_score}
                    </div>
                    <div className="text-[0.6rem] font-bold text-slate-500 uppercase">Puan</div>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
}
