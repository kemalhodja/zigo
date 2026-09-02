"use client";

import confetti from "canvas-confetti";
import { useCallback, useEffect, useRef, useState } from "react";

import { useAudio } from "@/hooks/use-audio";
import { useGameProgress } from "@/hooks/use-game-progress";

import {
  type Board,
  type Direction,
  getMaxTile,
  hasMovesRemaining,
  initBoard,
  moveBoard,
  spawnTile,
} from "./game-2048-logic";
import { GameSoundToggle } from "./game-sound-toggle";
import { LeaderboardModal } from "./leaderboard-modal";

type Game2048Props = {
  userId?: string;
  onGameEnd?: (score: number, stats: { maxTile: number }) => void;
};

// Tile Color & Styling Map
const TILE_STYLES: Record<number, { bg: string; text: string; shadow: string }> = {
  2: { bg: "bg-slate-700", text: "text-white", shadow: "shadow-sm" },
  4: { bg: "bg-slate-600", text: "text-white", shadow: "shadow-sm" },
  8: { bg: "bg-amber-600", text: "text-white", shadow: "shadow-amber-600/30" },
  16: { bg: "bg-orange-600", text: "text-white", shadow: "shadow-orange-600/40" },
  32: { bg: "bg-rose-600", text: "text-white", shadow: "shadow-rose-600/40" },
  64: { bg: "bg-red-600", text: "text-white", shadow: "shadow-red-600/50" },
  128: { bg: "bg-yellow-500", text: "text-slate-950 font-black", shadow: "shadow-yellow-500/50 ring-2 ring-yellow-300" },
  256: { bg: "bg-emerald-500", text: "text-white", shadow: "shadow-emerald-500/50 ring-2 ring-emerald-300" },
  512: { bg: "bg-teal-500", text: "text-white", shadow: "shadow-teal-500/50 ring-2 ring-teal-300" },
  1024: { bg: "bg-cyan-500", text: "text-white", shadow: "shadow-cyan-500/50 ring-2 ring-cyan-300" },
  2048: { bg: "bg-gradient-to-tr from-amber-400 via-pink-500 to-purple-600", text: "text-white font-black", shadow: "shadow-purple-500/60 ring-4 ring-amber-300 animate-pulse" },
};

