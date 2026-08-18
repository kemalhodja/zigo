"use client";

import confetti from "canvas-confetti";
import { useCallback, useEffect, useRef,useState } from "react";

import { useAudio } from "@/hooks/use-audio";

import { BlockPiece, type ShapeType } from "./block-piece";
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

export function BlockPuzzle({ userId = "guest", onGameEnd }: BlockPuzzleProps) {
  const [board, setBoard] = useState<string[][]>([]);
  const [options, setOptions] = useState<(ShapeType | null)[]>([]);
  
  const [score, setScore] = useState(0);
  const [highScore, setHighScore] = useState(0);
  const [linesClearedTotal, setLinesClearedTotal] = useState(0);
  const [level, setLevel] = useState(1);
  const [isGameOver, setIsGameOver] = useState(false);
  const [justCleared, setJustCleared] = useState<{ rows: number[]; cols: number[] } | null>(null);
  const [isLeaderboardOpen, setIsLeaderboardOpen] = useState(false);

  const { playSound } = useAudio();

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

  // Kaydedilen en yüksek skoru yükle
  useEffect(() => {
    if (userId === "guest") return;
    fetch("/api/games/progress?game_type=block_puzzle")
      .then((r) => r.json())
      .then((data) => { if (data.high_score) setHighScore(data.high_score); })
      .catch(() => {});
  }, [userId]);

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
  }, []);

  useEffect(() => {
    initGame();
  }, [initGame]);

  const canFitAnywhere = useCallback((shape: ShapeType, currentBoard: string[][]) => {
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
  }, []);

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
      handleGameFinish(score, linesClearedTotal);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [board, options, isGameOver]);

  const handleGameFinish = async (finalScore: number, lines: number) => {
    if (userId !== "guest") {
      try {
        const res = await fetch("/api/games/progress", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ game_type: "block_puzzle", score: finalScore, level: level }),
        });
        const data = await res.json();
        if (data.high_score) setHighScore(data.high_score);
      } catch {}

      try {
        await fetch("/api/games/finish", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            game_type: "block_puzzle",
            user_id: userId,
            score: finalScore,
            stats: { lines },
          }),
        });
      } catch {}
    }
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
    for (let r = 0; r < shape.matrix.length; r++) {
      for (let c = 0; c < shape.matrix[0].length; c++) {
        if (shape.matrix[r][c] === 1) {
          newBoard[row + r][col + c] = shape.color;
          blocksPlaced++;
        }
      }
    }

    playSound("pop");

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
  };

  // Drag and Drop global listeners
  useEffect(() => {
    const handlePointerMove = (e: PointerEvent) => {
      if (!dragState.isDragging) return;
      e.preventDefault(); 
      
      setDragState((prev) => {
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

        return { ...prev, x: e.clientX, y: e.clientY, targetRow, targetCol, isValidDrop };
      });
    };

    const handlePointerUp = (e: PointerEvent) => {
      if (!dragState.isDragging || dragState.shape === null || dragState.shapeIdx === null) return;
      
      setDragState((prev) => {
        if (prev.isValidDrop && prev.targetRow !== null && prev.targetCol !== null) {
          handleDrop(prev.targetRow, prev.targetCol, prev.shape!, prev.shapeIdx!);
        } else {
          playSound("error"); // Geçersiz bırakma durumunda hata sesi çal
        }
        return { isDragging: false, shapeIdx: null, shape: null, x: 0, y: 0, offsetX: 0, offsetY: 0, touchOffsetY: 0, targetRow: null, targetCol: null, isValidDrop: false };
      });
    };

    if (dragState.isDragging) {
      window.addEventListener("pointermove", handlePointerMove, { passive: false });
      window.addEventListener("pointerup", handlePointerUp);
    }
    return () => {
      window.removeEventListener("pointermove", handlePointerMove);
      window.removeEventListener("pointerup", handlePointerUp);
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [dragState.isDragging, dragState.shape, board]);

  const onPointerDownBlock = (e: React.PointerEvent, shape: ShapeType, idx: number) => {
    if (isGameOver || disabled) return;
    
    const isTouch = e.pointerType === "touch";
    const touchOffsetY = isTouch ? 60 : 0;
    
    const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
    setDragState({
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
    });
  };

  const disabled = isGameOver;

  return (
    <div className="w-full max-w-sm mx-auto select-none relative">
      {/* Ghost Element for Dragging */}
      {dragState.isDragging && dragState.shape && (
        <div
          className="fixed z-50 pointer-events-none"
          style={{
            left: dragState.x - dragState.offsetX,
            top: dragState.y - dragState.offsetY - dragState.touchOffsetY,
          }}
        >
          <BlockPiece shape={dragState.shape} isSelected={true} onClick={() => {}} disabled={false} />
        </div>
      )}

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
            <button 
              onClick={() => setIsLeaderboardOpen(true)}
              className="tap-scale bg-white/10 hover:bg-white/20 border border-white/20 rounded-xl px-2 py-1 text-xs font-bold text-white transition-colors flex items-center gap-1"
            >
              🏅 Tablo
            </button>
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
      <div className="bg-slate-900 rounded-3xl p-2.5 border border-white/10 shadow-2xl mb-3 relative" ref={boardRef}>
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

              // Önizleme mantığı
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

              return (
                <div
                  key={`${rIndex}-${cIndex}`}
                  data-row={rIndex}
                  data-col={cIndex}
                  className={`aspect-square rounded-md transition-all duration-300 ${
                    isHighlighted
                      ? "bg-white scale-0 rotate-45 opacity-0 z-10"
                      : isPreview
                      ? `${dragState.shape?.color} border border-white/40 opacity-60 shadow-lg scale-95`
                      : cell !== EMPTY_CELL
                      ? `${cell} border border-white/20 shadow-sm animate-in zoom-in-75 duration-200`
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
            {highScore > 0 && score >= highScore && (
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
      />
    </div>
  );
}
