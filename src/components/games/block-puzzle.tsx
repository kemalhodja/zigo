"use client";

import { useEffect, useState, useCallback } from "react";
import confetti from "canvas-confetti";
import { BlockPiece, type ShapeType } from "./block-piece";

// Zigo Renk Paleti (Tailwind sınıfları)
const COLORS = [
  "bg-rose-500",
  "bg-amber-500",
  "bg-emerald-500",
  "bg-teal-500",
  "bg-cyan-500",
  "bg-blue-500",
  "bg-indigo-500",
  "bg-fuchsia-500",
];

const SHAPES: { matrix: number[][] }[] = [
  { matrix: [[1]] }, // 1x1
  { matrix: [[1, 1]] }, // 1x2
  { matrix: [[1], [1]] }, // 2x1
  { matrix: [[1, 1, 1]] }, // 1x3
  { matrix: [[1], [1], [1]] }, // 3x1
  { matrix: [[1, 1, 1, 1]] }, // 1x4
  { matrix: [[1], [1], [1], [1]] }, // 4x1
  { matrix: [[1, 1], [1, 1]] }, // 2x2
  { matrix: [[1, 1, 1], [1, 1, 1], [1, 1, 1]] }, // 3x3
  { matrix: [[1, 1], [1, 0]] }, // L small TL
  { matrix: [[1, 1], [0, 1]] }, // L small TR
  { matrix: [[1, 0], [1, 1]] }, // L small BL
  { matrix: [[0, 1], [1, 1]] }, // L small BR
  { matrix: [[1, 1, 1], [1, 0, 0], [1, 0, 0]] }, // L big TL
  { matrix: [[1, 1, 1], [0, 0, 1], [0, 0, 1]] }, // L big TR
  { matrix: [[1, 0, 0], [1, 0, 0], [1, 1, 1]] }, // L big BL
  { matrix: [[0, 0, 1], [0, 0, 1], [1, 1, 1]] }, // L big BR
];

const GRID_SIZE = 8;
const EMPTY_CELL = "";

