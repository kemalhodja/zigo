"use client";

import confetti from "canvas-confetti";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";

import { useAudio } from "@/hooks/use-audio";
import { useGameProgress } from "@/hooks/use-game-progress";
import {
  type Board,
  buildLevel,
  clearPhoto,
  findCompletedPhotos,
  hintChargesForLevel,
  isLevelCleared,
  moveTile,
  type PhotoDef,
  pointsForPhoto,
  refillFromStacks,
  type Tile,
} from "@/lib/domain/jigsaw-drop";

import { GameSoundToggle } from "./game-sound-toggle";
import { LeaderboardModal } from "./leaderboard-modal";

const CARD_H = 66;

function CardFace({
  photo,
  tile,
  highlighted,
  small,
}: {
  photo: PhotoDef | undefined;
  tile: Tile;
  highlighted?: boolean;
  small?: boolean;
}) {
  if (!photo) return null;
  if (tile.hidden) {
    return (
      <div
        className={`flex h-full w-full items-center justify-center rounded-xl border-2 border-amber-200/90 bg-gradient-to-br from-orange-400 to-rose-500 shadow ${
          highlighted ? "ring-2 ring-emerald-300" : ""
        }`}
      >
        <span className={small ? "text-sm opacity-90" : "text-lg opacity-90"}>👑</span>
      </div>
    );
  }
  return (
    <div
      className={`flex h-full w-full items-center justify-center overflow-hidden rounded-xl border-2 border-white/90 bg-gradient-to-br ${photo.gradient} shadow ${
        highlighted ? "ring-2 ring-emerald-300" : ""
      }`}
    >
      <span className={small ? "text-base leading-none drop-shadow-sm" : "text-2xl leading-none drop-shadow-sm"}>
        {photo.emojis[tile.part]}
      </span>
    </div>
  );
}

