"use client";

import { useEffect, useState, useCallback } from "react";
import confetti from "canvas-confetti";
import { PipeCell, type PipeType } from "./pipe-cell";
import { LeaderboardModal } from "./leaderboard-modal";
import { useAudio } from "@/hooks/use-audio";

const BASE_DIRECTIONS: Record<PipeType, [boolean, boolean, boolean, boolean]> = {
  empty: [false, false, false, false],
  source: [true, true, true, true],
  target: [true, true, true, true],
  straight: [true, false, true, false],
  corner: [true, true, false, false],
  t_junction: [false, true, true, true],
  cross: [true, true, true, true],
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

// 5 seviye - kaldığı yerden devam
const PRESET_LEVELS: { type: PipeType; correctRotation: number }[][][] = [
  // Seviye 1: Başlangıç
  [
    [{ type: "source", correctRotation: 0 }, { type: "corner", correctRotation: 90 }, { type: "empty", correctRotation: 0 }, { type: "empty", correctRotation: 0 }, { type: "empty", correctRotation: 0 }],
    [{ type: "empty", correctRotation: 0 }, { type: "straight", correctRotation: 0 }, { type: "empty", correctRotation: 0 }, { type: "empty", correctRotation: 0 }, { type: "empty", correctRotation: 0 }],
    [{ type: "empty", correctRotation: 0 }, { type: "corner", correctRotation: 0 }, { type: "straight", correctRotation: 90 }, { type: "corner", correctRotation: 90 }, { type: "empty", correctRotation: 0 }],
    [{ type: "empty", correctRotation: 0 }, { type: "empty", correctRotation: 0 }, { type: "empty", correctRotation: 0 }, { type: "straight", correctRotation: 0 }, { type: "empty", correctRotation: 0 }],
    [{ type: "empty", correctRotation: 0 }, { type: "empty", correctRotation: 0 }, { type: "empty", correctRotation: 0 }, { type: "corner", correctRotation: 270 }, { type: "target", correctRotation: 0 }],
  ],
  // Seviye 2: T Birleşimli
  [
    [{ type: "source", correctRotation: 0 }, { type: "straight", correctRotation: 90 }, { type: "corner", correctRotation: 90 }, { type: "empty", correctRotation: 0 }, { type: "empty", correctRotation: 0 }],
    [{ type: "empty", correctRotation: 0 }, { type: "empty", correctRotation: 0 }, { type: "t_junction", correctRotation: 0 }, { type: "straight", correctRotation: 90 }, { type: "corner", correctRotation: 90 }],
    [{ type: "empty", correctRotation: 0 }, { type: "corner", correctRotation: 0 }, { type: "corner", correctRotation: 270 }, { type: "empty", correctRotation: 0 }, { type: "straight", correctRotation: 0 }],
    [{ type: "empty", correctRotation: 0 }, { type: "straight", correctRotation: 0 }, { type: "empty", correctRotation: 0 }, { type: "empty", correctRotation: 0 }, { type: "corner", correctRotation: 270 }],
    [{ type: "empty", correctRotation: 0 }, { type: "corner", correctRotation: 270 }, { type: "straight", correctRotation: 90 }, { type: "straight", correctRotation: 90 }, { type: "target", correctRotation: 0 }],
  ],
  // Seviye 3: Çapraz Akış
  [
    [{ type: "source", correctRotation: 0 }, { type: "corner", correctRotation: 90 }, { type: "empty", correctRotation: 0 }, { type: "empty", correctRotation: 0 }, { type: "empty", correctRotation: 0 }],
    [{ type: "empty", correctRotation: 0 }, { type: "cross", correctRotation: 0 }, { type: "straight", correctRotation: 90 }, { type: "corner", correctRotation: 90 }, { type: "empty", correctRotation: 0 }],
    [{ type: "empty", correctRotation: 0 }, { type: "straight", correctRotation: 0 }, { type: "empty", correctRotation: 0 }, { type: "t_junction", correctRotation: 180 }, { type: "corner", correctRotation: 90 }],
    [{ type: "corner", correctRotation: 0 }, { type: "corner", correctRotation: 270 }, { type: "empty", correctRotation: 0 }, { type: "straight", correctRotation: 0 }, { type: "straight", correctRotation: 0 }],
    [{ type: "target", correctRotation: 0 }, { type: "empty", correctRotation: 0 }, { type: "empty", correctRotation: 0 }, { type: "corner", correctRotation: 270 }, { type: "corner", correctRotation: 270 }],
  ],
  // Seviye 4: Labirent
  [
    [{ type: "source", correctRotation: 0 }, { type: "straight", correctRotation: 90 }, { type: "straight", correctRotation: 90 }, { type: "corner", correctRotation: 180 }, { type: "empty", correctRotation: 0 }],
    [{ type: "empty", correctRotation: 0 }, { type: "empty", correctRotation: 0 }, { type: "empty", correctRotation: 0 }, { type: "straight", correctRotation: 0 }, { type: "empty", correctRotation: 0 }],
    [{ type: "corner", correctRotation: 0 }, { type: "straight", correctRotation: 90 }, { type: "t_junction", correctRotation: 270 }, { type: "corner", correctRotation: 270 }, { type: "empty", correctRotation: 0 }],
    [{ type: "straight", correctRotation: 0 }, { type: "empty", correctRotation: 0 }, { type: "straight", correctRotation: 0 }, { type: "empty", correctRotation: 0 }, { type: "empty", correctRotation: 0 }],
    [{ type: "corner", correctRotation: 270 }, { type: "straight", correctRotation: 90 }, { type: "corner", correctRotation: 90 }, { type: "empty", correctRotation: 0 }, { type: "target", correctRotation: 0 }],
  ],
  // Seviye 5: Usta
  [
    [{ type: "source", correctRotation: 0 }, { type: "t_junction", correctRotation: 270 }, { type: "straight", correctRotation: 90 }, { type: "corner", correctRotation: 180 }, { type: "empty", correctRotation: 0 }],
    [{ type: "empty", correctRotation: 0 }, { type: "straight", correctRotation: 0 }, { type: "empty", correctRotation: 0 }, { type: "straight", correctRotation: 0 }, { type: "empty", correctRotation: 0 }],
    [{ type: "empty", correctRotation: 0 }, { type: "cross", correctRotation: 0 }, { type: "straight", correctRotation: 90 }, { type: "t_junction", correctRotation: 180 }, { type: "corner", correctRotation: 90 }],
    [{ type: "empty", correctRotation: 0 }, { type: "straight", correctRotation: 0 }, { type: "empty", correctRotation: 0 }, { type: "straight", correctRotation: 0 }, { type: "straight", correctRotation: 0 }],
    [{ type: "empty", correctRotation: 0 }, { type: "corner", correctRotation: 270 }, { type: "straight", correctRotation: 90 }, { type: "corner", correctRotation: 90 }, { type: "target", correctRotation: 0 }],
  ],
  // Seviye 6: Karmaşık Labirent
  [
    [{ type: "empty", correctRotation: 0 }, { type: "empty", correctRotation: 0 }, { type: "source", correctRotation: 0 }, { type: "empty", correctRotation: 0 }, { type: "empty", correctRotation: 0 }],
    [{ type: "corner", correctRotation: 90 }, { type: "straight", correctRotation: 90 }, { type: "cross", correctRotation: 0 }, { type: "straight", correctRotation: 90 }, { type: "corner", correctRotation: 180 }],
    [{ type: "straight", correctRotation: 0 }, { type: "empty", correctRotation: 0 }, { type: "straight", correctRotation: 0 }, { type: "empty", correctRotation: 0 }, { type: "straight", correctRotation: 0 }],
    [{ type: "corner", correctRotation: 0 }, { type: "straight", correctRotation: 90 }, { type: "t_junction", correctRotation: 180 }, { type: "straight", correctRotation: 90 }, { type: "corner", correctRotation: 270 }],
    [{ type: "empty", correctRotation: 0 }, { type: "empty", correctRotation: 0 }, { type: "target", correctRotation: 0 }, { type: "empty", correctRotation: 0 }, { type: "empty", correctRotation: 0 }],
  ],
  // Seviye 7: Dolambaçlı Yollar
  [
    [{ type: "source", correctRotation: 0 }, { type: "corner", correctRotation: 180 }, { type: "corner", correctRotation: 90 }, { type: "corner", correctRotation: 180 }, { type: "empty", correctRotation: 0 }],
    [{ type: "empty", correctRotation: 0 }, { type: "straight", correctRotation: 0 }, { type: "straight", correctRotation: 0 }, { type: "straight", correctRotation: 0 }, { type: "empty", correctRotation: 0 }],
    [{ type: "empty", correctRotation: 0 }, { type: "corner", correctRotation: 0 }, { type: "corner", correctRotation: 270 }, { type: "corner", correctRotation: 0 }, { type: "corner", correctRotation: 180 }],
    [{ type: "empty", correctRotation: 0 }, { type: "empty", correctRotation: 0 }, { type: "empty", correctRotation: 0 }, { type: "empty", correctRotation: 0 }, { type: "straight", correctRotation: 0 }],
    [{ type: "empty", correctRotation: 0 }, { type: "empty", correctRotation: 0 }, { type: "empty", correctRotation: 0 }, { type: "target", correctRotation: 0 }, { type: "corner", correctRotation: 270 }],
  ],
  // Seviye 8: Paralel Akış
  [
    [{ type: "source", correctRotation: 0 }, { type: "t_junction", correctRotation: 180 }, { type: "empty", correctRotation: 0 }, { type: "empty", correctRotation: 0 }, { type: "empty", correctRotation: 0 }],
    [{ type: "empty", correctRotation: 0 }, { type: "straight", correctRotation: 0 }, { type: "empty", correctRotation: 0 }, { type: "empty", correctRotation: 0 }, { type: "empty", correctRotation: 0 }],
    [{ type: "empty", correctRotation: 0 }, { type: "t_junction", correctRotation: 90 }, { type: "straight", correctRotation: 90 }, { type: "corner", correctRotation: 180 }, { type: "empty", correctRotation: 0 }],
    [{ type: "empty", correctRotation: 0 }, { type: "straight", correctRotation: 0 }, { type: "empty", correctRotation: 0 }, { type: "straight", correctRotation: 0 }, { type: "empty", correctRotation: 0 }],
    [{ type: "empty", correctRotation: 0 }, { type: "corner", correctRotation: 0 }, { type: "straight", correctRotation: 90 }, { type: "t_junction", correctRotation: 0 }, { type: "target", correctRotation: 0 }],
  ],
  // Seviye 9: Zikzak
  [
    [{ type: "source", correctRotation: 0 }, { type: "empty", correctRotation: 0 }, { type: "empty", correctRotation: 0 }, { type: "empty", correctRotation: 0 }, { type: "empty", correctRotation: 0 }],
    [{ type: "corner", correctRotation: 0 }, { type: "corner", correctRotation: 180 }, { type: "empty", correctRotation: 0 }, { type: "empty", correctRotation: 0 }, { type: "empty", correctRotation: 0 }],
    [{ type: "empty", correctRotation: 0 }, { type: "corner", correctRotation: 0 }, { type: "corner", correctRotation: 180 }, { type: "empty", correctRotation: 0 }, { type: "empty", correctRotation: 0 }],
    [{ type: "empty", correctRotation: 0 }, { type: "empty", correctRotation: 0 }, { type: "corner", correctRotation: 0 }, { type: "corner", correctRotation: 180 }, { type: "empty", correctRotation: 0 }],
    [{ type: "empty", correctRotation: 0 }, { type: "empty", correctRotation: 0 }, { type: "empty", correctRotation: 0 }, { type: "corner", correctRotation: 0 }, { type: "target", correctRotation: 0 }],
  ],
  // Seviye 10: Büyük Düğüm
  [
    [{ type: "empty", correctRotation: 0 }, { type: "corner", correctRotation: 90 }, { type: "straight", correctRotation: 90 }, { type: "corner", correctRotation: 180 }, { type: "empty", correctRotation: 0 }],
    [{ type: "source", correctRotation: 0 }, { type: "cross", correctRotation: 0 }, { type: "empty", correctRotation: 0 }, { type: "cross", correctRotation: 0 }, { type: "target", correctRotation: 0 }],
    [{ type: "empty", correctRotation: 0 }, { type: "straight", correctRotation: 0 }, { type: "empty", correctRotation: 0 }, { type: "straight", correctRotation: 0 }, { type: "empty", correctRotation: 0 }],
    [{ type: "empty", correctRotation: 0 }, { type: "corner", correctRotation: 0 }, { type: "straight", correctRotation: 90 }, { type: "corner", correctRotation: 270 }, { type: "empty", correctRotation: 0 }],
    [{ type: "empty", correctRotation: 0 }, { type: "empty", correctRotation: 0 }, { type: "empty", correctRotation: 0 }, { type: "empty", correctRotation: 0 }, { type: "empty", correctRotation: 0 }],
  ],
];

type PipeConnectProps = {
  userId?: string;
  onGameEnd?: (score: number, stats: { levels: number; moves: number }) => void;
};

export function PipeConnect({ userId = "guest", onGameEnd }: PipeConnectProps) {
  const [currentLevel, setCurrentLevel] = useState(0);
  const [startLevel, setStartLevel] = useState<number | null>(null);
  const [grid, setGrid] = useState<CellData[][]>([]);
  const [moves, setMoves] = useState(0);
  const [totalMoves, setTotalMoves] = useState(0);
  const [totalScore, setTotalScore] = useState(0);
  const [highScore, setHighScore] = useState(0);
  const [isLevelCompleted, setIsLevelCompleted] = useState(false);
  const [isGameFinished, setIsGameFinished] = useState(false);
  const [levelScore, setLevelScore] = useState(0);
  const [isLeaderboardOpen, setIsLeaderboardOpen] = useState(false);

  const { playSound } = useAudio();

  // Kaydedilen ilerlemeyi yükle
  useEffect(() => {
    if (userId === "guest") return;
    fetch("/api/games/progress?game_type=pipe_connect")
      .then((r) => r.json())
      .then((data) => {
        if (data.high_score) setHighScore(data.high_score);
        if (data.last_level) {
          const savedLevel = data.last_level;
          setStartLevel(savedLevel);
          setCurrentLevel(savedLevel);
        } else {
          setStartLevel(0);
        }
      })
      .catch(() => setStartLevel(0));
  }, [userId]);

  const loadLevel = useCallback((lvlIndex: number) => {
    const template = PRESET_LEVELS[lvlIndex % PRESET_LEVELS.length];
    const newGrid: CellData[][] = template.map((row) =>
      row.map((cell) => {
        if (cell.type === "source" || cell.type === "target" || cell.type === "empty") {
          return { type: cell.type, rotation: 0, isFilled: cell.type === "source" };
        }
        const rots = [0, 90, 180, 270];
        return {
          type: cell.type,
          rotation: rots[Math.floor(Math.random() * rots.length)],
          isFilled: false,
        };
      })
    );
    setGrid(newGrid);
    setIsLevelCompleted(false);
    setMoves(0);
  }, []);

  useEffect(() => {
    if (userId !== "guest" && startLevel === null) return; // Bekle
    if (userId === "guest" && startLevel === null) {
      setStartLevel(0);
      return;
    }
    loadLevel(currentLevel);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentLevel, startLevel]);

  const calculateFlow = useCallback((currentGrid: CellData[][]) => {
    const rows = currentGrid.length;
    const cols = currentGrid[0].length;

    const updated = currentGrid.map((r) =>
      r.map((c) => ({ ...c, isFilled: c.type === "source" }))
    );

    let startR = -1, startC = -1, targetR = -1, targetC = -1;

    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < cols; c++) {
        if (updated[r][c].type === "source") { startR = r; startC = c; }
        if (updated[r][c].type === "target") { targetR = r; targetC = c; }
      }
    }

    if (startR === -1 || targetR === -1) return { newGrid: updated, targetReached: false };

    const queue: [number, number][] = [[startR, startC]];
    const visited = new Set<string>([`${startR},${startC}`]);
    const dRow = [-1, 0, 1, 0];
    const dCol = [0, 1, 0, -1];
    const oppositeDir = [2, 3, 0, 1];
    let targetReached = false;

    while (queue.length > 0) {
      const [r, c] = queue.shift()!;
      const currentCell = updated[r][c];
      const currentDirs = rotateDirections(BASE_DIRECTIONS[currentCell.type], currentCell.rotation);

      if (r === targetR && c === targetC) targetReached = true;

      for (let dir = 0; dir < 4; dir++) {
        if (currentDirs[dir]) {
          const nR = r + dRow[dir];
          const nC = c + dCol[dir];
          if (nR >= 0 && nR < rows && nC >= 0 && nC < cols) {
            const neighbor = updated[nR][nC];
            if (neighbor.type !== "empty") {
              const neighborDirs = rotateDirections(BASE_DIRECTIONS[neighbor.type], neighbor.rotation);
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

  const handleCellClick = (rIndex: number, cIndex: number) => {
    if (isLevelCompleted || isGameFinished) return;

    const cell = grid[rIndex][cIndex];
    if (cell.type === "empty" || cell.type === "source" || cell.type === "target") return;

    playSound("pop");

    setMoves((prev) => prev + 1);
    setTotalMoves((prev) => prev + 1);

    const newGrid = grid.map((r, ri) =>
      r.map((c, ci) =>
        ri === rIndex && ci === cIndex ? { ...c, rotation: (c.rotation + 90) % 360 } : c
      )
    );

    const { newGrid: flowGrid, targetReached } = calculateFlow(newGrid);
    setGrid(flowGrid);

    // Flow states changed?
    const currentFilled = grid.flat().filter(c => c.isFilled).length;
    const newFilled = flowGrid.flat().filter(c => c.isFilled).length;
    if (newFilled > currentFilled) playSound("water");

    if (targetReached && !isLevelCompleted) {
      playSound("success");
      setIsLevelCompleted(true);
      const earned = Math.max(50, 200 - (moves + 1) * 5);
      setLevelScore(earned);
      const newTotal = totalScore + earned;
      setTotalScore(newTotal);

      confetti({
        particleCount: 100,
        spread: 55,
        origin: { y: 0.6 },
        colors: ["#22d3ee", "#38bdf8", "#818cf8", "#34d399"],
      });

      saveProgress(newTotal, currentLevel);
    }
  };

  const saveProgress = async (score: number, level: number) => {
    if (userId === "guest") return;
    try {
      const res = await fetch("/api/games/progress", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ game_type: "pipe_connect", score, level }),
      });
      const data = await res.json();
      if (data.high_score) setHighScore(data.high_score);
    } catch {}

    try {
      await fetch("/api/games/finish", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          game_type: "pipe_connect",
          user_id: userId,
          score,
          stats: { levels: level + 1, moves: totalMoves },
        }),
      });
    } catch {}

    if (onGameEnd) onGameEnd(score, { levels: level + 1, moves: totalMoves });
  };

  const handleNextLevel = () => {
    const next = currentLevel + 1;
    saveProgress(totalScore, next);
    setCurrentLevel(next);
  };

  const handleRestart = () => {
    setCurrentLevel(0);
    setTotalScore(0);
    setTotalMoves(0);
    setIsGameFinished(false);
    loadLevel(0);
  };

  if (startLevel === null) {
    return (
      <div className="w-full max-w-sm mx-auto p-8 text-center">
        <div className="text-slate-400 font-bold text-sm">Yükleniyor...</div>
      </div>
    );
  }

  return (
    <div className="w-full max-w-sm mx-auto select-none">
      {/* Header */}
      <div className="bg-gradient-to-br from-slate-900 to-cyan-950 rounded-3xl p-4 mb-3 border border-cyan-500/20 shadow-2xl shadow-cyan-500/10">
        <div className="flex items-center justify-between mb-3">
          <div>
            <h2 className="text-lg font-black text-cyan-400 flex items-center gap-2">
              ⚡ Akış Yolu
            </h2>
            <p className="text-xs font-bold text-slate-400">
              Seviye {currentLevel + 1}
            </p>
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

        {/* Seviye İlerleme Çubuğu */}
        <div className="flex gap-1 mb-3">
          {PRESET_LEVELS.map((_, idx) => (
            <div
              key={idx}
              className={`h-1.5 flex-1 rounded-full transition-all ${
                idx < (currentLevel % PRESET_LEVELS.length)
                  ? "bg-cyan-400"
                  : idx === (currentLevel % PRESET_LEVELS.length)
                  ? "bg-cyan-400/50"
                  : "bg-white/10"
              }`}
            />
          ))}
        </div>

        <div className="grid grid-cols-2 gap-2">
          <div className="bg-white/5 rounded-xl p-2 text-center border border-white/10">
            <span className="text-[0.6rem] font-black text-slate-400 block uppercase">Hamle</span>
            <span className="text-base font-black text-white">{moves}</span>
          </div>
          <div className="bg-gradient-to-r from-cyan-500/20 to-blue-600/20 rounded-xl p-2 text-center border border-cyan-400/30">
            <span className="text-[0.6rem] font-black text-cyan-300 block uppercase">Puan</span>
            <span className="text-base font-black text-white">{totalScore}</span>
          </div>
        </div>
      </div>

      {/* Grid */}
      <div className="bg-slate-950 rounded-3xl p-3 border border-white/10 shadow-2xl mb-3 relative">
        <div
          className="grid gap-2"
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
          <div className="absolute inset-0 z-20 bg-slate-950/95 backdrop-blur-sm rounded-3xl flex flex-col items-center justify-center p-5 text-center animate-in zoom-in-95 duration-200">
            <div className="w-16 h-16 bg-gradient-to-br from-cyan-400 to-blue-600 rounded-3xl flex items-center justify-center mb-3 shadow-2xl shadow-cyan-500/40 text-3xl">
              {isGameFinished ? "🏆" : "💧"}
            </div>
            <h3 className="text-xl font-black text-white mb-1">
              Akış Sağlandı!
            </h3>
            <p className="text-xs text-cyan-300 font-bold mb-1">
              +{levelScore} puan kazandın!
            </p>
            <p className="text-[0.65rem] text-slate-400 mb-4">{moves} hamlede tamamlandı</p>

            <button
              type="button"
              onClick={handleNextLevel}
              className="tap-scale w-full bg-gradient-to-r from-emerald-500 to-teal-600 text-white font-black py-3 rounded-xl shadow-lg hover:brightness-110 transition text-sm"
            >
              Seviye {currentLevel + 2} → 🚀
            </button>
            <button
              type="button"
              onClick={handleRestart}
              className="tap-scale w-full mt-2 bg-white/5 text-slate-400 font-bold py-2 rounded-xl hover:bg-white/10 transition text-xs border border-white/10"
            >
              Baştan Başla 🔄
            </button>
          </div>
        )}
      </div>

      <p className="text-center text-[0.65rem] font-bold text-slate-500 mt-1">
        Boruları döndürmek için dokun · Enerjiyi hedefe ulaştır
      </p>

      {/* Leaderboard Modal */}
      <LeaderboardModal 
        isOpen={isLeaderboardOpen} 
        onClose={() => setIsLeaderboardOpen(false)} 
        gameType="pipe_connect" 
        gameTitle="Akış Yolu" 
      />
    </div>
  );
}
