"use client";

import confetti from "canvas-confetti";
import { useCallback, useEffect, useRef,useState } from "react";

import { useAudio } from "@/hooks/use-audio";
import { useGameProgress } from "@/hooks/use-game-progress";

import { BlockPiece, type ShapeType } from "./block-piece";

export type { ShapeType };
import { GameSoundToggle } from "./game-sound-toggle";
import { LeaderboardModal } from "./leaderboard-modal";

// Vibrant renk paleti - Tailwind gradient classes
const COLOR_SETS = [
  { color: "bg-rose-500", glow: "shadow-rose-500/40" },
  { color: "bg-amber-500", glow: "shadow-amber-500/40" },
  { color: "bg-emerald-500", glow: "shadow-emerald-500/40" },
  { color: "bg-cyan-500", glow: "shadow-cyan-500/40" },
  { color: "bg-violet-500", glow: "shadow-violet-500/40" },
  { color: "bg-fuchsia-500", glow: "shadow-fuchsia-500/40" },
  { color: "bg-blue-500", glow: "shadow-blue-500/40" },
  { color: "bg-orange-500", glow: "shadow-orange-500/40" },
];

const SHAPES: { matrix: number[][] }[] = [
  { matrix: [[1, 1]] },                                    // 1x2 yatay
  { matrix: [[1], [1]] },                                  // 2x1 dikey
  { matrix: [[1, 1, 1]] },                                 // 1x3 yatay
  { matrix: [[1], [1], [1]] },                             // 3x1 dikey
  { matrix: [[1, 1], [1, 1]] },                            // 2x2 kare
  { matrix: [[1, 1], [1, 0]] },                            // L küçük TL
  { matrix: [[1, 1], [0, 1]] },                            // L küçük TR
  { matrix: [[1, 0], [1, 1]] },                            // L küçük BL
  { matrix: [[0, 1], [1, 1]] },                            // L küçük BR
  { matrix: [[1, 1, 1], [1, 0, 0]] },                      // L yatay
  { matrix: [[1, 1, 1], [0, 0, 1]] },                      // J yatay
  { matrix: [[1, 1, 0], [0, 1, 1]] },                      // S tipi
  { matrix: [[0, 1, 1], [1, 1, 0]] },                      // Z tipi
];

const GRID_SIZE = 8;
const EMPTY_CELL = "";

function getRandomShape(): ShapeType {
  const shapeTemplate = SHAPES[Math.floor(Math.random() * SHAPES.length)];
  const cs = COLOR_SETS[Math.floor(Math.random() * COLOR_SETS.length)];
  return { matrix: shapeTemplate.matrix, color: cs.color, glowColor: cs.glow };
}

type BlockPuzzleProps = {
  userId?: string;
  onGameEnd?: (score: number, stats: { lines: number }) => void;
};

/** Parçanın tahtada en az bir yere sığıp sığmadığını kontrol eder. */
export function canFitAnywhere(shape: ShapeType, currentBoard: string[][]): boolean {
  const { matrix } = shape;
  for (let r = 0; r <= GRID_SIZE - matrix.length; r++) {
    for (let c = 0; c <= GRID_SIZE - matrix[0].length; c++) {
      let canFit = true;
      for (let sr = 0; sr < matrix.length; sr++) {
        for (let sc = 0; sc < matrix[0].length; sc++) {
          if (matrix[sr][sc] === 1 && currentBoard[r + sr][c + sc] !== EMPTY_CELL) {
            canFit = false;
            break;
          }
        }
        if (!canFit) break;
      }
      if (canFit) return true;
    }
  }
  return false;
}

