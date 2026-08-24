"use client";

import confetti from "canvas-confetti";
import { useCallback,useEffect, useState } from "react";

import { useAudio } from "@/hooks/use-audio";
import { useGameProgress } from "@/hooks/use-game-progress";

import { GameSoundToggle } from "./game-sound-toggle";
import { LeaderboardModal } from "./leaderboard-modal";
import { PipeCell, type PipeType } from "./pipe-cell";
import { generatePipeLevel } from "./pipe-generator";
import { BASE_DIRECTIONS, rotateDirections } from "./pipe-logic";

type CellData = {
  type: PipeType;
  rotation: number;
  isFilled: boolean;
};

// GRID_SIZE is now dynamic based on level size
import { PRESET_LEVELS } from "./pipe-levels";


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
  const [isLevelCompleted, setIsLevelCompleted] = useState(false);
  const [isGameFinished, setIsGameFinished] = useState(false);
  const [levelScore, setLevelScore] = useState(0);

  const { playSound } = useAudio();
  const {
    highScore,
    isLeaderboardOpen,
    setIsLeaderboardOpen,
    saveProgress,
  } = useGameProgress({ gameType: "pipe_connect", userId });

  const saveLevelProgress = useCallback(
    (score: number, level: number) => {
      void saveProgress(score, level, { levels: level + 1, moves: totalMoves });
      if (onGameEnd) onGameEnd(score, { levels: level + 1, moves: totalMoves });
    },
    [saveProgress, totalMoves, onGameEnd],
  );

  // Kaydedilen ilerlemeyi yükle
  useEffect(() => {
    if (userId === "guest") return;
    fetch(`/api/games/progress?game_type=pipe_connect`)
      .then((r) => r.json())
      .then((data) => {
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
    // Preset bölümler bitince sonsuz prosedürel bölümler başlar (gittikçe zorlaşır)
    const template =
      lvlIndex < PRESET_LEVELS.length
        ? PRESET_LEVELS[lvlIndex]
        : generatePipeLevel(lvlIndex, PRESET_LEVELS.length);
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

      saveLevelProgress(newTotal, currentLevel + 1);
    }
  };

  const handleNextLevel = () => {
    // İlerleme seviye tamamlanırken zaten kaydedildi; burada yalnızca geçiş yapılır
    setCurrentLevel(currentLevel + 1);
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
              {currentLevel >= PRESET_LEVELS.length && (
                <span className="ml-2 text-[0.58rem] font-black bg-cyan-500/20 text-cyan-300 border border-cyan-400/30 px-1.5 py-0.5 rounded-md align-middle">
                  ∞ SONSUZ MOD
                </span>
              )}
              {grid.length > 0 && (
                <span className="ml-2 text-slate-500">{grid.length}×{grid.length}</span>
              )}
            </p>
          </div>
          <div className="flex flex-col items-end gap-1">
            {highScore > 0 && (
              <div className="bg-yellow-400/10 border border-yellow-400/20 rounded-xl px-2 py-1 text-center">
                <span className="text-[0.5rem] font-black text-yellow-400 block uppercase">Rekor</span>
                <span className="text-xs font-black text-yellow-300">🏆 {highScore}</span>
              </div>
            )}
            <div className="flex gap-1">
              {!isLevelCompleted && !isGameFinished && (
                <button 
                  onClick={() => {
                    setIsLevelCompleted(true);
                    setIsGameFinished(true);
                    saveLevelProgress(totalScore, currentLevel);
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

        {/* Seviye İlerleme Çubuğu */}
        {currentLevel < PRESET_LEVELS.length ? (
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
        ) : (
          <div className="h-1.5 rounded-full mb-3 bg-gradient-to-r from-cyan-400/30 via-cyan-400 to-blue-400/30 animate-pulse" />
        )}

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
            gridTemplateColumns: `repeat(${grid.length || 5}, minmax(0, 1fr))`,
            gridTemplateRows: `repeat(${grid.length || 5}, minmax(0, 1fr))`,
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
        currentUserId={userId !== "guest" ? userId : undefined}
        currentScore={totalScore > 0 ? totalScore : highScore}
      />
    </div>
  );
}