export function Game2048({ userId = "guest", onGameEnd }: Game2048Props) {
  const [board, setBoard] = useState<Board>(initBoard);
  const [score, setScore] = useState(0);
  const [isGameOver, setIsGameOver] = useState(false);
  const [hasWon2048, setHasWon2048] = useState(false);
  const [continueAfterWin, setContinueAfterWin] = useState(false);
  const [lastGained, setLastGained] = useState(0);
  const [history, setHistory] = useState<{ board: Board; score: number }[]>([]);

  const { playSound } = useAudio();
  const touchStartRef = useRef<{ x: number; y: number } | null>(null);

  const triggerHaptic = useCallback((type: "light" | "medium" | "heavy" | "error" = "light") => {
    if (typeof window !== "undefined" && "vibrate" in navigator) {
      try {
        if (type === "error") navigator.vibrate([40, 60, 40]);
        else if (type === "heavy") navigator.vibrate(30);
        else navigator.vibrate(15);
      } catch {}
    }
  }, []);

  const {
    highScore,
    isLeaderboardOpen,
    setIsLeaderboardOpen,
    saveProgress,
  } = useGameProgress({ gameType: "game_2048", userId });

  const STORAGE_KEY = `zigo_2048_state_${userId}`;

  // Restore state on mount
  useEffect(() => {
    if (typeof window === "undefined") return;
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const data = JSON.parse(saved);
        if (data && data.board && Array.isArray(data.board) && !data.isGameOver) {
          setBoard(data.board);
          setScore(data.score || 0);
          setHasWon2048(data.hasWon2048 || false);
          setContinueAfterWin(data.continueAfterWin || false);
        }
      }
    } catch {}
  }, [STORAGE_KEY]);

  // Save state on change
  useEffect(() => {
    if (typeof window === "undefined" || isGameOver) return;
    try {
      localStorage.setItem(
        STORAGE_KEY,
        JSON.stringify({
          board,
          score,
          hasWon2048,
          continueAfterWin,
        })
      );
    } catch {}
  }, [STORAGE_KEY, board, score, hasWon2048, continueAfterWin, isGameOver]);

  const maxTile = getMaxTile(board);

  const handleMove = useCallback(
    (dir: Direction) => {
      if (isGameOver) return;
      if (hasWon2048 && !continueAfterWin) return;

      const result = moveBoard(board, dir);
      if (!result.moved) return;

      // Push to history for undo
      setHistory((prev) => [...prev.slice(-9), { board: board.map((r) => [...r]), score }]);

      playSound("pop");
      if (result.scoreGained > 0) {
        triggerHaptic("medium");
      } else {
        triggerHaptic("light");
      }

      const nextBoard = spawnTile(result.board);
      const newScore = score + result.scoreGained;

      setBoard(nextBoard);
      setScore(newScore);
      if (result.scoreGained > 0) {
        setLastGained(result.scoreGained);
        setTimeout(() => setLastGained(0), 600);
      }

      // Check 2048 win condition
      const currentMax = getMaxTile(nextBoard);
      if (currentMax >= 2048 && !hasWon2048 && !continueAfterWin) {
        setHasWon2048(true);
        playSound("success");
        triggerHaptic("heavy");
        confetti({
          particleCount: 150,
          spread: 80,
          origin: { y: 0.5 },
          colors: ["#f59e0b", "#ec4899", "#8b5cf6"],
        });
        void saveProgress(newScore, currentMax, { maxTile: currentMax });
        if (onGameEnd) onGameEnd(newScore, { maxTile: currentMax });
        return;
      }

      // Check game over
      if (!hasMovesRemaining(nextBoard)) {
        setIsGameOver(true);
        playSound("error");
        triggerHaptic("error");
        void saveProgress(newScore, currentMax, { maxTile: currentMax });
        if (onGameEnd) onGameEnd(newScore, { maxTile: currentMax });
      }
    },
    [board, score, isGameOver, hasWon2048, continueAfterWin, playSound, triggerHaptic, saveProgress, onGameEnd]
  );

  const handleUndo = useCallback(() => {
    if (history.length === 0 || isGameOver) return;
    const previous = history[history.length - 1];
    setHistory((prev) => prev.slice(0, -1));
    setBoard(previous.board);
    setScore(previous.score);
    playSound("pop");
    triggerHaptic("light");
  }, [history, isGameOver, playSound, triggerHaptic]);

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (isLeaderboardOpen) return;

      if ((e.ctrlKey || e.metaKey) && (e.key === "z" || e.key === "Z")) {
        e.preventDefault();
        handleUndo();
        return;
      }

      let dir: Direction | null = null;
      if (e.key === "ArrowUp" || e.key === "w" || e.key === "W") dir = "UP";
      else if (e.key === "ArrowDown" || e.key === "s" || e.key === "S") dir = "DOWN";
      else if (e.key === "ArrowLeft" || e.key === "a" || e.key === "A") dir = "LEFT";
      else if (e.key === "ArrowRight" || e.key === "d" || e.key === "D") dir = "RIGHT";
      else if (e.key === "u" || e.key === "U") {
        handleUndo();
        return;
      }

      if (dir) {
        e.preventDefault();
        handleMove(dir);
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [handleMove, handleUndo, isLeaderboardOpen]);

  // Touch Swipe handlers
  const handleTouchStart = (e: React.TouchEvent) => {
    if (e.touches.length !== 1) return;
    touchStartRef.current = { x: e.touches[0].clientX, y: e.touches[0].clientY };
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    if (!touchStartRef.current || e.changedTouches.length !== 1) return;
    const start = touchStartRef.current;
    const end = { x: e.changedTouches[0].clientX, y: e.changedTouches[0].clientY };
    touchStartRef.current = null;

    const dx = end.x - start.x;
    const dy = end.y - start.y;
    const absX = Math.abs(dx);
    const absY = Math.abs(dy);

    if (Math.max(absX, absY) < 30) return; // ignore micro-taps

    if (absX > absY) {
      handleMove(dx > 0 ? "RIGHT" : "LEFT");
    } else {
      handleMove(dy > 0 ? "DOWN" : "UP");
    }
  };

  const resetGame = () => {
    setBoard(initBoard());
    setScore(0);
    setIsGameOver(false);
    setHasWon2048(false);
    setContinueAfterWin(false);
    setLastGained(0);
    setHistory([]);
    if (typeof window !== "undefined") {
      try {
        localStorage.removeItem(STORAGE_KEY);
      } catch {}
    }
  };

  return (
    <div
      className="w-full max-w-sm mx-auto select-none relative"
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
    >
      {/* Header Banner */}
      <div className="bg-gradient-to-br from-amber-500 via-orange-500 to-rose-600 rounded-3xl p-4 mb-3 border border-amber-400/20 shadow-2xl shadow-orange-500/20">
        <div className="flex items-center justify-between mb-3">
          <div>
            <h2 className="text-xl font-black text-white flex items-center gap-2">
              <span>🔢</span> 2048
            </h2>
            <p className="text-xs font-bold text-amber-100">
              Sayıları kaydır, 2048&apos;e ulaş!
            </p>
          </div>
          <div className="flex flex-col items-end gap-1">
            {highScore > 0 && (
              <div className="bg-white/20 border border-white/30 rounded-xl px-2 py-1 text-center backdrop-blur-sm">
                <span className="text-[0.5rem] font-black text-white/80 block uppercase">Rekor</span>
                <span className="text-xs font-black text-white">🏆 {highScore}</span>
              </div>
            )}
            <div className="flex gap-1">
              <button
                onClick={handleUndo}
                disabled={history.length === 0}
                aria-label="Geri Al"
                className="tap-scale bg-white/20 hover:bg-white/30 disabled:opacity-40 disabled:cursor-not-allowed border border-white/30 rounded-xl px-2 py-1 text-xs font-bold text-white transition flex items-center gap-1"
              >
                ↩️ Geri
              </button>
              <button
                onClick={resetGame}
                aria-label="Yeniden Başlat"
                className="tap-scale bg-white/20 hover:bg-white/30 border border-white/30 rounded-xl px-2 py-1 text-xs font-bold text-white transition flex items-center gap-1"
              >
                🔄 Yenile
              </button>
              <GameSoundToggle />
              <button
                onClick={() => setIsLeaderboardOpen(true)}
                aria-label="Liderlik tablosunu aç"
                className="tap-scale bg-white/20 hover:bg-white/30 border border-white/30 rounded-xl px-2 py-1 text-xs font-bold text-white transition flex items-center gap-1"
              >
                🏅 Tablo
              </button>
            </div>
          </div>
        </div>

        {/* Score & Max Tile Info */}
        <div className="grid grid-cols-2 gap-2 text-center">
          <div className="bg-black/20 rounded-xl p-2 backdrop-blur-sm relative">
            <span className="text-[0.6rem] font-black text-amber-200 block uppercase">Puan</span>
            <span className="text-xl font-black text-white">{score}</span>
            {lastGained > 0 && (
              <span className="absolute top-1 right-2 text-xs font-black text-emerald-300 animate-bounce">
                +{lastGained}
              </span>
            )}
          </div>
          <div className="bg-black/20 rounded-xl p-2 backdrop-blur-sm">
            <span className="text-[0.6rem] font-black text-amber-200 block uppercase">En Yüksek Sayı</span>
            <span className="text-xl font-black text-white">{maxTile}</span>
          </div>
        </div>
      </div>

      {/* 4x4 Game Board */}
      <div className="bg-slate-900 rounded-3xl p-3.5 border border-slate-800 shadow-2xl mb-3 aspect-square grid grid-cols-4 grid-rows-4 gap-2.5 relative">
        {board.map((row, r) =>
          row.map((val, c) => {
            const style = val > 0 ? (TILE_STYLES[val] || { bg: "bg-purple-700", text: "text-white", shadow: "shadow-md" }) : null;
            let fontSize = "text-2xl sm:text-3xl";
            if (val >= 128) fontSize = "text-xl sm:text-2xl";
            if (val >= 1024) fontSize = "text-base sm:text-lg";

            return (
              <div
                key={`${r}-${c}`}
                className={`w-full h-full rounded-2xl flex items-center justify-center font-black transition-all duration-100 ${
                  val === 0
                    ? "bg-slate-800/80 border border-slate-700/50"
                    : `${style?.bg} ${style?.text} ${style?.shadow} shadow-lg scale-100 animate-in zoom-in-75 duration-100`
                } ${fontSize}`}
              >
                {val > 0 ? val : ""}
              </div>
            );
          })
        )}
      </div>

      {/* Swipe / Direction Control Pad for Mobile */}
      <div className="bg-slate-900 rounded-3xl p-3 border border-slate-800 shadow-xl mb-3 flex flex-col items-center">
        <span className="text-[0.6rem] font-bold text-slate-400 mb-2">
          Kaydırarak veya Yön Tuşlarıyla Oyna
        </span>
        <div className="grid grid-cols-3 gap-1.5 w-40">
          <div />
          <button
            onClick={() => handleMove("UP")}
            aria-label="Yukarı"
            className="tap-scale bg-slate-800 hover:bg-slate-700 active:bg-slate-600 text-white font-black py-2.5 rounded-xl border border-slate-700 text-base"
          >
            ⬆️
          </button>
          <div />
          <button
            onClick={() => handleMove("LEFT")}
            aria-label="Sol"
            className="tap-scale bg-slate-800 hover:bg-slate-700 active:bg-slate-600 text-white font-black py-2.5 rounded-xl border border-slate-700 text-base"
          >
            ⬅️
          </button>
          <button
            onClick={() => handleMove("DOWN")}
            aria-label="Aşağı"
            className="tap-scale bg-slate-800 hover:bg-slate-700 active:bg-slate-600 text-white font-black py-2.5 rounded-xl border border-slate-700 text-base"
          >
            ⬇️
          </button>
          <button
            onClick={() => handleMove("RIGHT")}
            aria-label="Sağ"
            className="tap-scale bg-slate-800 hover:bg-slate-700 active:bg-slate-600 text-white font-black py-2.5 rounded-xl border border-slate-700 text-base"
          >
            ➡️
          </button>
        </div>
      </div>

      {/* 2048 Win Modal */}
      {hasWon2048 && !continueAfterWin && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-950/90 backdrop-blur-sm p-4 animate-in fade-in duration-200">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 w-full max-w-sm text-center shadow-2xl">
            <div className="w-16 h-16 rounded-3xl bg-amber-500 shadow-xl shadow-amber-500/40 flex items-center justify-center mx-auto mb-4 text-3xl">
              👑
            </div>
            <h3 className="text-2xl font-black text-white mb-1">Tebrikler!</h3>
            <p className="text-sm text-amber-400 font-bold mb-4">
              2048 Taşına Ulaştın! 🏆
            </p>
            <div className="bg-white/5 border border-white/10 rounded-xl p-3 mb-4 text-xs font-bold text-slate-300">
              Skor: <span className="text-white text-base font-black ml-1">{score}</span>
            </div>
            <div className="flex flex-col gap-2">
              <button
                onClick={() => setContinueAfterWin(true)}
                className="tap-scale w-full bg-gradient-to-r from-amber-500 to-orange-600 hover:brightness-110 text-white font-black py-3 rounded-xl shadow-lg transition text-xs"
              >
                Oynamaya Devam Et (Daha Yüksek Skor) 🚀
              </button>
              <button
                onClick={resetGame}
                className="tap-scale w-full bg-slate-800 hover:bg-slate-700 text-slate-200 font-black py-3 rounded-xl transition text-xs"
              >
                Yeni Oyun Başlat 🔄
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Game Over Modal */}
      {isGameOver && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-950/90 backdrop-blur-sm p-4 animate-in fade-in duration-200">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 w-full max-w-sm text-center shadow-2xl">
            <div className="w-16 h-16 rounded-3xl bg-rose-500 shadow-xl shadow-rose-500/40 flex items-center justify-center mx-auto mb-4 text-3xl">
              💔
            </div>
            <h3 className="text-2xl font-black text-white mb-1">Oyun Bitti</h3>
            <p className="text-xs text-slate-400 font-bold mb-4">
              Hamle kalmadı!
            </p>
            <div className="grid grid-cols-2 gap-2 bg-white/5 border border-white/10 rounded-xl p-3 mb-4">
              <div>
                <span className="text-[0.6rem] text-slate-400 font-black block uppercase">Toplam Skor</span>
                <span className="text-lg font-black text-white">{score}</span>
              </div>
              <div>
                <span className="text-[0.6rem] text-slate-400 font-black block uppercase">En Büyük Taş</span>
                <span className="text-lg font-black text-amber-400">{maxTile}</span>
              </div>
            </div>
            <button
              onClick={resetGame}
              className="tap-scale w-full bg-gradient-to-r from-amber-500 to-orange-600 hover:brightness-110 text-white font-black py-3 rounded-xl shadow-lg transition text-xs"
            >
              Tekrar Dene 🔄
            </button>
          </div>
        </div>
      )}

      {/* Leaderboard Modal */}
      <LeaderboardModal
        isOpen={isLeaderboardOpen}
        onClose={() => setIsLeaderboardOpen(false)}
        gameType="game_2048"
        gameTitle="2048 Liderlik Tablosu"
        currentUserId={userId !== "guest" ? userId : undefined}
        currentScore={score > 0 ? score : highScore}
      />
    </div>
  );
}
