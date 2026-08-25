"use client";

import confetti from "canvas-confetti";
import { useCallback, useEffect, useRef, useState } from "react";

import { useAudio } from "@/hooks/use-audio";
import { useGameProgress } from "@/hooks/use-game-progress";
import {
  type Board,
  boardSizeForLevel,
  canPlace,
  emptyBoard,
  type Fragment,
  generateFragment,
  isGameOver as checkGameOver,
  paletteSizeForLevel,
  placeFragment,
  resolveClears,
} from "@/lib/domain/jigsaw-drop";

import { GameSoundToggle } from "./game-sound-toggle";
import { LeaderboardModal } from "./leaderboard-modal";

const QUEUE_SIZE = 3;
const COLORS = [
  "bg-rose-500",
  "bg-sky-500",
  "bg-emerald-500",
  "bg-amber-400",
  "bg-violet-500",
  "bg-cyan-500",
  "bg-pink-500",
];

type Selected = { queueIndex: number } | null;

export function JigsawDrop({ userId = "guest" }: { userId?: string }) {
  const [level, setLevel] = useState(1);
  const [board, setBoard] = useState<Board>(() => emptyBoard(8));
  const [queue, setQueue] = useState<Fragment[]>([]);
  const [selected, setSelected] = useState<Selected>(null);
  const [score, setScore] = useState(0);
  const [combo, setCombo] = useState(0);
  const [isGameOver, setIsGameOver] = useState(false);
  const [toast, setToast] = useState<string | null>(null);

  const { playSound } = useAudio();
  const { highScore, isLeaderboardOpen, setIsLeaderboardOpen, saveProgress } =
    useGameProgress({ gameType: "jigsaw_drop", userId });
  const savedRef = useRef(false);

  const refillQueue = useCallback(
    (colors: number) => {
      setQueue(Array.from({ length: QUEUE_SIZE }, () => generateFragment(colors)));
    },
    [],
  );

  const initGame = useCallback(() => {
    savedRef.current = false;
    setLevel(1);
    setBoard(emptyBoard(boardSizeForLevel(1)));
    setQueue(Array.from({ length: QUEUE_SIZE }, () => generateFragment(paletteSizeForLevel(1))));
    setSelected(null);
    setScore(0);
    setCombo(0);
    setIsGameOver(false);
    setToast(null);
  }, []);

  useEffect(() => {
    initGame();
  }, [initGame]);

  // Level up → board grows (8→9→10→11) and palette widens.
  const levelUp = useCallback(() => {
    setLevel((prev) => {
      const nextLevel = prev + 1;
      const size = boardSizeForLevel(nextLevel);
      setBoard(emptyBoard(size));
      refillQueue(paletteSizeForLevel(nextLevel));
      setSelected(null);
      setToast(`Seviye ${nextLevel}! Tahta ${size}×${size} oldu 🎉`);
      setTimeout(() => setToast(null), 2200);
      return nextLevel;
    });
  }, [refillQueue]);

  function handleCellTap(row: number, col: number) {
    if (!selected || isGameOver) return;
    const fragment = queue[selected.queueIndex];
    if (!fragment) return;

    if (!canPlace(board, fragment, row, col)) {
      playSound("error");
      setToast("Buraya sığmıyor!");
      setTimeout(() => setToast(null), 900);
      return;
    }

    playSound("pop");
    const placed = placeFragment(board, fragment, row, col);
    const result = resolveClears(placed, combo);

    const hadClear =
      result.clearedRows.length + result.clearedCols.length + result.clearedSquares > 0;
    const newCombo = hadClear ? Math.min(combo + 1, 5) : 0;
    const gained = result.gainedPoints + (hadClear ? 10 : 0);
    setCombo(newCombo);
    if (hadClear) {
      playSound("success");
      setScore((prev) => prev + gained);
      confetti({
        particleCount: 45 + newCombo * 15,
        spread: 65,
        origin: { y: 0.7 },
        colors: ["#f43f5e", "#3b82f6", "#10b981"],
      });
    }
    setBoard(result.board);

    const remaining = queue.filter((_, i) => i !== selected.queueIndex);
    const nextQueue =
      remaining.length === 0
        ? Array.from({ length: QUEUE_SIZE }, () =>
            generateFragment(paletteSizeForLevel(level)),
          )
        : remaining;
    setQueue(nextQueue);
    setSelected(null);

    // Level up every 150 points
    if (score + gained >= level * 150) {
      levelUp();
      return;
    }

    if (checkGameOver(result.board, nextQueue)) {
      setIsGameOver(true);
    }
  }

  useEffect(() => {
    if (isGameOver && !savedRef.current) {
      savedRef.current = true;
      void saveProgress(score, level, { level });
    }
  }, [isGameOver, score, level, saveProgress]);

  const size = board.size;

  return (
    <div className="w-full max-w-sm mx-auto select-none">
      {/* Header */}
      <div className="bg-gradient-to-br from-teal-600 to-emerald-700 rounded-3xl p-4 mb-3 border border-emerald-400/20 shadow-2xl shadow-emerald-500/20">
        <div className="flex items-center justify-between mb-3">
          <div>
            <h2 className="text-lg font-black text-white">🧩 Yapboz Düşüşü</h2>
            <p className="text-xs font-bold text-emerald-200">
              Seviye {level} · Tahta {size}×{size}
              {combo > 0 ? ` · 🔥 ${combo}x Kombo` : ""}
            </p>
          </div>
          <div className="flex flex-col items-end gap-1">
            {highScore > 0 && (
              <div className="bg-yellow-400/20 border border-yellow-300/30 rounded-xl px-2 py-1">
                <span className="text-[0.5rem] font-black text-yellow-200 block uppercase">Rekor</span>
                <span className="text-xs font-black text-yellow-300">🏆 {highScore}</span>
              </div>
            )}
            <div className="flex gap-1">
              <GameSoundToggle />
              <button
                onClick={() => setIsLeaderboardOpen(true)}
                aria-label="Liderlik tablosunu aç"
                className="tap-scale bg-white/10 hover:bg-white/20 border border-white/20 rounded-xl px-2 py-1 text-xs font-bold text-white transition-colors"
              >
                🏅 Tablo
              </button>
            </div>
          </div>
        </div>
        <div className="bg-white/10 rounded-xl p-2 text-center backdrop-blur-sm">
          <span className="text-[0.6rem] font-black text-emerald-200 block uppercase">Puan</span>
          <span className="text-lg font-black text-white">{score}</span>
        </div>
      </div>

      {/* Board */}
      <div className="relative bg-slate-900 rounded-3xl p-4 border border-slate-800 shadow-2xl mb-3 overflow-hidden">
        {toast ? (
          <div className="absolute top-2 left-1/2 -translate-x-1/2 z-30 rounded-full bg-indigo-600 px-4 py-1.5 text-xs font-black text-white shadow-lg animate-in fade-in">
            {toast}
          </div>
        ) : null}

        <div
          className="grid gap-[3px] mx-auto"
          style={{ gridTemplateColumns: `repeat(${size}, minmax(0, 1fr))` }}
        >
          {board.cells.map((cell, i) => {
            const row = Math.floor(i / size);
            const col = i % size;
            const placeable =
              selected !== null &&
              canPlace(board, queue[selected.queueIndex], row, col);
            return (
              <button
                key={i}
                type="button"
                onClick={() => handleCellTap(row, col)}
                aria-label={`hücre ${row + 1}-${col + 1}`}
                className={`aspect-square rounded-md transition-all ${
                  cell
                    ? `${COLORS[cell.color % COLORS.length]} shadow-inner`
                    : placeable
                      ? "bg-slate-700 ring-2 ring-emerald-400 scale-105"
                      : "bg-slate-800"
                }`}
              />
            );
          })}
        </div>

        {isGameOver ? (
          <div className="absolute inset-0 z-20 bg-slate-950/95 backdrop-blur-sm flex flex-col items-center justify-center p-6 text-center animate-in zoom-in-95 duration-200">
            <div className="w-16 h-16 bg-gradient-to-br from-teal-500 to-emerald-600 rounded-3xl flex items-center justify-center mb-3 shadow-2xl text-3xl">
              🧩
            </div>
            <h3 className="text-xl font-black text-white">Tahta doldu!</h3>
            <p className="text-xs text-emerald-300 font-bold mb-4">
              Seviye {level} · {size}×{size} tahtada {score} puan
            </p>
            <div className="bg-white/5 rounded-2xl p-4 w-full mb-4 border border-white/10">
              <p className="text-[0.65rem] text-slate-400 font-bold uppercase mb-1">Final Skor</p>
              <p className="text-3xl font-black text-white">{score}</p>
              {highScore > 0 && score > highScore && (
                <p className="text-xs font-black text-yellow-400 mt-1 animate-pulse">🏆 Yeni Rekor!</p>
              )}
            </div>
            <button
              type="button"
              onClick={initGame}
              className="tap-scale w-full bg-gradient-to-r from-teal-500 to-emerald-600 text-white font-black py-3 rounded-xl shadow-lg hover:brightness-110 transition text-sm"
            >
              Tekrar Oyna 🔄
            </button>
          </div>
        ) : null}
      </div>

      {/* Queue */}
      <div className="grid grid-cols-3 gap-2">
        {queue.map((fragment, qi) => {
          const extentR = Math.max(...fragment.cells.map((p) => p.r)) + 1;
          const extentC = Math.max(...fragment.cells.map((p) => p.c)) + 1;
          return (
            <button
              key={fragment.id}
              type="button"
              onClick={() => setSelected(selected?.queueIndex === qi ? null : { queueIndex: qi })}
              disabled={isGameOver}
              className={`rounded-2xl p-2 border transition-all ${
                selected?.queueIndex === qi
                  ? "border-emerald-400 bg-emerald-50 ring-2 ring-emerald-200"
                  : "border-slate-200 bg-white hover:border-slate-300"
              }`}
            >
              <div
                className="grid gap-[2px] mx-auto w-fit"
                style={{ gridTemplateColumns: `repeat(${extentC}, minmax(0, 1fr))` }}
              >
                {Array.from({ length: extentR * extentC }).map((_, i) => {
                  const r = Math.floor(i / extentC);
                  const c = i % extentC;
                  const part = fragment.cells.find((p) => p.r === r && p.c === c);
                  return (
                    <span
                      key={i}
                      className={`w-4 h-4 rounded-sm ${
                        part ? COLORS[part.color % COLORS.length] : "bg-transparent"
                      }`}
                    />
                  );
                })}
              </div>
            </button>
          );
        })}
      </div>
      <p className="mt-3 text-center text-[0.62rem] font-bold uppercase tracking-widest text-slate-400">
        Parçayı seç → tahtaya yerleştir · satır/sütun temizle · 2×2 aynı renk patlat
      </p>

      <LeaderboardModal
        isOpen={isLeaderboardOpen}
        onClose={() => setIsLeaderboardOpen(false)}
        gameType="jigsaw_drop"
        gameTitle="Yapboz Düşüşü"
        currentUserId={userId !== "guest" ? userId : undefined}
        currentScore={score > 0 ? score : highScore}
      />
    </div>
  );
}

