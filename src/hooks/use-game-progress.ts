"use client";

import { useCallback, useEffect, useRef, useState } from "react";

import { trackEvent } from "@/lib/client/analytics";

export type GameType =
  | "memory_card"
  | "block_puzzle"
  | "pipe_connect"
  | "word_hunt"
  | "math_master"
  | "jigsaw_drop";

type UseGameProgressOptions = {
  gameType: GameType;
  userId?: string;
};

/**
 * Mini oyunlar için ortak ilerleme katmanı:
 * - Kayıtlı rekoru yükler
 * - Skor + seviyeyi sunucuya kaydeder (/progress ve /finish)
 * - Yeni rekorda liderlik tablosunu açar
 */
export function useGameProgress({ gameType, userId = "guest" }: UseGameProgressOptions) {
  const [highScore, setHighScore] = useState(0);
  const [isLeaderboardOpen, setIsLeaderboardOpen] = useState(false);
  const isGuest = userId === "guest";
  const isSavingRef = useRef(false);
  const pendingSaveRef = useRef<{ score: number; level: number; stats: Record<string, unknown> } | null>(null);

  useEffect(() => {
    if (isGuest) return;
    fetch(`/api/games/progress?game_type=${gameType}`)
      .then((r) => {
        if (!r.ok) throw new Error(`progress HTTP ${r.status}`);
        return r.json();
      })
      .then((data) => {
        if (data.high_score) setHighScore(data.high_score);
      })
      .catch((err) => {
        console.warn("[game-progress] Rekor yüklenemedi:", err);
      });
  }, [gameType, isGuest]);

  const saveProgress = useCallback(
    async (
      score: number,
      level: number,
      stats: Record<string, unknown> = {},
    ): Promise<boolean> => {
      if (isGuest) return false;
      if (isSavingRef.current) {
        // A legit save raced an in-flight one — remember it instead of dropping.
        pendingSaveRef.current = { score, level, stats };
        return false;
      }
      isSavingRef.current = true;

      let isNewRecord = false;
      try {
        const res = await fetch("/api/games/progress", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ game_type: gameType, score, level }),
        });
        const data = await res.json();
        if (data.high_score != null) {
          isNewRecord = score > highScore && score === data.high_score;
          setHighScore(data.high_score);
          if (isNewRecord) {
            setTimeout(() => setIsLeaderboardOpen(true), 800);
          }
        } else if (!res.ok) {
          console.error("[game-progress] Kayıt reddedildi:", data);
        }
      } catch (err) {
        console.error("[game-progress] Skor kaydedilemedi:", err);
      }

      try {
        await fetch("/api/games/finish", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            game_type: gameType,
            user_id: userId,
            score,
            stats,
          }),
        });
        trackEvent("game_completed", { game_type: gameType, score, level });
      } catch (err) {
        console.error("[game-progress] finish çağrısı başarısız:", err);
      }

      isSavingRef.current = false;

      // Flush a save that arrived while this one was in flight.
      const pending = pendingSaveRef.current;
      if (pending) {
        pendingSaveRef.current = null;
        void saveProgress(pending.score, pending.level, pending.stats);
      }

      return isNewRecord;
    },
    [gameType, isGuest, userId, highScore],
  );

  return {
    highScore,
    setHighScore,
    isLeaderboardOpen,
    setIsLeaderboardOpen,
    saveProgress,
  };
}
