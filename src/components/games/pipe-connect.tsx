"use client";

import { useEffect, useState, useCallback } from "react";
import confetti from "canvas-confetti";
import { PipeCell, type PipeType } from "./pipe-cell";

// Boru bağlantı yönleri: [Top, Right, Bottom, Left]
const BASE_DIRECTIONS: Record<PipeType, [boolean, boolean, boolean, boolean]> = {
  empty: [false, false, false, false],
  source: [true, true, true, true], // Her yöne akış verebilir
  target: [true, true, true, true], // Her yönden akış kabul edebilir
  straight: [true, false, true, false], // Dikey (0 deg) -> Top, Bottom
  corner: [true, true, false, false],   // L köşe (0 deg) -> Top, Right
  t_junction: [false, true, true, true], // T (0 deg) -> Right, Bottom, Left
  cross: [true, true, true, true],      // Artı -> Her yöne
};

function rotateDirections(
  dirs: [boolean, boolean, boolean, boolean],
  rotation: number
): [boolean, boolean, boolean, boolean] {
  const steps = (rotation / 90) % 4;
  const newDirs = [...dirs] as [boolean, boolean, boolean, boolean];
  for (let i = 0; i < steps; i++) {
    const last = newDirs.pop()!;
    newDirs.unshift(last);
  }
  return newDirs;
}

type CellData = {
  type: PipeType;
  rotation: number;
  isFilled: boolean;
};

const GRID_SIZE = 5;

// Hazır Şablon Seviyeler (Seviye 1 - Kolay, Seviye 2 - Orta, Seviye 3 - Usta)
const PRESET_LEVELS: { type: PipeType; correctRotation: number }[][][] = [
  // Seviye 1: Kolay Yol
  [
    [{ type: "source", correctRotation: 0 }, { type: "corner", correctRotation: 90 }, { type: "empty", correctRotation: 0 }, { type: "empty", correctRotation: 0 }, { type: "empty", correctRotation: 0 }],
    [{ type: "empty", correctRotation: 0 }, { type: "straight", correctRotation: 0 }, { type: "empty", correctRotation: 0 }, { type: "empty", correctRotation: 0 }, { type: "empty", correctRotation: 0 }],
    [{ type: "empty", correctRotation: 0 }, { type: "corner", correctRotation: 0 }, { type: "straight", correctRotation: 90 }, { type: "corner", correctRotation: 90 }, { type: "empty", correctRotation: 0 }],
    [{ type: "empty", correctRotation: 0 }, { type: "empty", correctRotation: 0 }, { type: "empty", correctRotation: 0 }, { type: "straight", correctRotation: 0 }, { type: "empty", correctRotation: 0 }],
    [{ type: "empty", correctRotation: 0 }, { type: "empty", correctRotation: 0 }, { type: "empty", correctRotation: 0 }, { type: "corner", correctRotation: 270 }, { type: "target", correctRotation: 0 }],
  ],
  // Seviye 2: T Birleşimli & Dönemeçli
  [
    [{ type: "source", correctRotation: 0 }, { type: "straight", correctRotation: 90 }, { type: "corner", correctRotation: 90 }, { type: "empty", correctRotation: 0 }, { type: "empty", correctRotation: 0 }],
    [{ type: "empty", correctRotation: 0 }, { type: "empty", correctRotation: 0 }, { type: "t_junction", correctRotation: 0 }, { type: "straight", correctRotation: 90 }, { type: "corner", correctRotation: 90 }],
    [{ type: "empty", correctRotation: 0 }, { type: "corner", correctRotation: 0 }, { type: "corner", correctRotation: 270 }, { type: "empty", correctRotation: 0 }, { type: "straight", correctRotation: 0 }],
    [{ type: "empty", correctRotation: 0 }, { type: "straight", correctRotation: 0 }, { type: "empty", correctRotation: 0 }, { type: "empty", correctRotation: 0 }, { type: "corner", correctRotation: 270 }],
    [{ type: "empty", correctRotation: 0 }, { type: "corner", correctRotation: 270 }, { type: "straight", correctRotation: 90 }, { type: "straight", correctRotation: 90 }, { type: "target", correctRotation: 0 }],
  ],
  // Seviye 3: Karışık Akış (+ ve T içeren)
  [
    [{ type: "source", correctRotation: 0 }, { type: "corner", correctRotation: 90 }, { type: "empty", correctRotation: 0 }, { type: "empty", correctRotation: 0 }, { type: "empty", correctRotation: 0 }],
    [{ type: "empty", correctRotation: 0 }, { type: "cross", correctRotation: 0 }, { type: "straight", correctRotation: 90 }, { type: "corner", correctRotation: 90 }, { type: "empty", correctRotation: 0 }],
    [{ type: "empty", correctRotation: 0 }, { type: "straight", correctRotation: 0 }, { type: "empty", correctRotation: 0 }, { type: "t_junction", correctRotation: 180 }, { type: "corner", correctRotation: 90 }],
    [{ type: "corner", correctRotation: 0 }, { type: "corner", correctRotation: 270 }, { type: "empty", correctRotation: 0 }, { type: "straight", correctRotation: 0 }, { type: "straight", correctRotation: 0 }],
    [{ type: "target", correctRotation: 0 }, { type: "empty", correctRotation: 0 }, { type: "empty", correctRotation: 0 }, { type: "corner", correctRotation: 270 }, { type: "corner", correctRotation: 270 }],
  ],
];

