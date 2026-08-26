"use client";

import confetti from "canvas-confetti";
import { useCallback, useEffect, useRef, useState } from "react";

import { useAudio } from "@/hooks/use-audio";
import { useGameProgress } from "@/hooks/use-game-progress";
import {
  type Board,
  buildDeck,
  canDrop,
  colsForLevel,
  emptyBoard,
  type Fragment,
  isBoardJammed,
  type PhotoDef,
  photosForLevel,
  picturesGoalForLevel,
  placePlain,
  removeTopPiece,
  resolveDrop,
  rowsForLevel,
} from "@/lib/domain/jigsaw-drop";

import { GameSoundToggle } from "./game-sound-toggle";
import { LeaderboardModal } from "./leaderboard-modal";

const QUEUE_SIZE = 3;

/** Seviyeye başlanırken verilen Sihirli Değnek hakları (gerçek oyundaki booster). */
function wandChargesForLevel(level: number): number {
  return 1 + Math.floor(Math.max(0, level - 1) / 3);
}

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
  const gap = 6;
  if (hidden) {
    const h = (maxSlice - minSlice + 1) * cellPx + (maxSlice - minSlice) * gap;
    return (
      <div
        className="flex w-full items-center justify-center rounded-lg bg-gradient-to-br from-amber-400 to-orange-500 border-2 border-amber-300 shadow-inner"
        style={{ height: h }}
      >
        <span className="text-lg opacity-90">👑</span>
      </div>
    );
  }

  const h = (maxSlice - minSlice + 1) * cellPx + (maxSlice - minSlice) * gap;
  const totalHeight = photo.totalHeight * cellPx + (photo.totalHeight - 1) * gap;
  const top = -(minSlice * cellPx + minSlice * gap);

  return (
    <div
      className="relative w-full overflow-hidden rounded-lg border-2 border-white/90 shadow"
      style={{ height: h }}
    >
      <div
        className={`absolute inset-x-0 bg-gradient-to-b ${photo.gradient}`}
        style={{ height: totalHeight, top }}
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
  const [goal, setGoal] = useState(() => picturesGoalForLevel(1));
  const [wandCharges, setWandCharges] = useState(() => wandChargesForLevel(1));
  const [wandMode, setWandMode] = useState(false);
  const [selectedCol, setSelectedCol] = useState(0);
  const [board, setBoard] = useState<Board>(() => emptyBoard(colsForLevel(1), rowsForLevel(1)));
  const [photos, setPhotos] = useState<PhotoDef[]>(() => photosForLevel(1));
  const [deck, setDeck] = useState<Fragment[]>([]);
  const [queue, setQueue] = useState<Fragment[]>([]);
  const [score, setScore] = useState(0);
  const [combo, setCombo] = useState(0);
  const [completedCount, setCompletedCount] = useState(0);
  const [gallery, setGallery] = useState<PhotoDef[]>([]);
  const [isLevelComplete, setIsLevelComplete] = useState(false);
  const [isGameOver, setIsGameOver] = useState(false);
  const [toast, setToast] = useState<string | null>(null);

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
    toastTimerRef.current = setTimeout(() => setToast(null), 2200);
  }

  useEffect(() => () => {
    if (toastTimerRef.current) clearTimeout(toastTimerRef.current);
  }, []);

  function makeRound(lvl: number): {
    roundPhotos: PhotoDef[];
    newBoard: Board;
    fullDeck: Fragment[];
  } {
    const roundPhotos = photosForLevel(lvl);
    const newBoard = emptyBoard(colsForLevel(lvl), rowsForLevel(lvl));
    let fullDeck = buildDeck(roundPhotos);
    while (fullDeck.length < QUEUE_SIZE * 3) fullDeck = [...fullDeck, ...buildDeck(roundPhotos)];
    return { roundPhotos, newBoard, fullDeck };
  }

  const initGame = useCallback(() => {
    savedRef.current = false;
    scoreRef.current = 0;
    levelRef.current = 1;
    const { roundPhotos, newBoard, fullDeck } = makeRound(1);
    setLevel(1);
    setGoal(picturesGoalForLevel(1));
    setWandCharges(wandChargesForLevel(1));
    setWandMode(false);
    setSelectedCol(Math.floor(newBoard.cols / 2));
    setPhotos(roundPhotos);
    setBoard(newBoard);
    setDeck(fullDeck.slice(QUEUE_SIZE));
    setQueue(fullDeck.slice(0, QUEUE_SIZE));
    setScore(0);
    setCombo(0);
    setCompletedCount(0);
    setGallery([]);
    setIsLevelComplete(false);
    setIsGameOver(false);
    setToast(null);
  }, []);

  useEffect(() => {
    initGame();
  }, [initGame]);

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
      if (!savedRef.current && scoreRef.current > 0 && !isGameOver) endGame();
    };
  }, [endGame, isGameOver]);

  /** Tıkanma denetimi: sıradaki hiçbir parça hiçbir yere sığmıyorsa uyar / bitir. */
  const checkJam = useCallback(
    (nextBoard: Board, nextQueue: Fragment[], chargesLeft: number) => {
      if (!isBoardJammed(nextBoard, nextQueue)) return;
      if (chargesLeft > 0) {
        showToast("Tahta doldu! 🪄 Sihirli Değnek zamanı");
      } else {
        endGame();
      }
    },
    [endGame],
  );

  /** Sütuna dokunma: sıradaki parça düşer — gerçek oyundaki tek etkileşim. */
  const dropAt = useCallback(
    (col: number) => {
      if (isGameOver || isLevelComplete) return;
      if (col < 0 || col >= board.cols) return;
      setSelectedCol(col);

      // 🪄 Değnek modu: sütunun en üst parçasını buğula.
      if (wandMode) {
        const target = board.columns[col];
        if (target.length === 0) {
          showToast("Bu sütunda parça yok");
          return;
        }
        const { board: cleaned } = removeTopPiece(board, col);
        setBoard(cleaned);
        setWandMode(false);
        setWandCharges((c) => c - 1);
        playSound("pop");
        showToast("🪄 Parça buğulandı!");
        checkJam(cleaned, queue, wandCharges - 1);
        return;
      }

      const fragment = queue[0];
      if (!fragment) return;
      if (!canDrop(board, col, fragment)) {
        playSound("pop");
        showToast("Buraya sığmıyor!");
        return;
      }

      const photo = photos.find((p) => p.id === fragment.photoId);
      if (!photo) return;

      const working: Board = { cols: board.cols, rows: board.rows, columns: board.columns.map((c) => [...c]) };
      const revealed: Fragment = { ...fragment, hidden: false };
      const result = resolveDrop(working, col, revealed, photo, combo);

      // Kuyruk ilerlet + deste yenile
      let restDeck = deck;
      while (restDeck.length < QUEUE_SIZE) restDeck = [...restDeck, ...buildDeck(photos)];
      const nextQueue = [...queue.slice(1), restDeck[0]];
      restDeck = restDeck.slice(1);

      playSound(result.completed ? "success" : "pop");

      let nextCombo = 0;
      let nextCompleted = completedCount;
      let nextGallery = gallery;
      let bonus = 0;

      if (result.completed) {
        nextCombo = combo + 1;
        nextGallery = [...gallery, photo];
        nextCompleted = completedCount + 1;
        scoreRef.current += result.points;
        confetti({
          particleCount: 60 + nextCombo * 10,
          spread: 70,
          origin: { y: 0.6 },
          colors: ["#f59e0b", "#10b981", "#3b82f6"],
        });
        if (nextCombo >= 2) showToast(`Combo × ${nextCombo}! 🔥`);
      }
      scoreRef.current += result.merged ? result.points : 0;
      setCombo(nextCombo);

      // Kaskad dolum: tamamlanan resmin sütununa yeni parçalar yağar.
      let finalBoard = result.board;
      if (result.completed) {
        let rainCount = 0;
        while (rainCount < 2 && restDeck.length > 0 && canDrop(finalBoard, col, restDeck[0])) {
          finalBoard = placePlain(finalBoard, col, restDeck[0]);
          restDeck = restDeck.slice(1);
          rainCount += 1;
        }
      }

      // Seviye hedefi doldu mu?
      if (nextCompleted >= goal) {
        bonus = 300 * level;
        scoreRef.current += bonus;
        setIsLevelComplete(true);
        setGallery(nextGallery);
        void saveProgress(scoreRef.current, levelRef.current, { level: levelRef.current });
      } else {
        checkJam(finalBoard, nextQueue, wandCharges);
      }

      setBoard(finalBoard);
      setQueue(nextQueue);
      setDeck(restDeck);
      setCompletedCount(nextCompleted);
      setGallery(nextGallery);
      setScore(scoreRef.current);
    },
    [
      board,
      checkJam,
      combo,
      completedCount,
      deck,
      gallery,
      goal,
      isGameOver,
      isLevelComplete,
      level,
      photos,
      playSound,
      queue,
      saveProgress,
      wandCharges,
      wandMode,
    ],
  );

  // Klavye kontrolleri (masaüstü): ←/→ sütun seç, ↓/Boşluk bırak
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (isGameOver || isLevelComplete) return;
      if (e.key === "ArrowLeft") {
        setSelectedCol((c) => Math.max(0, c - 1));
      } else if (e.key === "ArrowRight") {
        setSelectedCol((c) => Math.min(board.cols - 1, c + 1));
      } else if (e.key === "ArrowDown" || e.key === " " || e.key === "Enter") {
        e.preventDefault();
        dropAt(selectedCol);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [dropAt, selectedCol, board.cols, isGameOver, isLevelComplete]);

  /** Seviye bitti → galeriyi göster, sonra sonraki seviye. */
  const startNextLevel = useCallback(() => {
    const nextLevel = levelRef.current + 1;
    levelRef.current = nextLevel;
    const { roundPhotos, newBoard, fullDeck } = makeRound(nextLevel);
    setLevel(nextLevel);
    setGoal(picturesGoalForLevel(nextLevel));
    setWandCharges(wandChargesForLevel(nextLevel));
    setWandMode(false);
    setSelectedCol(Math.floor(newBoard.cols / 2));
    setPhotos(roundPhotos);
    setBoard(newBoard);
    setDeck(fullDeck.slice(QUEUE_SIZE));
    setQueue(fullDeck.slice(0, QUEUE_SIZE));
    setCombo(0);
    setCompletedCount(0);
    setGallery([]);
    setIsLevelComplete(false);
    showToast(`Seviye ${nextLevel}! Daha büyük bulmaca 🎉`);
  }, []);

  const rows = board.rows;
  const cols = board.cols;
  const cellPx = Math.floor(292 / cols); // board inner width ≈ 292px on mobile
  const photoById = new Map(photos.map((p) => [p.id, p]));
  const activeFragment = queue[0];
  const activePhoto = activeFragment ? photoById.get(activeFragment.photoId) : undefined;

  return (
    <div className="w-full max-w-sm mx-auto select-none">
      {/* Header */}
      <div className="bg-gradient-to-br from-sky-600 to-blue-700 rounded-3xl p-4 mb-3 border border-sky-400/20 shadow-2xl shadow-blue-500/20">
        <div className="flex items-center justify-between mb-3">
          <div>
            <h2 className="text-lg font-black text-white">🧩 Yapboz Düşüşü</h2>
            <p className="text-xs font-bold text-sky-200">
              Seviye {level}
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
          <div className="bg-white/10 rounded-xl p-2 text-center backdrop-blur-sm flex-1">
            <span className="text-[0.6rem] font-black text-sky-200 block uppercase">Hedef</span>
            <span className="text-sm font-black text-white">
              {"🖼️".repeat(completedCount)}
              {"·".repeat(Math.max(0, goal - completedCount))}
            </span>
          </div>
          {gallery.length > 0 && !isLevelComplete ? (
            <div className="bg-white/10 rounded-xl p-2 flex items-center backdrop-blur-sm">
              <span className="text-lg">{gallery[gallery.length - 1].emojis[0]}</span>
              <span className="text-[0.6rem] font-black text-emerald-300 ml-1">✓</span>
            </div>
          ) : null}
        </div>
      </div>

      {/* Board */}
      <div className="relative bg-gradient-to-b from-sky-500 to-blue-600 rounded-3xl p-3 border border-sky-300/30 shadow-2xl mb-3 overflow-hidden">
        {toast ? (
          <div className="absolute top-2 left-1/2 -translate-x-1/2 z-30 rounded-full bg-white/90 px-4 py-1.5 text-xs font-black text-sky-700 shadow-lg animate-in fade-in">
            {toast}
          </div>
        ) : null}
        {combo >= 2 && !isGameOver && !isLevelComplete ? (
          <div className="absolute top-10 left-1/2 -translate-x-1/2 z-20 text-2xl font-black text-emerald-300 drop-shadow-lg animate-pulse pointer-events-none">
            Combo 🔥 {combo}
          </div>
        ) : null}
        {wandMode ? (
          <div className="absolute top-10 left-1/2 -translate-x-1/2 z-20 rounded-full bg-fuchsia-600/90 px-3 py-1 text-[0.65rem] font-black text-white shadow-lg pointer-events-none">
            🪄 Buğulamak için bir sütuna dokun
          </div>
        ) : null}

        {/* Aktif parça göstergesi — seçili sütunun üstünde */}
        {!isGameOver && !isLevelComplete && activeFragment && activePhoto ? (
          <div
            className="relative z-10 mb-1 flex justify-center transition-all duration-150"
            style={{
              paddingLeft: `${(selectedCol / cols) * 100}%`,
              paddingRight: `${((cols - 1 - selectedCol) / cols) * 100}%`,
            }}
          >
            <div className="w-full opacity-90">
              <PhotoSlice
                photo={activePhoto}
                minSlice={activeFragment.slice}
                maxSlice={activeFragment.slice + activeFragment.height - 1}
                hidden={activeFragment.hidden}
                cellPx={Math.min(cellPx, 34)}
              />
            </div>
          </div>
        ) : null}

        <div
          className="grid gap-[6px]"
          style={{ gridTemplateColumns: `repeat(${cols}, minmax(0, 1fr))` }}
        >
          {Array.from({ length: cols }).map((_, col) => {
            const column = board.columns[col];
            const used = column.reduce((s, p) => s + p.height, 0);
            const emptyCount = rows - used;
            const isSelected = col === selectedCol;

            return (
              <button
                key={col}
                type="button"
                onClick={() => dropAt(col)}
                aria-label={`${col + 1}. sütuna bırak`}
                className={`flex flex-col gap-[6px] rounded-xl outline-none transition-shadow ${
                  isSelected && !isGameOver && !isLevelComplete
                    ? "ring-2 ring-white/80 shadow-lg"
                    : ""
                }`}
              >
                {/* Boş gözeler (üstte) */}
                {Array.from({ length: emptyCount }).map((_, i) => (
                  <div
                    key={`e-${i}`}
                    style={{ height: cellPx }}
                    className="w-full rounded-lg bg-blue-400/30 border-2 border-white/15"
                  />
                ))}

                {/* Yerleşen parçalar (üstten alta) */}
                {column.slice().reverse().map((piece) => {
                  const photo = photoById.get(piece.photoId);
                  if (!photo) return null;
                  return (
                    <PhotoSlice
                      key={`${piece.photoId}-${piece.slices.join("_")}`}
                      photo={photo}
                      minSlice={Math.min(...piece.slices)}
                      maxSlice={Math.max(...piece.slices)}
                      hidden={piece.hidden}
                      cellPx={cellPx}
                    />
                  );
                })}
              </button>
            );
          })}
        </div>

        {/* Seviye tamamlandı — gerçek oyundaki galeri ekranı */}
        {isLevelComplete ? (
          <div className="absolute inset-0 z-20 bg-slate-950/95 backdrop-blur-sm flex flex-col items-center justify-center p-6 text-center animate-in zoom-in-95 duration-200">
            <div className="w-16 h-16 bg-gradient-to-br from-emerald-400 to-teal-500 rounded-3xl flex items-center justify-center mb-2 shadow-2xl text-3xl">
              🖼️
            </div>
            <h3 className="text-xl font-black text-white">Seviye {level} tamam!</h3>
            <p className="text-xs text-emerald-300 font-bold mb-3">
              Seviye bonusu +{300 * level} puan
            </p>
            <div className="w-full overflow-x-auto mb-4">
              <div className="flex gap-3 justify-start px-2">
                {gallery.map((photo, i) => (
                  <div key={i} className="shrink-0 w-16">
                    <PhotoSlice
                      photo={photo}
                      minSlice={0}
                      maxSlice={photo.totalHeight - 1}
                      hidden={false}
                      cellPx={26}
                    />
                  </div>
                ))}
              </div>
            </div>
            <div className="bg-white/5 rounded-2xl p-4 w-full mb-4 border border-white/10">
              <p className="text-[0.65rem] text-slate-400 font-bold uppercase mb-1">Toplam Puan</p>
              <p className="text-3xl font-black text-white">{score}</p>
            </div>
            <button
              type="button"
              onClick={startNextLevel}
              className="tap-scale w-full bg-gradient-to-r from-emerald-500 to-teal-600 text-white font-black py-3 rounded-xl shadow-lg hover:brightness-110 transition text-sm"
            >
              Sonraki Seviye ▶️
            </button>
          </div>
        ) : null}

        {/* Oyun bitti — tahta tamamen tıkandı */}
        {isGameOver ? (
          <div className="absolute inset-0 z-20 bg-slate-950/95 backdrop-blur-sm flex flex-col items-center justify-center p-6 text-center animate-in zoom-in-95 duration-200">
            <div className="w-16 h-16 bg-gradient-to-br from-sky-500 to-blue-600 rounded-3xl flex items-center justify-center mb-3 shadow-2xl text-3xl">
              💥
            </div>
            <h3 className="text-xl font-black text-white">Tahta doldu!</h3>
            <p className="text-xs text-sky-300 font-bold mb-4">Seviye {level} — {score} puan</p>
            <div className="bg-white/5 rounded-2xl p-4 w-full mb-4 border border-white/10">
              <p className="text-[0.65rem] text-slate-400 font-bold uppercase mb-1">Final Skor</p>
              <p className="text-3xl font-black text-white">{score}</p>
              {highScore > 0 && score > highScore && (
                <p className="text-xs font-black text-yellow-400 mt-1 animate-pulse">👑 Yeni Rekor!</p>
              )}
            </div>
            <button
              type="button"
              onClick={initGame}
              className="tap-scale w-full bg-gradient-to-r from-sky-500 to-blue-600 text-white font-black py-3 rounded-xl shadow-lg hover:brightness-110 transition text-sm"
            >
              Tekrar Oyna 🔄
            </button>
          </div>
        ) : null}
      </div>

      {/* Kontroller: değnek + ipucu metni */}
      {!isGameOver && !isLevelComplete ? (
        <div className="flex items-center gap-2 justify-center mb-3">
          <button
            onClick={() => {
              if (wandCharges <= 0) {
                showToast("Değnek hakkın yok bu seviyede");
                return;
              }
              setWandMode((m) => !m);
            }}
            disabled={wandCharges <= 0}
            aria-label="Sihirli Değnek"
            className={`tap-scale p-3 rounded-2xl shadow-sm font-bold text-xl transition ${
              wandMode
                ? "bg-fuchsia-500 text-white ring-2 ring-fuchsia-300"
                : wandCharges > 0
                  ? "bg-purple-100 hover:bg-purple-200 text-purple-700"
                  : "bg-slate-100 text-slate-300"
            }`}
          >
            🪄<span className="text-[0.6rem] ml-1 align-top">×{wandCharges}</span>
          </button>
          <p className="text-[0.62rem] font-bold uppercase tracking-widest text-slate-400 flex-1 text-left">
            Bir sütuna dokun · Aynı resmin dilimlerini birleştir
          </p>
        </div>
      ) : null}

      {/* Queue Preview */}
      <div className="bg-white rounded-3xl p-3 border border-slate-200 shadow-sm">
        <p className="text-center text-[0.6rem] font-black uppercase text-slate-400 mb-2">Sıradakiler</p>
        <div className="flex justify-center gap-4 items-end">
          {queue.map((fragment, idx) => {
            const photo = photoById.get(fragment.photoId);
            const sliceHeight = fragment.height;
            return (
              <div
                key={fragment.uid}
                className={
                  idx === 0
                    ? "scale-110 drop-shadow-md animate-pulse"
                    : "opacity-60 scale-90"
                }
              >
                {photo ? (
                  <PhotoSlice
                    photo={photo}
                    minSlice={fragment.slice}
                    maxSlice={fragment.slice + sliceHeight - 1}
                    hidden={fragment.hidden}
                    cellPx={idx === 0 ? 26 : 20}
                  />
                ) : null}
              </div>
            );
          })}
        </div>
      </div>

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
