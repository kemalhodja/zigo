"use client";

import { useEffect, useState, useCallback } from "react";
import confetti from "canvas-confetti";
import { BlockPiece, type ShapeType } from "./block-piece";

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
  const [selectedOptionIdx, setSelectedOptionIdx] = useState<number | null>(null);
  const [score, setScore] = useState(0);
  const [highScore, setHighScore] = useState(0);
  const [linesClearedTotal, setLinesClearedTotal] = useState(0);
  const [isGameOver, setIsGameOver] = useState(false);
  const [justCleared, setJustCleared] = useState<{ rows: number[]; cols: number[] } | null>(null);

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
    setSelectedOptionIdx(null);
    setScore(0);
    setLinesClearedTotal(0);
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
      setSelectedOptionIdx(null);
      return;
    }

    const hasMove = options.some((opt) => opt !== null && canFitAnywhere(opt, board));
    if (!hasMove) {
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
          body: JSON.stringify({ game_type: "block_puzzle", score: finalScore, level: 0 }),
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

  const handleCellClick = (row: number, col: number) => {
    if (isGameOver || selectedOptionIdx === null) return;

    const shape = options[selectedOptionIdx];
    if (!shape) return;

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

    const newOptions = [...options];
    newOptions[selectedOptionIdx] = null;
    setOptions(newOptions);
    setSelectedOptionIdx(null);

    let newScore = score + blocksPlaced * 2;

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
      setJustCleared({ rows: rowsToClear, cols: colsToClear });
      setTimeout(() => setJustCleared(null), 400);

      setLinesClearedTotal((prev) => prev + linesCleared);
      // Combo puanı
      newScore += linesCleared === 1 ? 15 : linesCleared === 2 ? 40 : linesCleared * 20;

      rowsToClear.forEach((r) => {
        for (let c = 0; c < GRID_SIZE; c++) newBoard[r][c] = EMPTY_CELL;
      });
      colsToClear.forEach((c) => {
        for (let r = 0; r < GRID_SIZE; r++) newBoard[r][c] = EMPTY_CELL;
      });

      confetti({
        particleCount: linesCleared * 30,
        spread: 50,
        origin: { y: 0.5 },
        colors: ["#06b6d4", "#8b5cf6", "#10b981"],
      });
    }

    setScore(newScore);
    setBoard(newBoard);
  };

  return (
    <div className="w-full max-w-sm mx-auto select-none">
      {/* Header */}
      <div className="bg-gradient-to-br from-slate-900 to-slate-800 rounded-3xl p-4 mb-3 border border-white/10 shadow-2xl">
        <div className="flex items-center justify-between mb-3">
          <div>
            <h2 className="text-lg font-black text-white flex items-center gap-2">
              🧩 Blok Zeka
            </h2>
            <p className="text-xs font-bold text-slate-400">Satır/Sütun temizle, puan kazan!</p>
          </div>
          {highScore > 0 && (
            <div className="bg-yellow-400/10 border border-yellow-400/20 rounded-2xl px-3 py-1.5 text-center">
              <span className="text-[0.55rem] font-black text-yellow-400 block uppercase">Rekor</span>
              <span className="text-sm font-black text-yellow-300">🏆 {highScore}</span>
            </div>
          )}
        </div>
        <div className="grid grid-cols-2 gap-2">
          <div className="bg-white/5 rounded-xl p-2 text-center border border-white/10">
            <span className="text-[0.6rem] font-black text-slate-400 block uppercase">Satır</span>
            <span className="text-base font-black text-cyan-400">{linesClearedTotal}</span>
          </div>
          <div className="bg-gradient-to-r from-indigo-500/20 to-purple-600/20 rounded-xl p-2 text-center border border-indigo-400/30">
            <span className="text-[0.6rem] font-black text-indigo-300 block uppercase">Skor</span>
            <span className="text-base font-black text-white">{score}</span>
          </div>
        </div>
      </div>

      {/* Game Grid */}
      <div className="bg-slate-900 rounded-3xl p-2.5 border border-white/10 shadow-2xl mb-3 relative">
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
              return (
                <div
                  key={`${rIndex}-${cIndex}`}
                  onClick={() => handleCellClick(rIndex, cIndex)}
                  className={`aspect-square rounded-md transition-all duration-150 cursor-pointer ${
                    isHighlighted
                      ? "bg-white scale-110 z-10"
                      : cell !== EMPTY_CELL
                      ? `${cell} border border-white/20 shadow-sm`
                      : selectedOptionIdx !== null
                      ? "bg-white/5 hover:bg-white/15 border border-white/5"
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
          Bloğu Seç → Izgara'ya Tıkla
        </p>
        <div className="flex justify-around items-center gap-1">
          {options.map((opt, idx) => (
            <div key={idx} className="flex-1 flex justify-center">
              <BlockPiece
                shape={opt}
                isSelected={selectedOptionIdx === idx}
                onClick={() => {
                  if (opt && !isGameOver) {
                    setSelectedOptionIdx(selectedOptionIdx === idx ? null : idx);
                  }
                }}
                disabled={isGameOver}
              />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