type PipeConnectProps = {
  userId?: string;
  onGameEnd?: (score: number, stats: { levels: number; moves: number }) => void;
};

export function PipeConnect({ userId = "guest", onGameEnd }: PipeConnectProps) {
  const [currentLevel, setCurrentLevel] = useState(0);
  const [grid, setGrid] = useState<CellData[][]>([]);
  const [moves, setMoves] = useState(0);
  const [totalScore, setTotalScore] = useState(0);
  const [isLevelCompleted, setIsLevelCompleted] = useState(false);
  const [isGameFinished, setIsGameFinished] = useState(false);

  // Seviyeyi Başlat ve Boruları Rastgele Döndür
  const loadLevel = useCallback((lvlIndex: number) => {
    const template = PRESET_LEVELS[lvlIndex % PRESET_LEVELS.length];
    const newGrid: CellData[][] = template.map((row) =>
      row.map((cell) => {
        if (cell.type === "source" || cell.type === "target" || cell.type === "empty") {
          return { type: cell.type, rotation: 0, isFilled: cell.type === "source" };
        }
        // Rastgele açı ver (0, 90, 180, 270)
        const randomRotations = [0, 90, 180, 270];
        const initialRotation = randomRotations[Math.floor(Math.random() * randomRotations.length)];
        return {
          type: cell.type,
          rotation: initialRotation,
          isFilled: false,
        };
      })
    );

    setGrid(newGrid);
    setIsLevelCompleted(false);
  }, []);

  useEffect(() => {
    loadLevel(currentLevel);
  }, [currentLevel, loadLevel]);

  // Akış Hesaplama Algoritması (BFS)
  const calculateFlow = useCallback((currentGrid: CellData[][]) => {
    const rows = currentGrid.length;
    const cols = currentGrid[0].length;

    // Reset all isFilled except source
    const updated = currentGrid.map((r) =>
      r.map((c) => ({ ...c, isFilled: c.type === "source" }))
    );

    // Find source
    let startR = -1;
    let startC = -1;
    let targetR = -1;
    let targetC = -1;

    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < cols; c++) {
        if (updated[r][c].type === "source") {
          startR = r;
          startC = c;
        }
        if (updated[r][c].type === "target") {
          targetR = r;
          targetC = c;
        }
      }
    }

    if (startR === -1 || targetR === -1) return { newGrid: updated, targetReached: false };

    const queue: [number, number][] = [[startR, startC]];
    const visited = new Set<string>();
    visited.add(`${startR},${startC}`);

    // Yön Komşulukları: 0: Top, 1: Right, 2: Bottom, 3: Left
    const dRow = [-1, 0, 1, 0];
    const dCol = [0, 1, 0, -1];
    const oppositeDir = [2, 3, 0, 1]; // Top <-> Bottom, Right <-> Left

    let targetReached = false;

    while (queue.length > 0) {
      const [r, c] = queue.shift()!;
      const currentCell = updated[r][c];
      const currentDirs = rotateDirections(
        BASE_DIRECTIONS[currentCell.type],
        currentCell.rotation
      );

      if (r === targetR && c === targetC) {
        targetReached = true;
      }

      for (let dir = 0; dir < 4; dir++) {
        // Eğer mevcut borudan bu yöne çıkış varsa
        if (currentDirs[dir]) {
          const nR = r + dRow[dir];
          const nC = c + dCol[dir];

          if (nR >= 0 && nR < rows && nC >= 0 && nC < cols) {
            const neighbor = updated[nR][nC];
            if (neighbor.type !== "empty") {
              const neighborDirs = rotateDirections(
                BASE_DIRECTIONS[neighbor.type],
                neighbor.rotation
              );
              // Komşudan bize giriş var mı?
              if (neighborDirs[oppositeDir[dir]]) {
                const key = `${nR},${nC}`;
                if (!visited.has(key)) {
                  visited.add(key);
                  neighbor.isFilled = true;
                  queue.push([nR, nC]);
                }
              }
            }
          }
        }
      }
    }

    return { newGrid: updated, targetReached };
  }, []);

  // Boruya Tıklandığında Döndür ve Akışı Yeniden Hesapla
  const handleCellClick = (rIndex: number, cIndex: number) => {
    if (isLevelCompleted || isGameFinished) return;

    const cell = grid[rIndex][cIndex];
    if (cell.type === "empty" || cell.type === "source" || cell.type === "target") return;

    setMoves((prev) => prev + 1);

    const newGrid = grid.map((r, ri) =>
      r.map((c, ci) => {
        if (ri === rIndex && ci === cIndex) {
          return { ...c, rotation: (c.rotation + 90) % 360 };
        }
        return c;
      })
    );

    const { newGrid: flowGrid, targetReached } = calculateFlow(newGrid);
    setGrid(flowGrid);

    if (targetReached && !isLevelCompleted) {
      setIsLevelCompleted(true);
      const earnedScore = Math.max(50, 150 - moves * 2);
      const newTotal = totalScore + earnedScore;
      setTotalScore(newTotal);

      confetti({
        particleCount: 120,
        spread: 60,
        origin: { y: 0.6 },
        colors: ["#22d3ee", "#38bdf8", "#818cf8", "#f43f5e"],
      });

      // Son seviye kontrolü
      if (currentLevel >= PRESET_LEVELS.length - 1) {
        setIsGameFinished(true);
        handleGameFinish(newTotal, PRESET_LEVELS.length, moves + 1);
      }
    }
  };

  const handleNextLevel = () => {
    if (currentLevel < PRESET_LEVELS.length - 1) {
      setCurrentLevel((prev) => prev + 1);
    }
  };

  const handleGameFinish = async (finalScore: number, levels: number, totalMoves: number) => {
    try {
      await fetch("/api/games/finish", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          game_type: "pipe_connect",
          user_id: userId,
          score: finalScore,
          stats: { levels, moves: totalMoves },
        }),
      });
      console.log("Akış bulmacası skoru kaydedildi:", finalScore);
      if (onGameEnd) {
        onGameEnd(finalScore, { levels, moves: totalMoves });
      }
    } catch (error) {
      console.error("Skor gönderme hatası:", error);
    }
  };

  return (
    <div className="w-full max-w-sm mx-auto p-4 bg-slate-900 text-white rounded-3xl border border-slate-800 shadow-2xl relative select-none">
      {/* Header / HUD */}
      <div className="flex items-center justify-between mb-4">
        <div>
          <h2 className="text-lg font-black text-cyan-400 flex items-center gap-1.5">
            <span>⚡</span> Akış Yolu
          </h2>
          <p className="text-[0.68rem] font-bold text-slate-400">
            Seviye {currentLevel + 1} / {PRESET_LEVELS.length}
          </p>
        </div>
        <div className="flex gap-2">
          <div className="bg-slate-800/80 px-2.5 py-1 rounded-xl border border-slate-700 text-center">
            <span className="text-[0.55rem] font-black uppercase text-slate-400 block">Hamle</span>
            <span className="text-xs font-black text-white">{moves}</span>
          </div>
          <div className="bg-gradient-to-r from-cyan-500 to-blue-600 px-3 py-1 rounded-xl shadow-md text-center">
            <span className="text-[0.55rem] font-black uppercase text-cyan-100 block">Puan</span>
            <span className="text-xs font-black text-white">{totalScore}</span>
          </div>
        </div>
      </div>

      {/* Grid Container */}
      <div className="aspect-square bg-slate-950/80 rounded-2xl p-2 sm:p-3 border border-slate-800 shadow-inner relative flex items-center justify-center">
        <div
          className="grid gap-1.5 sm:gap-2"
          style={{
            gridTemplateColumns: `repeat(${GRID_SIZE}, minmax(0, 1fr))`,
            gridTemplateRows: `repeat(${GRID_SIZE}, minmax(0, 1fr))`,
          }}
        >
          {grid.map((row, rIndex) =>
            row.map((cell, cIndex) => (
              <PipeCell
                key={`${rIndex}-${cIndex}`}
                type={cell.type}
                rotation={cell.rotation}
                isFilled={cell.isFilled}
                onClick={() => handleCellClick(rIndex, cIndex)}
                disabled={isLevelCompleted || isGameFinished}
              />
            ))
          )}
        </div>

        {/* Level Complete / Game Over Overlay */}
        {isLevelCompleted && (
          <div className="absolute inset-0 z-20 bg-slate-900/90 backdrop-blur-xs rounded-2xl flex flex-col items-center justify-center p-5 text-center animate-in zoom-in-95 duration-200">
            <div className="w-14 h-14 bg-gradient-to-br from-cyan-400 to-blue-600 rounded-2xl flex items-center justify-center mb-2 shadow-lg shadow-cyan-500/30 text-2xl">
              ⚡
            </div>
            <h3 className="text-xl font-black text-white mb-0.5">
              {isGameFinished ? "Tüm Seviyeler Bitti! 🏆" : "Akış Sağlandı! 💧"}
            </h3>
            <p className="text-xs text-cyan-200 font-bold mb-4">
              {isGameFinished
                ? "Tebrikler, mantık bulmacasını ustalıkla tamamladın!"
                : `Harika hamle! +${Math.max(50, 150 - moves * 2)} Puan Kazandın.`}
            </p>

            {isGameFinished ? (
              <button
                type="button"
                onClick={() => {
                  setCurrentLevel(0);
                  setMoves(0);
                  setTotalScore(0);
                  setIsGameFinished(false);
                  loadLevel(0);
                }}
                className="tap-scale w-full bg-gradient-to-r from-cyan-500 to-blue-600 text-white font-black py-2.5 rounded-xl shadow-md hover:brightness-110 transition text-xs"
              >
                Yeniden Başla 🔄
              </button>
            ) : (
              <button
                type="button"
                onClick={handleNextLevel}
                className="tap-scale w-full bg-gradient-to-r from-emerald-500 to-teal-600 text-white font-black py-2.5 rounded-xl shadow-md hover:brightness-110 transition text-xs"
              >
                Sonraki Seviyeye Geç 🚀
              </button>
            )}
          </div>
        )}
      </div>

      <p className="text-center text-[0.65rem] font-bold text-slate-400 mt-3">
        Boruları 90° döndürmek için dokun, enerjiyi hedefe ulaştır!
      </p>
    </div>
  );
}