function getRandomShape(): ShapeType {
  const shapeTemplate = SHAPES[Math.floor(Math.random() * SHAPES.length)];
  const color = COLORS[Math.floor(Math.random() * COLORS.length)];
  return { matrix: shapeTemplate.matrix, color };
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
  const [linesClearedTotal, setLinesClearedTotal] = useState(0);
  const [isGameOver, setIsGameOver] = useState(false);

  // Initialize Game
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
  }, []);

  // Run once on mount
  useEffect(() => {
    initGame();
  }, [initGame]);

  // Check if a shape can fit ANYWHERE on the current board
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

  // Check Game Over condition every time board or options change
  useEffect(() => {
    if (isGameOver || options.length === 0 || board.length === 0) return;
    
    // If all options are null, refill them!
    if (options.every((opt) => opt === null)) {
      setOptions([getRandomShape(), getRandomShape(), getRandomShape()]);
      setSelectedOptionIdx(null);
      return;
    }

    // Check if any of the available options can fit
    const hasMove = options.some((opt) => opt !== null && canFitAnywhere(opt, board));
    
    if (!hasMove) {
      setIsGameOver(true);
      
      confetti({
        particleCount: 150,
        spread: 70,
        origin: { y: 0.6 },
        colors: ['#4f46e5', '#9333ea', '#10b981', '#f59e0b']
      });

      handleGameFinish(score, linesClearedTotal);
    }
  }, [board, options, isGameOver, canFitAnywhere, score, linesClearedTotal]);

  const handleGameFinish = async (finalScore: number, lines: number) => {
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
      console.log("Blok bulmaca skoru kaydedildi:", finalScore);
      
      if (onGameEnd) {
        onGameEnd(finalScore, { lines });
      }
    } catch (error) {
      console.error("Skor gönderme hatası:", error);
    }
  };

  const handleCellClick = (row: number, col: number) => {
    if (isGameOver || selectedOptionIdx === null) return;
    
    const shape = options[selectedOptionIdx];
    if (!shape) return;

    // Boundary check
    if (row + shape.matrix.length > GRID_SIZE || col + shape.matrix[0].length > GRID_SIZE) {
      return; // Cannot place, out of bounds
    }

    // Overlap check
    for (let r = 0; r < shape.matrix.length; r++) {
      for (let c = 0; c < shape.matrix[0].length; c++) {
        if (shape.matrix[r][c] === 1 && board[row + r][col + c] !== EMPTY_CELL) {
          return; // Cannot place, overlapping
        }
      }
    }

    // Place the shape
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

    // Mark option as used
    const newOptions = [...options];
    newOptions[selectedOptionIdx] = null;
    setOptions(newOptions);
    setSelectedOptionIdx(null);
    
    // Add base points for placement (e.g. 1 point per block)
    let newScore = score + blocksPlaced;

    // Check for cleared lines (rows & cols)
    const rowsToClear: number[] = [];
    const colsToClear: number[] = [];

    for (let r = 0; r < GRID_SIZE; r++) {
      if (newBoard[r].every((cell) => cell !== EMPTY_CELL)) {
        rowsToClear.push(r);
      }
    }
    for (let c = 0; c < GRID_SIZE; c++) {
      let isFull = true;
      for (let r = 0; r < GRID_SIZE; r++) {
        if (newBoard[r][c] === EMPTY_CELL) {
          isFull = false;
          break;
        }
      }
      if (isFull) colsToClear.push(c);
    }

    // Clear the lines
    rowsToClear.forEach((r) => {
      for (let c = 0; c < GRID_SIZE; c++) {
        newBoard[r][c] = EMPTY_CELL;
      }
    });
    colsToClear.forEach((c) => {
      for (let r = 0; r < GRID_SIZE; r++) {
        newBoard[r][c] = EMPTY_CELL; // Safe even if intersection was already cleared
      }
    });

    const linesCleared = rowsToClear.length + colsToClear.length;
    if (linesCleared > 0) {
      setLinesClearedTotal((prev) => prev + linesCleared);
      // Combo points! 1 line = 10, 2 lines = 30, 3 lines = 60, etc.
      newScore += linesCleared * 10 + (linesCleared > 1 ? linesCleared * 10 : 0);
    }

    setScore(newScore);
    setBoard(newBoard);
  };

  return (
    <div className="w-full max-w-sm mx-auto p-4 bg-slate-50 rounded-3xl border border-slate-200 shadow-sm relative select-none">
      
      {/* Header / HUD */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-xl font-black text-indigo-900 flex items-center gap-2">
            <span>🧩</span> Blok Zeka
          </h2>
          <p className="text-xs font-bold text-slate-500 mt-1">Stratejini Konuştur!</p>
        </div>
        <div className="flex gap-3">
          <div className="bg-white px-3 py-1.5 rounded-xl shadow-xs border border-slate-100 flex flex-col items-center">
            <span className="text-[0.6rem] font-black uppercase tracking-wider text-slate-400">Satır</span>
            <span className="text-sm font-black text-night">{linesClearedTotal}</span>
          </div>
          <div className="bg-gradient-to-br from-indigo-500 to-purple-600 px-4 py-1.5 rounded-xl shadow-md border border-indigo-400 flex flex-col items-center justify-center">
            <span className="text-[0.6rem] font-black uppercase tracking-wider text-indigo-100">Skor</span>
            <span className="text-base font-black text-white leading-none">{score}</span>
          </div>
        </div>
      </div>

      {/* Game Grid */}
      <div className="aspect-square bg-slate-200 rounded-2xl p-1 mb-6 shadow-inner relative">
        <div 
          className="w-full h-full grid gap-1"
          style={{
            gridTemplateColumns: `repeat(${GRID_SIZE}, minmax(0, 1fr))`,
            gridTemplateRows: `repeat(${GRID_SIZE}, minmax(0, 1fr))`,
          }}
        >
          {board.map((row, rIndex) =>
            row.map((cell, cIndex) => (
              <div
                key={`${rIndex}-${cIndex}`}
                onClick={() => handleCellClick(rIndex, cIndex)}
                className={`w-full h-full rounded-md transition-colors duration-200 cursor-pointer ${
                  cell !== EMPTY_CELL 
                    ? `${cell} shadow-sm border border-black/10` 
                    : "bg-slate-100/80 hover:bg-white/80"
                }`}
              />
            ))
          )}
        </div>
        
        {/* Game Over Overlay */}
        {isGameOver && (
          <div className="absolute inset-0 z-10 bg-white/80 backdrop-blur-sm rounded-2xl flex flex-col items-center justify-center p-6 text-center animate-in zoom-in-95 duration-300">
             <div className="w-16 h-16 bg-gradient-to-br from-rose-400 to-red-500 rounded-2xl flex items-center justify-center mb-3 shadow-lg shadow-rose-500/30 text-3xl">
              💥
            </div>
            <h3 className="text-2xl font-black text-night mb-1">Hamle Kalmadı!</h3>
            <p className="text-sm text-slate-500 font-bold mb-6">Harika bir strateji kurdun.</p>
            
            <button
              onClick={initGame}
              className="tap-scale w-full bg-night text-white font-black py-3 rounded-xl shadow-md hover:bg-slate-800 transition"
            >
              Tekrar Oyna 🔄
            </button>
          </div>
        )}
      </div>

      {/* Block Options */}
      <div className="flex justify-between items-center gap-2 h-24 mb-2">
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
      <p className="text-center text-[0.65rem] font-bold text-slate-400 uppercase tracking-wider">
        Önce aşağıdaki bloğu seç, sonra yukarıda yerleştir.
      </p>
    </div>
  );
}
