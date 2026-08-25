"use client";

import confetti from "canvas-confetti";
import { useCallback, useEffect, useRef, useState } from "react";

import { useAudio } from "@/hooks/use-audio";
import { useGameProgress } from "@/hooks/use-game-progress";
import {
  buildDeck,
  canDrop,
  colsForLevel,
  emptyBoard,
  type Fragment,
  isGameOver as checkGameOver,
  type PhotoDef,
  photosForLevel,
  resolveDrop,
  rowsForLevel,
} from "@/lib/domain/jigsaw-drop";

import { GameSoundToggle } from "./game-sound-toggle";
import { LeaderboardModal } from "./leaderboard-modal";

const QUEUE_SIZE = 3;

type Selected = { queueIndex: number } | null;

/** Renders a photo slice: clipped window into the full emoji scene. */
function PhotoSlice({
  photo,
  minSlice,
  maxSlice,
  hidden,
  cellPx,
}: {
  photo: PhotoDef;
  minSlice: number;
  maxSlice: number;
  hidden: boolean;
  cellPx: number;
}) {
  if (hidden) {
    return (
      <div
        className="flex w-full items-center justify-center rounded-lg bg-gradient-to-br from-amber-400 to-orange-500 border-2 border-amber-300 shadow-inner"
        style={{ height: cellPx }}
      >
        <span className="text-lg opacity-90">👑</span>
      </div>
    );
  }
  const total = photo.totalHeight * cellPx;
  const top = -(minSlice * cellPx);
  return (
    <div
      className="relative w-full overflow-hidden rounded-lg border-2 border-white/90 shadow"
      style={{ height: (maxSlice - minSlice + 1) * cellPx }}
    >
      <div
        className={`absolute inset-x-0 bg-gradient-to-b ${photo.gradient}`}
        style={{ height: total, top }}
      >
        <div className="flex h-full flex-col items-center justify-around py-1">
          {photo.emojis.map((emoji, i) => (
            <span key={i} className="text-xl leading-none drop-shadow-sm">
              {emoji}
            </span>
          ))}
        </div>
      </div>
    </div>
  );
}