export function JigsawDrop({ userId = "guest" }: { userId?: string }) {
  const [level, setLevel] = useState(1);
  const [photos, setPhotos] = useState<PhotoDef[]>([]);
  const [board, setBoard] = useState<Board>({ cols: 5, rows: 4, cells: [] });
  const [stacks, setStacks] = useState<Tile[][]>([[], [], [], [], []]);
  const [score, setScore] = useState(0);
  const [combo, setCombo] = useState(0);
  const [gallery, setGallery] = useState<PhotoDef[]>([]);
  const [hintCharges, setHintCharges] = useState(3);
  const [selected, setSelected] = useState<number | null>(null);
  const [isLevelComplete, setIsLevelComplete] = useState(false);
  const [isEnded, setIsEnded] = useState(false);
  const [toast, setToast] = useState<string | null>(null);
  const [drag, setDrag] = useState<{ idx: number; x: number; y: number; moved: boolean } | null>(null);
  const [hoverIdx, setHoverIdx] = useState<number | null>(null);

  const boardGridRef = useRef<HTMLDivElement | null>(null);
  const toastTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const scoreRef = useRef(0);
  const levelRef = useRef(1);
  const savedRef = useRef(false);

  const { playSound } = useAudio();
  const { highScore, isLeaderboardOpen, setIsLeaderboardOpen, saveProgress } =
    useGameProgress({ gameType: "jigsaw_drop", userId });

  const photoById = useMemo(() => new Map(photos.map((p) => [p.id, p])), [photos]);

  function showToast(message: string) {
    setToast(message);
    if (toastTimerRef.current) clearTimeout(toastTimerRef.current);
    toastTimerRef.current = setTimeout(() => setToast(null), 2200);
  }

  useEffect(() => () => {
    if (toastTimerRef.current) clearTimeout(toastTimerRef.current);
  }, []);

  const startLevel = useCallback((lvl: number) => {
    const setup = buildLevel(lvl);
    levelRef.current = lvl;
    setLevel(lvl);
    setPhotos(setup.photos);
    setBoard(setup.board);
    setStacks(setup.stacks);
    setCombo(0);
    setGallery([]);
    setHintCharges(hintChargesForLevel(lvl));
    setSelected(null);
    setIsLevelComplete(false);
    setIsEnded(false);
    savedRef.current = false;
  }, []);

  const initGame = useCallback(() => {
    scoreRef.current = 0;
    setScore(0);
    startLevel(1);
  }, [startLevel]);

  useEffect(() => {
    initGame();
  }, [initGame]);

  const saveNow = useCallback(
    (lvl: number) => {
      if (savedRef.current) return;
      savedRef.current = true;
      void saveProgress(scoreRef.current, lvl, { level: lvl });
      savedRef.current = false;
    },
    [saveProgress],
  );

  const endGame = useCallback(() => {
    setIsEnded(true);
    saveNow(levelRef.current);
  }, [saveNow]);

  /** Hamle sonrası zincir çözümleme: tamamla → temizle → kart yağdır → tekrar. */
  const resolveAfterMove = useCallback(
    (startBoard: Board, startStacks: Tile[][]) => {
      let b = startBoard;
      let st = startStacks;
      let comboIdx = combo;
      let nextGallery = gallery;
      let anyComplete = false;
      let chainCount = 0;
      let guard = 0;

      while (guard < 6) {
        guard += 1;
        const completed = findCompletedPhotos(b, photoById);
        if (completed.length === 0) break;
        for (const photo of completed) {
          comboIdx += 1;
          scoreRef.current += pointsForPhoto(photo, comboIdx - 1);
          nextGallery = [...nextGallery, photo];
          anyComplete = true;
          confetti({
            particleCount: 50 + comboIdx * 10,
            spread: 70,
            origin: { y: 0.6 },
            colors: ["#f59e0b", "#10b981", "#3b82f6"],
          });
          b = clearPhoto(b, photo);
        }
        playSound("success");
        const ref = refillFromStacks(b, st);
        b = ref.board;
        st = ref.stacks;
        chainCount += 1;
      }

      if (anyComplete) {
        setCombo(comboIdx);
        if (comboIdx >= 2) showToast(`Combo Fever 🔥 ×${comboIdx}`);
        if (chainCount > 1) showToast(`Zincir! 🔗 ${chainCount} dalga`);
      } else {
        setCombo(0);
      }
      setBoard(b);
      setStacks(st);
      setGallery(nextGallery);
      setScore(scoreRef.current);

      if (isLevelCleared(b, st)) {
        const bonus = 200 * levelRef.current;
        scoreRef.current += bonus;
        setScore(scoreRef.current);
        setIsLevelComplete(true);
        saveNow(levelRef.current);
      }
    },
    [combo, gallery, photoById, playSound, saveNow],
  );

  /** Kartı taşı/takas; kapalı kartlar açılır; sonra zincir çözümlenir. */
  const handleDrop = useCallback(
    (from: number, to: number) => {
      if (isLevelComplete || isEnded) return;
      if (from === to) {
        setSelected(null);
        return;
      }
      const moved = moveTile(board, from, to);
      if (moved.board === board) return;
      const cells = moved.board.cells.map((t, i) =>
        t && (i === from || i === to) ? { ...t, hidden: false } : t,
      );
      const revealedBoard = { ...moved.board, cells };
      playSound("pop");
      setSelected(null);
      resolveAfterMove(revealedBoard, stacks);
    },
    [board, stacks, isLevelComplete, isEnded, playSound, resolveAfterMove],
  );

  // Sürükle-bırak (pointer) + dokunma ile seç/bırak
  useEffect(() => {
    if (!drag) return;
    const cellFromPoint = (x: number, y: number): number | null => {
      const rect = boardGridRef.current?.getBoundingClientRect();
      if (!rect) return null;
      if (x < rect.left || x > rect.right || y < rect.top || y > rect.bottom) return null;
      const col = Math.min(board.cols - 1, Math.max(0, Math.floor(((x - rect.left) / rect.width) * board.cols)));
      const row = Math.min(board.rows - 1, Math.max(0, Math.floor(((y - rect.top) / rect.height) * board.rows)));
      return row * board.cols + col;
    };
    const move = (e: PointerEvent) => {
      const dx = e.clientX - drag.x;
      const dy = e.clientY - drag.y;
      setDrag((d) =>
        d ? { ...d, x: e.clientX, y: e.clientY, moved: d.moved || Math.hypot(dx, dy) > 8 } : d,
      );
      setHoverIdx(cellFromPoint(e.clientX, e.clientY));
    };
    const up = (e: PointerEvent) => {
      const target = cellFromPoint(e.clientX, e.clientY);
      if (drag.moved) {
        if (target !== null && target !== drag.idx) handleDrop(drag.idx, target);
        else if (target === drag.idx) setSelected((s) => (s === drag.idx ? null : drag.idx));
      } else {
        // Dokunma: seç / bırak / takas
        if (selected === null) setSelected(drag.idx);
        else if (selected === drag.idx) setSelected(null);
        else handleDrop(selected, drag.idx);
      }
      setDrag(null);
      setHoverIdx(null);
    };
    const cancel = () => {
      setDrag(null);
      setHoverIdx(null);
    };
    window.addEventListener("pointermove", move);
    window.addEventListener("pointerup", up);
    window.addEventListener("pointercancel", cancel);
    return () => {
      window.removeEventListener("pointermove", move);
      window.removeEventListener("pointerup", up);
      window.removeEventListener("pointercancel", cancel);
    };
  }, [drag, board.cols, board.rows, handleDrop, selected]);

  const stackCount = stacks.reduce((s, x) => s + x.length, 0);
  const activeIdx = drag?.idx ?? selected;
  const activeTile = activeIdx !== null ? board.cells[activeIdx] : null;
  const activePhotoId = activeTile?.photoId;
  const dragTile = drag ? board.cells[drag.idx] : null;
  const dragPhoto = dragTile ? photoById.get(dragTile.photoId) : undefined;

  return (
    <div className="w-full max-w-sm mx-auto select-none">
      {/* Header */}
      <div className="bg-gradient-to-br from-sky-500 to-blue-600 rounded-3xl p-4 mb-3 border border-sky-300/40 shadow-2xl shadow-blue-500/20">
        <div className="flex items-center justify-between mb-3">
          <div>
            <h2 className="text-lg font-black text-white">🧩 Yapboz Düşüşü</h2>
            <p className="text-xs font-bold text-sky-100">
              Seviye {level}
              {combo > 0 ? ` · Combo 🔥 ×${combo}` : ""}
            </p>
          </div>
          <div className="flex flex-col items-end gap-1">
            {highScore > 0 && (
              <div className="bg-yellow-400/20 border border-yellow-300/30 rounded-xl px-2 py-1">
                <span className="text-[0.5rem] font-black text-yellow-100 block uppercase">Rekor</span>
                <span className="text-xs font-black text-yellow-200">🏆 {highScore}</span>
              </div>
            )}
            <div className="flex gap-1">
              <GameSoundToggle />
              {!isEnded && !isLevelComplete ? (
                <button
                  onClick={endGame}
                  aria-label="Oyunu bitir"
                  className="tap-scale bg-rose-500/80 hover:bg-rose-500 border border-rose-300/50 rounded-xl px-2 py-1 text-xs font-bold text-white transition-colors"
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
          <div className="bg-white/15 rounded-xl p-2 text-center flex-1 backdrop-blur-sm">
            <span className="text-[0.6rem] font-black text-sky-100 block uppercase">Puan</span>
            <span className="text-lg font-black text-white">{score}</span>
          </div>
          <div className="bg-white/15 rounded-xl p-2 text-center flex-1 backdrop-blur-sm">
            <span className="text-[0.6rem] font-black text-sky-100 block uppercase">Resim</span>
            <span className="text-lg font-black text-white">🖼️ {gallery.length}</span>
          </div>
          <div className="bg-white/15 rounded-xl p-2 text-center flex-1 backdrop-blur-sm">
            <span className="text-[0.6rem] font-black text-sky-100 block uppercase">Deste</span>
            <span className="text-lg font-black text-white">🂠 {stackCount}</span>
          </div>
        </div>
      </div>

      {/* Oyun çerçevesi */}
      <div className="rounded-[2rem] border-4 border-sky-200 bg-sky-100 p-2 shadow-2xl">
        <div className="relative rounded-[1.6rem] bg-gradient-to-b from-blue-500 to-blue-700 p-2 overflow-hidden">
          {toast ? (
            <div className="absolute top-2 left-1/2 -translate-x-1/2 z-30 rounded-full bg-white/90 px-4 py-1.5 text-xs font-black text-blue-700 shadow-lg animate-in fade-in">
              {toast}
            </div>
          ) : null}
          {combo >= 2 && !isLevelComplete && !isEnded ? (
            <div className="absolute top-12 left-1/2 -translate-x-1/2 z-20 text-2xl font-black text-amber-300 drop-shadow-lg animate-pulse pointer-events-none">
              Combo Fever 🔥 {combo}
            </div>
          ) : null}

          {/* Üst desteler */}
          <div
            className="grid gap-1 mb-2 px-1"
            style={{ gridTemplateColumns: `repeat(${board.cols}, minmax(0, 1fr))` }}
          >
            {stacks.map((stack, c) => (
              <div key={c} className="relative h-12">
                {stack.length === 0 ? (
                  <div className="absolute inset-x-1 top-1 h-10 rounded-lg border-2 border-dashed border-white/25" />
                ) : (
                  Array.from({ length: Math.min(stack.length, 3) }).map((_, i) => (
                    <div
                      key={i}
                      className="absolute inset-x-1 rounded-lg border-2 border-amber-200/90 bg-gradient-to-br from-orange-400 to-rose-500 shadow"
                      style={{ height: 40, top: i * 3 }}
                    >
                      <div className="flex h-full items-center justify-center">
                        <span className="text-xs opacity-80">👑</span>
                      </div>
                    </div>
                  ))
                )}
                {stack.length > 0 ? (
                  <span className="absolute -top-1 -right-1 z-10 rounded-full bg-white px-1.5 text-[0.6rem] font-black text-blue-700 shadow">
                    {stack.length}
                  </span>
                ) : null}
              </div>
            ))}
          </div>

          {/* Tahta */}
          <div
            ref={boardGridRef}
            className="grid gap-1.5"
            style={{ gridTemplateColumns: `repeat(${board.cols}, minmax(0, 1fr))` }}
          >
            {board.cells.map((tile, idx) => {
              const isHover = hoverIdx === idx && drag?.moved;
              const isActive = activeIdx === idx;
              const isSibling =
                activePhotoId !== undefined && tile?.photoId === activePhotoId && !isActive;
              const isEmpty = tile === null;
              const isBottomTile = Math.floor(idx / board.cols) === board.rows - 1 || board.cells[idx + board.cols] === null;
              
              return (
                <button
                  key={idx}
                  type="button"
                  onPointerDown={(e) => {
                    if (isLevelComplete || isEnded || !tile || !isBottomTile) {
                       if (tile && !isBottomTile) showToast("Sadece en alt sıradaki kartları taşıyabilirsiniz!");
                       return;
                    }
                    e.preventDefault();
                    setDrag({ idx, x: e.clientX, y: e.clientY, moved: false });
                  }}
                  aria-label={tile ? `kart ${idx + 1}` : `boş göz ${idx + 1}`}
                  className={`relative rounded-xl outline-none transition ${
                    isEmpty ? "border-2 border-dashed border-white/30 bg-blue-400/20" : ""
                  } ${isHover ? "ring-2 ring-amber-300" : ""} ${
                    isActive ? "opacity-40" : ""
                  } ${tile && !isBottomTile ? "brightness-75 cursor-not-allowed" : ""}`}
                  style={{ height: CARD_H }}
                >
                  {tile ? (
                    <CardFace photo={photoById.get(tile.photoId)} tile={tile} highlighted={isSibling} />
                  ) : null}
                </button>
              );
            })}
          </div>

          {/* Alt bilgi şeridi */}
          <div className="mt-2 rounded-xl bg-purple-500/90 py-1.5 text-center">
            <span className="text-[0.65rem] font-black uppercase tracking-widest text-white">
              Sürükle & Takas · Resmi tamamla · Combo yap
            </span>
          </div>

          {/* Seviye tamamlandı */}
          {isLevelComplete ? (
            <div className="absolute inset-0 z-20 bg-slate-950/95 backdrop-blur-sm flex flex-col items-center justify-center p-6 text-center animate-in zoom-in-95 duration-200">
              <div className="w-16 h-16 bg-gradient-to-br from-emerald-400 to-teal-500 rounded-3xl flex items-center justify-center mb-2 shadow-2xl text-3xl">
                🖼️
              </div>
              <h3 className="text-xl font-black text-white">Seviye {level} tamam!</h3>
              <p className="text-xs text-emerald-300 font-bold mb-3">
                Seviye bonusu +{200 * level} puan
              </p>
              <div className="w-full overflow-x-auto mb-3">
                <div className="flex gap-2 justify-start px-1">
                  {gallery.map((photo, i) => (
                    <div key={i} className="shrink-0 grid gap-0.5" style={{ gridTemplateColumns: `repeat(${photo.shape.w}, minmax(0, 1fr))`, width: photo.shape.w * 22 }}>
                      {photo.emojis.map((emoji, j) => (
                        <div
                          key={j}
                          className={`flex h-10 w-[22px] items-center justify-center bg-gradient-to-br ${photo.gradient} rounded-sm text-xs`}
                        >
                          {emoji}
                        </div>
                      ))}
                    </div>
                  ))}
                </div>
              </div>
              <div className="bg-white/5 rounded-2xl p-3 w-full mb-3 border border-white/10">
                <p className="text-[0.65rem] text-slate-400 font-bold uppercase mb-1">Toplam Puan</p>
                <p className="text-3xl font-black text-white">{score}</p>
              </div>
              <button
                type="button"
                onClick={() => startLevel(levelRef.current + 1)}
                className="tap-scale w-full bg-gradient-to-r from-emerald-500 to-teal-600 text-white font-black py-3 rounded-xl shadow-lg hover:brightness-110 transition text-sm"
              >
                Sonraki Seviye ▶️
              </button>
            </div>
          ) : null}

          {/* Oyun bitti */}
          {isEnded ? (
            <div className="absolute inset-0 z-20 bg-slate-950/95 backdrop-blur-sm flex flex-col items-center justify-center p-6 text-center animate-in zoom-in-95 duration-200">
              <div className="w-16 h-16 bg-gradient-to-br from-sky-500 to-blue-600 rounded-3xl flex items-center justify-center mb-3 shadow-2xl text-3xl">
                🧩
              </div>
              <h3 className="text-xl font-black text-white">Oyun bitti</h3>
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
      </div>

      {/* Kontrol çubuğu: ipucu + ipucu metni */}
      {!isLevelComplete && !isEnded ? (
        <div className="flex items-center gap-2 justify-center mt-3 mb-2">
          <button
            onClick={() => {
              if (hintCharges <= 0) {
                showToast("İpucu hakkın kalmadı");
                return;
              }
              setBoard((b) => ({
                ...b,
                cells: b.cells.map((t) => (t ? { ...t, hidden: false } : null)),
              }));
              setHintCharges((c) => c - 1);
              playSound("pop");
              showToast("💡 Tüm kapalı kartlar açıldı!");
            }}
            disabled={hintCharges <= 0}
            aria-label="İpucu"
            className={`tap-scale p-3 rounded-2xl shadow-sm font-bold text-xl transition ${
              hintCharges > 0
                ? "bg-yellow-100 hover:bg-yellow-200 text-yellow-700"
                : "bg-slate-100 text-slate-300"
            }`}
          >
            💡<span className="text-[0.6rem] ml-1 align-top">×{hintCharges}</span>
          </button>
          <p className="text-[0.62rem] font-bold uppercase tracking-widest text-slate-400 flex-1 text-left">
            Kartı sürükle: boşa taşı, karta takas · 👑 kartlar hareket edince açılır
          </p>
        </div>
      ) : null}

      {/* Sürükleme hayaleti */}
      {drag && dragTile ? (
        <div
          className="fixed z-50 pointer-events-none opacity-95 drop-shadow-2xl"
          style={{ left: drag.x, top: drag.y, transform: "translate(-50%, -60%)", width: 56, height: CARD_H }}
        >
          <CardFace photo={dragPhoto} tile={dragTile} />
        </div>
      ) : null}

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