export function BlockPuzzle({ userId = "guest", onGameEnd }: BlockPuzzleProps) {
  const [board, setBoard] = useState<string[][]>([]);
  const [options, setOptions] = useState<(ShapeType | null)[]>([]);
  
  const [score, setScore] = useState(0);
  const [linesClearedTotal, setLinesClearedTotal] = useState(0);
  const [level, setLevel] = useState(1);
  const [isGameOver, setIsGameOver] = useState(false);
  const [justCleared, setJustCleared] = useState<{ rows: number[]; cols: number[] } | null>(null);
  const [justDropped, setJustDropped] = useState<{row: number, col: number}[]>([]);

  const { playSound } = useAudio();
  const {
    highScore,
    isLeaderboardOpen,
    setIsLeaderboardOpen,
    saveProgress,
  } = useGameProgress({ gameType: "block_puzzle", userId });

  // Refs to avoid stale closures in useEffect callbacks
  const scoreRef = useRef(0);
  const levelRef = useRef(1);
  const linesClearedRef = useRef(0);

  // Sürükle-Bırak state
  const [dragState, setDragState] = useState<{
    isDragging: boolean;
    shapeIdx: number | null;
    shape: ShapeType | null;
    x: number;
    y: number;
    offsetX: number;
    offsetY: number;
    touchOffsetY: number;
    targetRow: number | null;
    targetCol: number | null;
    isValidDrop: boolean;
  }>({
    isDragging: false,
    shapeIdx: null,
    shape: null,
    x: 0,
    y: 0,
    offsetX: 0,
    offsetY: 0,
    touchOffsetY: 0,
    targetRow: null,
    targetCol: null,
    isValidDrop: false,
  });

  const boardRef = useRef<HTMLDivElement>(null);

  const initGame = useCallback(() => {
    const emptyBoard = Array.from({ length: GRID_SIZE }, () =>
      Array(GRID_SIZE).fill(EMPTY_CELL)
    );
    setBoard(emptyBoard);
    setOptions([getRandomShape(), getRandomShape(), getRandomShape()]);
    setScore(0);
    setLinesClearedTotal(0);
    setLevel(1);
    setIsGameOver(false);
    setJustCleared(null);
    scoreRef.current = 0;
    levelRef.current = 1;
    linesClearedRef.current = 0;
  }, []);

  useEffect(() => {
    initGame();
  }, [initGame]);

  useEffect(() => {
    if (isGameOver || options.length === 0 || board.length === 0) return;

    if (options.every((opt) => opt === null)) {
      setOptions([getRandomShape(), getRandomShape(), getRandomShape()]);
      return;
    }

    const hasMove = options.some((opt) => opt !== null && canFitAnywhere(opt, board));
    if (!hasMove) {
      playSound("error");
      setIsGameOver(true);
      confetti({
        particleCount: 80,
        spread: 60,
        origin: { y: 0.5 },
        colors: ["#f43f5e", "#fb923c", "#fbbf24"],
      });
      // Use refs to get fresh values — avoids stale closure
      handleGameFinish(scoreRef.current, linesClearedRef.current, levelRef.current);
    }
  }, [board, options, isGameOver]);

  const finishLatchRef = useRef(false);

  const handleGameFinish = async (finalScore: number, lines: number, finalLevel?: number) => {
    if (finishLatchRef.current) return;
    finishLatchRef.current = true;
    const lvl = finalLevel ?? levelRef.current;
    await saveProgress(finalScore, lvl, { lines });
    if (onGameEnd) onGameEnd(finalScore, { lines });
  };

  const handleDrop = (row: number, col: number, shape: ShapeType, shapeIdx: number) => {
    if (isGameOver) return;

    // Sınır kontrolü
    if (row + shape.matrix.length > GRID_SIZE || col + shape.matrix[0].length > GRID_SIZE) return;

    // Çakışma kontrolü
    for (let r = 0; r < shape.matrix.length; r++) {
      for (let c = 0; c < shape.matrix[0].length; c++) {
        if (shape.matrix[r][c] === 1 && board[row + r][col + c] !== EMPTY_CELL) return;
      }
    }

    // Parçayı yerleştir
    const newBoard = board.map((r) => [...r]);
    let blocksPlaced = 0;
    const newlyDropped: {row: number, col: number}[] = [];
    for (let r = 0; r < shape.matrix.length; r++) {
      for (let c = 0; c < shape.matrix[0].length; c++) {
        if (shape.matrix[r][c] === 1) {
          newBoard[row + r][col + c] = shape.color;
          blocksPlaced++;
          newlyDropped.push({row: row + r, col: col + c});
        }
      }
    }
    
    setJustDropped(newlyDropped);
    setTimeout(() => setJustDropped([]), 400);

    playSound("pop");
    if (typeof navigator !== "undefined" && navigator.vibrate) {
      navigator.vibrate(15);
    }

    const newOptions = [...options];
    newOptions[shapeIdx] = null;
    setOptions(newOptions);

    let currentLevel = level;
    let newScore = score + (blocksPlaced * 2 * currentLevel);

    // Temizlenecek satır ve sütunlar
    const rowsToClear: number[] = [];
    const colsToClear: number[] = [];

    for (let r = 0; r < GRID_SIZE; r++) {
      if (newBoard[r].every((cell) => cell !== EMPTY_CELL)) rowsToClear.push(r);
    }
    for (let c = 0; c < GRID_SIZE; c++) {
      if (newBoard.every((r) => r[c] !== EMPTY_CELL)) colsToClear.push(c);
    }

    const linesCleared = rowsToClear.length + colsToClear.length;
    if (linesCleared > 0) {
      playSound("clear");
      if (typeof navigator !== "undefined" && navigator.vibrate) {
        navigator.vibrate([30, 50, 30, 50, 40]);
      }
      setJustCleared({ rows: rowsToClear, cols: colsToClear });
      setTimeout(() => setJustCleared(null), 400);

      const newTotalLines = linesClearedTotal + linesCleared;
      setLinesClearedTotal(newTotalLines);
      
      // Seviye hesaplama (Her 5 satırda bir seviye atlar)
      const calculatedLevel = Math.floor(newTotalLines / 5) + 1;
      if (calculatedLevel > currentLevel) {
        playSound("success");
        currentLevel = calculatedLevel;
        setLevel(currentLevel);
        confetti({
          particleCount: 150,
          spread: 80,
          origin: { y: 0.3 },
          colors: ["#fcd34d", "#f59e0b", "#fbbf24"],
        });
      }

      // Combo puanı
      newScore += (linesCleared === 1 ? 15 : linesCleared === 2 ? 40 : linesCleared * 20) * currentLevel;

      rowsToClear.forEach((r) => {
        for (let c = 0; c < GRID_SIZE; c++) newBoard[r][c] = EMPTY_CELL;
      });
      colsToClear.forEach((c) => {
        for (let r = 0; r < GRID_SIZE; r++) newBoard[r][c] = EMPTY_CELL;
      });

      if (calculatedLevel === level) { // Eğer seviye atlamadıysa normal konfeti
        confetti({
          particleCount: linesCleared * 30,
          spread: 50,
          origin: { y: 0.5 },
          colors: ["#06b6d4", "#8b5cf6", "#10b981"],
        });
      }
    }

    setScore(newScore);
    setBoard(newBoard);
    // Keep refs in sync for fresh values in callbacks
    scoreRef.current = newScore;
    levelRef.current = currentLevel;
    linesClearedRef.current = linesCleared > 0 ? linesClearedTotal + linesCleared : linesClearedTotal;
  };

  // Drag and Drop global listeners
  const dragStateRef = useRef(dragState);

  useEffect(() => {
    const applyDragState = (next: typeof dragState) => {
      dragStateRef.current = next;
      setDragState(next);
    };

    const handlePointerMove = (e: PointerEvent) => {
      const prev = dragStateRef.current;
      if (!prev.isDragging) return;
      e.preventDefault();

      let targetRow: null | number = null;
      let targetCol: null | number = null;
      let isValidDrop = false;

      // Y-offset so the finger doesn't hide the piece on mobile
      const isTouch = e.pointerType === "touch";
      const touchOffsetY = isTouch ? 60 : 0;

      const ghostX = e.clientX - prev.offsetX;
      const ghostY = e.clientY - prev.offsetY - touchOffsetY;

      if (boardRef.current) {
        const boardRect = boardRef.current.getBoundingClientRect();
        const cellWidth = boardRect.width / GRID_SIZE;
        const cellHeight = boardRect.height / GRID_SIZE;

        // Calculate which column/row the center of the top-left block of the shape falls into
        const relativeX = ghostX - boardRect.left + (cellWidth / 2);
        const relativeY = ghostY - boardRect.top + (cellHeight / 2);

        const col = Math.floor(relativeX / cellWidth);
        const row = Math.floor(relativeY / cellHeight);

        if (row >= 0 && row < GRID_SIZE && col >= 0 && col < GRID_SIZE) {
          targetRow = row;
          targetCol = col;

          if (prev.shape) {
            let canFit = true;
            const matrix = prev.shape.matrix;
            if (targetRow + matrix.length > GRID_SIZE || targetCol + matrix[0].length > GRID_SIZE) {
               canFit = false;
            } else {
              for (let r = 0; r < matrix.length; r++) {
                for (let c = 0; c < matrix[0].length; c++) {
                  if (matrix[r][c] === 1 && board[targetRow + r][targetCol + c] !== EMPTY_CELL) {
                    canFit = false;
                    break;
                  }
                }
                if (!canFit) break;
              }
            }
            isValidDrop = canFit;
          }
        }
      }

      applyDragState({ ...prev, x: e.clientX, y: e.clientY, targetRow, targetCol, isValidDrop });
    };

    const handlePointerUp = () => {
      const prev = dragStateRef.current;
      if (!prev.isDragging || prev.shape === null || prev.shapeIdx === null) return;

      if (prev.isValidDrop && prev.targetRow !== null && prev.targetCol !== null) {
        handleDrop(prev.targetRow, prev.targetCol, prev.shape, prev.shapeIdx);
      } else {
        playSound("error"); // Geçersiz bırakma durumunda hata sesi çal
      }
      applyDragState({ isDragging: false, shapeIdx: null, shape: null, x: 0, y: 0, offsetX: 0, offsetY: 0, touchOffsetY: 0, targetRow: null, targetCol: null, isValidDrop: false });
    };
    const handlePointerCancel = () => {
      applyDragState({ isDragging: false, shapeIdx: null, shape: null, x: 0, y: 0, offsetX: 0, offsetY: 0, touchOffsetY: 0, targetRow: null, targetCol: null, isValidDrop: false });
    };

    if (dragState.isDragging) {
      window.addEventListener("pointermove", handlePointerMove, { passive: false });
      window.addEventListener("pointerup", handlePointerUp);
      window.addEventListener("pointercancel", handlePointerCancel);
    }
    return () => {
      window.removeEventListener("pointermove", handlePointerMove);
      window.removeEventListener("pointerup", handlePointerUp);
      window.removeEventListener("pointercancel", handlePointerCancel);
    };
  }, [dragState.isDragging, dragState.shape, board]);

  const onPointerDownBlock = (e: React.PointerEvent, shape: ShapeType, idx: number) => {
    if (isGameOver || disabled) return;
    
    // Stabilite için pointer'ı yakala
    e.currentTarget.setPointerCapture(e.pointerId);
    
    const isTouch = e.pointerType === "touch" || e.pointerType === "pen";
    const touchOffsetY = isTouch ? 50 : 0; // Biraz azaltıldı ki parmaktan çok kopmasın
    
    const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
    const nextDragState = {
      isDragging: true,
      shapeIdx: idx,
      shape: shape,
      x: e.clientX,
      y: e.clientY,
      offsetX: e.clientX - rect.left,
      offsetY: e.clientY - rect.top,
      touchOffsetY,
      targetRow: null,
      targetCol: null,
      isValidDrop: false,
    };
    dragStateRef.current = nextDragState;
    setDragState(nextDragState);
  };

  const disabled = isGameOver;

  return (
    <div className="w-full max-w-sm mx-auto select-none relative touch-none">
      <style dangerouslySetInnerHTML={{ __html: `
        @keyframes jellyDrop {
          0% { transform: scale(1); }
          30% { transform: scaleX(1.25) scaleY(0.75); }
          40% { transform: scaleX(0.75) scaleY(1.25); }
          50% { transform: scaleX(1.15) scaleY(0.85); }
          65% { transform: scaleX(0.95) scaleY(1.05); }
          75% { transform: scaleX(1.05) scaleY(0.95); }
          100% { transform: scale(1); }
        }
      `}} />
      {/* Header */}
      <div className="bg-gradient-to-br from-slate-900 to-slate-800 rounded-3xl p-4 mb-3 border border-white/10 shadow-2xl relative overflow-hidden">
        <div className="flex items-center justify-between mb-3 relative z-10">
          <div>
            <h2 className="text-lg font-black text-white flex items-center gap-2">
              🧩 Blok Zeka <span className="text-[0.65rem] bg-indigo-500 px-2 py-0.5 rounded-full text-white font-bold ml-1">Seviye {level}</span>
            </h2>
            <p className="text-xs font-bold text-slate-400">Satır/Sütun temizle, seviye atla!</p>
          </div>
          <div className="flex flex-col items-end gap-1">
            {highScore > 0 && (
              <div className="bg-yellow-400/10 border border-yellow-400/20 rounded-xl px-2 py-1 text-center">
                <span className="text-[0.5rem] font-black text-yellow-400 block uppercase">Rekor</span>
                <span className="text-xs font-black text-yellow-300">🏆 {highScore}</span>
              </div>
            )}
            <div className="flex gap-1">
              {!isGameOver && (
                <button 
                  onClick={() => {
                    setIsGameOver(true);
                    handleGameFinish(scoreRef.current, linesClearedRef.current, levelRef.current);
                  }}
                  aria-label="Oyunu bitir"
                  className="tap-scale bg-rose-500/80 hover:bg-rose-500 border border-rose-400/50 rounded-xl px-2 py-1 text-xs font-bold text-white transition-colors flex items-center gap-1"
                >
                  🛑 Bitir
                </button>
              )}
              <GameSoundToggle />
              <button 
                onClick={() => setIsLeaderboardOpen(true)}
                aria-label="Liderlik tablosunu aç"
                className="tap-scale bg-white/10 hover:bg-white/20 border border-white/20 rounded-xl px-2 py-1 text-xs font-bold text-white transition-colors flex items-center gap-1"
              >
                🏅 Tablo
              </button>
            </div>
          </div>
        </div>
        <div className="grid grid-cols-2 gap-2 relative z-10">
          <div className="bg-white/5 rounded-xl p-2 text-center border border-white/10">
            <span className="text-[0.6rem] font-black text-slate-400 block uppercase">Satır</span>
            <span className="text-base font-black text-cyan-400">{linesClearedTotal} <span className="text-xs text-slate-500">/ {(level * 5)}</span></span>
          </div>
          <div className="bg-gradient-to-r from-indigo-500/20 to-purple-600/20 rounded-xl p-2 text-center border border-indigo-400/30">
            <span className="text-[0.6rem] font-black text-indigo-300 block uppercase">Skor</span>
            <span className="text-base font-black text-white">{score}</span>
          </div>
        </div>
        
        {/* Progress Bar for Level */}
        <div className="absolute bottom-0 left-0 h-1 bg-indigo-500 transition-all duration-300" style={{ width: `${(linesClearedTotal % 5) * 20}%` }}></div>
      </div>

      {/* Game Grid */}
      <div className="bg-slate-900/40 backdrop-blur-xl rounded-3xl p-3 border border-white/10 shadow-[inset_0_0_30px_rgba(255,255,255,0.05)] shadow-2xl mb-3 relative" ref={boardRef}>
        <div
          className="grid gap-[3px]"
          style={{
            gridTemplateColumns: `repeat(${GRID_SIZE}, minmax(0, 1fr))`,
            gridTemplateRows: `repeat(${GRID_SIZE}, minmax(0, 1fr))`,
          }}
        >
          {board.map((row, rIndex) =>
            row.map((cell, cIndex) => {
              const isHighlighted =
                justCleared &&
                (justCleared.rows.includes(rIndex) || justCleared.cols.includes(cIndex));

              // Bırakma önizlemesi: parça nereye oturacaksa hücreleri yarı saydam gösterilir
              let isPreview = false;
              if (
                dragState.isDragging &&
                dragState.isValidDrop &&
                dragState.shape &&
                dragState.targetRow !== null &&
                dragState.targetCol !== null
              ) {
                const rDiff = rIndex - dragState.targetRow;
                const cDiff = cIndex - dragState.targetCol;
                if (
                  rDiff >= 0 &&
                  rDiff < dragState.shape.matrix.length &&
                  cDiff >= 0 &&
                  cDiff < dragState.shape.matrix[0].length &&
                  dragState.shape.matrix[rDiff][cDiff] === 1
                ) {
                  isPreview = true;
                }
              }

              const isNewlyDropped = justDropped.some(d => d.row === rIndex && d.col === cIndex);

              return (
                <div
                  key={`${rIndex}-${cIndex}`}
                  data-row={rIndex}
                  data-col={cIndex}
                  className={`aspect-square rounded-md transition-all duration-300 ${
                    isHighlighted
                      ? "bg-white scale-110 opacity-0 z-10 shadow-[0_0_20px_white]"
                      : isPreview
                      ? `bg-white/30 border-2 border-white/80 border-dashed opacity-60 shadow-inner scale-95`
                      : cell !== EMPTY_CELL
                      ? `${cell} border border-t-white/40 border-l-white/40 border-b-black/30 border-r-black/30 shadow-[inset_0_2px_4px_rgba(255,255,255,0.4)] ${
                          isNewlyDropped ? "animate-[jellyDrop_0.4s_ease-out]" : ""
                        }`
                      : "bg-white/5 border border-white/5"
                  }`}
                />
              );
            })
          )}
        </div>

        {/* Game Over Overlay */}
        {isGameOver && (
          <div className="absolute inset-0 z-10 bg-slate-900/95 backdrop-blur-sm rounded-3xl flex flex-col items-center justify-center p-6 text-center animate-in zoom-in-95 duration-300">
            <div className="w-16 h-16 bg-gradient-to-br from-rose-500 to-red-600 rounded-2xl flex items-center justify-center mb-3 shadow-2xl shadow-rose-500/40 text-3xl">
              💥
            </div>
            <h3 className="text-xl font-black text-white mb-1">Hamle Kalmadı!</h3>
            <p className="text-sm text-slate-400 font-bold mb-2">Final Skor: <span className="text-white">{score}</span></p>
            {highScore > 0 && score > highScore && (
              <p className="text-xs font-black text-yellow-400 mb-4">🏆 Yeni Rekor!</p>
            )}
            <button
              onClick={initGame}
              className="tap-scale w-full bg-gradient-to-r from-violet-500 to-indigo-600 text-white font-black py-3 rounded-xl shadow-lg hover:brightness-110 transition text-sm"
            >
              Tekrar Oyna 🔄
            </button>
          </div>
        )}
      </div>

      {/* Block Options */}
      <div className="bg-slate-900 rounded-3xl p-3 border border-white/10">
        <p className="text-center text-[0.65rem] font-bold text-slate-500 uppercase tracking-wider mb-2">
          Bloğu Sürükle ve Bırak
        </p>
        <div className="flex justify-around items-center gap-1">
          {options.map((opt, idx) => (
            <div key={idx} className="flex-1 flex justify-center touch-none">
              <BlockPiece
                shape={opt}
                isSelected={false}
                onClick={() => {}}
                onPointerDown={(e) => {
                  if (opt) onPointerDownBlock(e, opt, idx);
                }}
                disabled={disabled}
                isDragging={dragState.isDragging && dragState.shapeIdx === idx}
              />
            </div>
          ))}
        </div>
      </div>

      {/* Leaderboard Modal */}
      <LeaderboardModal
        isOpen={isLeaderboardOpen}
        onClose={() => setIsLeaderboardOpen(false)}
        gameType="block_puzzle"
        gameTitle="Blok Zeka"
        currentUserId={userId !== "guest" ? userId : undefined}
        currentScore={score > 0 ? score : highScore}
      />
    </div>
  );
}