export function JigsawDrop({ userId = "guest" }: { userId?: string }) {
  const [level, setLevel] = useState(1);
  const [board, setBoard] = useState(() => emptyBoard(colsForLevel(1), rowsForLevel(1)));
  const [photos, setPhotos] = useState<PhotoDef[]>(() => photosForLevel(1));
  const [deck, setDeck] = useState<Fragment[]>([]);
  const [queue, setQueue] = useState<Fragment[]>([]);
  const [selected, setSelected] = useState<Selected>(null);
  const [score, setScore] = useState(0);
  const [combo, setCombo] = useState(0);
  const [isGameOver, setIsGameOver] = useState(false);
  const [toast, setToast] = useState<string | null>(null);
  const [lastCompleted, setLastCompleted] = useState<PhotoDef | null>(null);

  const { playSound } = useAudio();
  const { highScore, isLeaderboardOpen, setIsLeaderboardOpen, saveProgress } =
    useGameProgress({ gameType: "jigsaw_drop", userId });

  const savedRef = useRef(false);
  const scoreRef = useRef(0);
  const levelRef = useRef(1);
  const toastTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  function showToast(message: string) {
    setToast(message);
    if (toastTimerRef.current) clearTimeout(toastTimerRef.current);
    toastTimerRef.current = setTimeout(() => setToast(null), 2000);
  }

  useEffect(
    () => () => {
      if (toastTimerRef.current) clearTimeout(toastTimerRef.current);
    },
    [],
  );

  const initGame = useCallback(() => {
    savedRef.current = false;
    scoreRef.current = 0;
    levelRef.current = 1;
    const levelPhotos = photosForLevel(1);
    setLevel(1);
    setPhotos(levelPhotos);
    setBoard(emptyBoard(colsForLevel(1), rowsForLevel(1)));
    const newDeck = buildDeck(levelPhotos);
    setDeck(newDeck);
    setQueue(newDeck.slice(0, QUEUE_SIZE));
    setDeck(newDeck.slice(QUEUE_SIZE));
    setSelected(null);
    setScore(0);
    scoreRef.current = 0;
    setCombo(0);
    setIsGameOver(false);
    setToast(null);
    setLastCompleted(null);
  }, []);

  useEffect(() => {
    initGame();
  }, [initGame]);

  /** Saves the run once; safe from 🛑, unmount, or natural game over. */
  const endGame = useCallback(() => {
    if (savedRef.current) return;
    savedRef.current = true;
    setIsGameOver(true);
    void saveProgress(scoreRef.current, levelRef.current, { level: levelRef.current });
  }, [saveProgress]);

  useEffect(() => {
    const onHidden = () => {
      if (document.hidden && !savedRef.current && scoreRef.current > 0) endGame();
    };
    document.addEventListener("visibilitychange", onHidden);
    return () => {
      document.removeEventListener("visibilitychange", onHidden);
      if (!savedRef.current && scoreRef.current > 0) endGame();
    };
  }, [endGame]);

  function drawFromDeck(count: number): { drawn: Fragment[]; rest: Fragment[] } {
    const drawn = [...deck.slice(0, count)];
    let rest = deck.slice(count);
    // Recycle the deck when exhausted — endless play, fresh shuffle.
    while (rest.length < count && rest.length + drawn.length < 200) {
      rest = [...rest, ...buildDeck(photos)];
    }
    return { drawn, rest };
  }

  function handleColumnTap(col: number) {
    if (!selected || isGameOver) return;
    const fragment = queue[selected.queueIndex];
    if (!fragment) return;
    const photo = photos.find((p) => p.id === fragment.photoId);
    if (!photo) return;

    const working = emptyBoard(board.cols, board.rows);
    working.columns = board.columns.map((c) => [...c]);

    if (!canDrop(board, col, fragment)) {
      playSound("error");
      showToast("Sığmıyor!");
      return;
    }

    const revealed = { ...fragment, hidden: false };
    const result = resolveDrop(working, col, revealed, photo, combo);

    playSound(result.completed ? "success" : result.merged ? "pop" : "pop");

    if (result.completed) {
      const newCombo = combo + 1;
      setCombo(newCombo);
      scoreRef.current += result.points;
      setScore(scoreRef.current);
      setLastCompleted(photo);
      confetti({
        particleCount: 60 + newCombo * 10,
        spread: 70,
        origin: { y: 0.6 },
        colors: ["#f59e0b", "#10b981", "#3b82f6"],
      });
      if (newCombo >= 2) showToast(`Combo × ${newCombo}! 🔥`);
    } else {
      if (result.merged) {
        scoreRef.current += result.points;
        setScore(scoreRef.current);
      }
      setCombo(0);
    }
    setBoard(result.board);

    // Next fragment from deck; refill queue when empty.
    const remainingQueue = queue.filter((_, i) => i !== selected.queueIndex);
    if (remainingQueue.length === 0) {
      const { drawn, rest } = drawFromDeck(QUEUE_SIZE);
      setQueue(drawn);
      setDeck(rest);
    } else {
      const { drawn, rest } = drawFromDeck(1);
      setQueue([...remainingQueue, ...drawn]);
      setDeck(rest);
    }
    setSelected(null);

    // Level up every 400 points — board grows, more photos join.
    if (scoreRef.current >= levelRef.current * 400) {
      const nextLevel = levelRef.current + 1;
      levelRef.current = nextLevel;
      setLevel(nextLevel);
      const levelPhotos = photosForLevel(nextLevel);
      setPhotos(levelPhotos);
      setBoard(emptyBoard(colsForLevel(nextLevel), rowsForLevel(nextLevel)));
      const freshDeck = buildDeck(levelPhotos);
      setQueue(freshDeck.slice(0, QUEUE_SIZE));
      setDeck(freshDeck.slice(QUEUE_SIZE));
      showToast(`Seviye ${nextLevel}! Tahta büyüdü 🎉`);
      return;
    }

    // Game over: the NEXT queued fragment must fit somewhere.
    const nextUp = queue.filter((_, i) => i !== selected.queueIndex)[0] ?? queue[0];
    if (nextUp && checkGameOver(result.board, { ...nextUp, hidden: false })) {
      endGame();
    }
  }

  const rows = board.rows;
  const cols = board.cols;
  const cellPx = Math.floor(292 / cols); // board inner width ≈ 292px on mobile
  const photoById = new Map(photos.map((p) => [p.id, p]));

  return (
    <div className="w-full max-w-sm mx-auto select-none">
      {/* Header */}
      <div className="bg-gradient-to-br from-sky-600 to-blue-700 rounded-3xl p-4 mb-3 border border-sky-400/20 shadow-2xl shadow-blue-500/20">
        <div className="flex items-center justify-between mb-3">
          <div>
            <h2 className="text-lg font-black text-white">🧩 Yapboz Düşüşü</h2>
            <p className="text-xs font-bold text-sky-200">
              Seviye {level} · {cols}×{rows}
              {combo > 0 ? ` · Combo × ${combo}` : ""}
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
              {!isGameOver ? (
                <button
                  onClick={endGame}
                  aria-label="Oyunu bitir"
                  className="tap-scale bg-rose-500/80 hover:bg-rose-500 border border-rose-400/50 rounded-xl px-2 py-1 text-xs font-bold text-white transition-colors"
                >
                  🛑
                </button>
              ) : null}
              <button
                onClick={() => setIsLeaderboardOpen(true)}
                aria-label="Liderlik tablosunu aç"
                className="tap-scale bg-white/10 hover:bg-white/20 border border-white/20 rounded-xl px-2 py-1 text-xs font-bold text-white transition-colors"
              >
                🏅
              </button>
            </div>
          </div>
        </div>
        <div className="flex gap-2">
          <div className="bg-white/10 rounded-xl p-2 text-center backdrop-blur-sm flex-1">
            <span className="text-[0.6rem] font-black text-sky-200 block uppercase">Puan</span>
            <span className="text-lg font-black text-white">{score}</span>
          </div>
          {lastCompleted ? (
            <div className="bg-white/10 rounded-xl p-2 flex items-center gap-1 backdrop-blur-sm">
              {lastCompleted.emojis.map((e, i) => (
                <span key={i} className="text-lg">{e}</span>
              ))}
              <span className="text-[0.6rem] font-black text-emerald-300 ml-1">✓</span>
            </div>
          ) : null}
        </div>
      </div>

      {/* Board � portrait column grid like the real game */}
      <div className="relative bg-gradient-to-b from-sky-500 to-blue-600 rounded-3xl p-3 border border-sky-300/30 shadow-2xl mb-3 overflow-hidden">
        {toast ? (
          <div className="absolute top-2 left-1/2 -translate-x-1/2 z-30 rounded-full bg-white/90 px-4 py-1.5 text-xs font-black text-sky-700 shadow-lg animate-in fade-in">
            {toast}
          </div>
        ) : null}
        {combo >= 2 && !isGameOver ? (
          <div className="absolute top-10 left-1/2 -translate-x-1/2 z-20 text-2xl font-black text-emerald-300 drop-shadow-lg animate-pulse pointer-events-none">
            Combo � {combo}
          </div>
        ) : null}

        <div
          className="grid gap-[6px]"
          style={{ gridTemplateColumns: `repeat(${cols}, minmax(0, 1fr))` }}
        >
          {Array.from({ length: cols }).map((_, col) => {
            const column = board.columns[col];
            const selectedFragment = selected ? queue[selected.queueIndex] : null;
            const canTake = selectedFragment ? canDrop(board, col, selectedFragment) : false;
            const used = column.reduce((s, p) => s + p.height, 0);

            return (
              <div key={col} className="flex flex-col gap-[6px]">
                {/* Placed pieces, bottom-up order */}
                {column.map((piece) => {
                  const photo = photoById.get(piece.photoId);
                  if (!photo) return null;
                  return (
                    <button
                      key={`${piece.photoId}-${piece.slices.join("_")}`}
                      type="button"
                      onClick={() => handleColumnTap(col)}
                      className="text-left"
                    >
                      <PhotoSlice
                        photo={photo}
                        minSlice={Math.min(...piece.slices)}
                        maxSlice={Math.max(...piece.slices)}
                        hidden={piece.hidden}
                        cellPx={cellPx}
                      />
                    </button>
                  );
                })}
                {/* Empty slots */}
                {Array.from({ length: rows - used }).map((_, i) => (
                  <button
                    key={`e-${col}-${i}`}
                    type="button"
                    onClick={() => handleColumnTap(col)}
                    aria-label={`s�tun ${col + 1}`}
                    style={{ height: cellPx }}
                    className={`w-full rounded-lg border-2 transition-all ${
                      canTake
                        ? "bg-white/20 border-white/50 hover:bg-white/30"
                        : "bg-blue-400/30 border-white/15"
                    }`}
                  />
                ))}
              </div>
            );
          })}
        </div>

        {isGameOver ? (
          <div className="absolute inset-0 z-20 bg-slate-950/95 backdrop-blur-sm flex flex-col items-center justify-center p-6 text-center animate-in zoom-in-95 duration-200">
            <div className="w-16 h-16 bg-gradient-to-br from-sky-500 to-blue-600 rounded-3xl flex items-center justify-center mb-3 shadow-2xl text-3xl">
              ??
            </div>
            <h3 className="text-xl font-black text-white">Tahta doldu!</h3>
            <p className="text-xs text-sky-300 font-bold mb-4">Seviye {level} � {score} puan</p>
            <div className="bg-white/5 rounded-2xl p-4 w-full mb-4 border border-white/10">
              <p className="text-[0.65rem] text-slate-400 font-bold uppercase mb-1">Final Skor</p>
              <p className="text-3xl font-black text-white">{score}</p>
              {highScore > 0 && score > highScore && (
                <p className="text-xs font-black text-yellow-400 mt-1 animate-pulse">?? Yeni Rekor!</p>
              )}
            </div>
            <button
              type="button"
              onClick={initGame}
              className="tap-scale w-full bg-gradient-to-r from-sky-500 to-blue-600 text-white font-black py-3 rounded-xl shadow-lg hover:brightness-110 transition text-sm"
            >
              Tekrar Oyna ??
            </button>
          </div>
        ) : null}
      </div>

      {/* Queue */}
      <div className="grid grid-cols-3 gap-2">
        {queue.map((fragment, qi) => {
          const photo = photoById.get(fragment.photoId);
          const sliceHeight = fragment.height;
          return (
            <button
              key={fragment.uid}
              type="button"
              onClick={() => setSelected(selected?.queueIndex === qi ? null : { queueIndex: qi })}
              disabled={isGameOver}
              className={`rounded-2xl p-2 border transition-all ${
                selected?.queueIndex === qi
                  ? "border-sky-400 bg-sky-50 ring-2 ring-sky-200"
                  : "border-slate-200 bg-white hover:border-slate-300"
              }`}
            >
              <div className="mx-auto w-fit">
                {photo ? (
                  <PhotoSlice
                    photo={photo}
                    minSlice={fragment.slice}
                    maxSlice={fragment.slice + sliceHeight - 1}
                    hidden={fragment.hidden}
                    cellPx={26}
                  />
                ) : null}
              </div>
            </button>
          );
        })}
      </div>
      <p className="mt-3 text-center text-[0.62rem] font-bold uppercase tracking-widest text-slate-400">
        Parçayı seç → sütuna bırak · aynı resmin dilimleri birleşir · resmi tamamla
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
