"use client";

import confetti from "canvas-confetti";
import { useCallback, useEffect, useMemo, useState } from "react";

import { useAudio } from "@/hooks/use-audio";
import { useGameProgress } from "@/hooks/use-game-progress";

import { GameSoundToggle } from "./game-sound-toggle";
import { LeaderboardModal } from "./leaderboard-modal";
import {
  type Difficulty,
  generateSudoku,
  getConflictingCells,
  isBoardComplete,
  type SudokuBoard,
} from "./sudoku-logic";

type SudokuGameProps = {
  userId?: string;
  onGameEnd?: (score: number, stats: { difficulty: string; timeSeconds: number }) => void;
};

export function SudokuGame({ userId = "guest", onGameEnd }: SudokuGameProps) {
  const [difficulty, setDifficulty] = useState<Difficulty>("easy");
  const [initialBoard, setInitialBoard] = useState<SudokuBoard>(() => Array.from({ length: 9 }, () => Array(9).fill(0)));
  const [board, setBoard] = useState<SudokuBoard>(() => Array.from({ length: 9 }, () => Array(9).fill(0)));
  const [solution, setSolution] = useState<SudokuBoard>(() => Array.from({ length: 9 }, () => Array(9).fill(0)));

  const [selectedCell, setSelectedCell] = useState<[number, number] | null>(null);
  const [mistakes, setMistakes] = useState(0);
  const [maxMistakes] = useState(3);
  const [isGameOver, setIsGameOver] = useState(false);
  const [hasWon, setHasWon] = useState(false);
  const [seconds, setSeconds] = useState(0);
  const [isTimerRunning, setIsTimerRunning] = useState(false);
  const [notesMode, setNotesMode] = useState(false);
  const [notes, setNotes] = useState<Record<string, Set<number>>>({});
  const [hintsRemaining, setHintsRemaining] = useState(3);
  const [history, setHistory] = useState<SudokuBoard[]>([]);

  const { playSound } = useAudio();

  const triggerHaptic = useCallback((type: "light" | "medium" | "heavy" | "error" = "light") => {
    if (typeof window !== "undefined" && "vibrate" in navigator) {
      try {
        if (type === "error") navigator.vibrate([40, 60, 40]);
        else if (type === "heavy") navigator.vibrate(30);
        else navigator.vibrate(15);
      } catch {
        // Ignore if not supported or disabled by device
      }
    }
  }, []);

  const {
    highScore,
    isLeaderboardOpen,
    setIsLeaderboardOpen,
    saveProgress,
  } = useGameProgress({ gameType: "sudoku", userId });

  const STORAGE_KEY = `zigo_sudoku_state_${userId}`;

  // Start / Reset new game
  const startNewGame = useCallback((diff: Difficulty) => {
    const { puzzle, solution: sol } = generateSudoku(diff);
    setInitialBoard(puzzle.map((r) => [...r]));
    setBoard(puzzle.map((r) => [...r]));
    setSolution(sol);
    setSelectedCell(null);
    setMistakes(0);
    setIsGameOver(false);
    setHasWon(false);
    setSeconds(0);
    setIsTimerRunning(true);
    setNotes({});
    setHintsRemaining(diff === "easy" ? 3 : diff === "medium" ? 2 : 1);
    setHistory([]);
    if (typeof window !== "undefined") {
      try {
        localStorage.removeItem(STORAGE_KEY);
      } catch {}
    }
  }, [STORAGE_KEY]);

  // Load saved state on mount if available
  useEffect(() => {
    if (typeof window === "undefined") return;
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const data = JSON.parse(saved);
        if (data && data.board && data.solution && !data.hasWon && !data.isGameOver) {
          setDifficulty(data.difficulty || "easy");
          setInitialBoard(data.initialBoard);
          setBoard(data.board);
          setSolution(data.solution);
          setMistakes(data.mistakes || 0);
          setSeconds(data.seconds || 0);
          setHintsRemaining(data.hintsRemaining ?? 3);
          setIsTimerRunning(true);
          // Restore notes
          if (data.notes) {
            const restoredNotes: Record<string, Set<number>> = {};
            for (const k of Object.keys(data.notes)) {
              restoredNotes[k] = new Set(data.notes[k]);
            }
            setNotes(restoredNotes);
          }
          return;
        }
      }
    } catch {}
    startNewGame(difficulty);
  }, [STORAGE_KEY, startNewGame]); // eslint-disable-line react-hooks/exhaustive-deps

  // Auto save progress to localStorage
  useEffect(() => {
    if (typeof window === "undefined" || !isTimerRunning || isGameOver || hasWon) return;
    try {
      const serializableNotes: Record<string, number[]> = {};
      for (const [k, v] of Object.entries(notes)) {
        serializableNotes[k] = Array.from(v);
      }
      localStorage.setItem(
        STORAGE_KEY,
        JSON.stringify({
          difficulty,
          initialBoard,
          board,
          solution,
          mistakes,
          seconds,
          hintsRemaining,
          notes: serializableNotes,
        })
      );
    } catch {}
  }, [STORAGE_KEY, difficulty, initialBoard, board, solution, mistakes, seconds, hintsRemaining, notes, isTimerRunning, isGameOver, hasWon]);

  // Timer
  useEffect(() => {
    let interval: NodeJS.Timeout | null = null;
    if (isTimerRunning && !isGameOver && !hasWon) {
      interval = setInterval(() => {
        setSeconds((prev) => prev + 1);
      }, 1000);
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [isTimerRunning, isGameOver, hasWon]);

  // Conflicts calculation
  const conflicts = useMemo(() => getConflictingCells(board), [board]);

  // Handle cell number placement
  const handleNumberInput = useCallback(
    (num: number) => {
      if (!selectedCell || isGameOver || hasWon) return;
      const [r, c] = selectedCell;
      if (initialBoard[r][c] !== 0) return; // Cannot edit original clue

      if (notesMode) {
        // Toggle note
        const key = `${r}-${c}`;
        setNotes((prev) => {
          const current = new Set(prev[key] || []);
          if (current.has(num)) current.delete(num);
          else current.add(num);
          return { ...prev, [key]: current };
        });
        playSound("pop");
        return;
      }

      if (board[r][c] === num) {
        // Deselect or clear
        return;
      }

      const isCorrect = solution[r][c] === num;
      // Push previous board state to history for Undo
      setHistory((prev) => [...prev.slice(-19), board.map((row) => [...row])]);

      const nextBoard = board.map((row) => [...row]);
      nextBoard[r][c] = num;
      setBoard(nextBoard);

      if (!isCorrect) {
        playSound("error");
        triggerHaptic("error");
        const nextMistakes = mistakes + 1;
        setMistakes(nextMistakes);
        if (nextMistakes >= maxMistakes) {
          setIsGameOver(true);
          setIsTimerRunning(false);
        }
      } else {
        playSound("pop");
        triggerHaptic("light");
        // Clear notes in affected row, col, and box
        setNotes((prev) => {
          const next = { ...prev };
          delete next[`${r}-${c}`];
          return next;
        });

        // Check victory
        if (isBoardComplete(nextBoard, solution)) {
          setHasWon(true);
          setIsTimerRunning(false);
          playSound("success");
          triggerHaptic("heavy");
          confetti({
            particleCount: 150,
            spread: 80,
            origin: { y: 0.5 },
            colors: ["#10b981", "#3b82f6", "#f59e0b"],
          });

          // Calculate score: Difficulty base + time bonus - mistake penalty
          const baseScore = difficulty === "easy" ? 500 : difficulty === "medium" ? 800 : 1200;
          const timeBonus = Math.max(0, 600 - seconds);
          const finalScore = Math.max(100, baseScore + timeBonus - mistakes * 100);

          void saveProgress(finalScore, 1, { difficulty, seconds });
          if (onGameEnd) onGameEnd(finalScore, { difficulty, timeSeconds: seconds });
        }
      }
    },
    [
      selectedCell,
      isGameOver,
      hasWon,
      initialBoard,
      notesMode,
      board,
      solution,
      mistakes,
      maxMistakes,
      difficulty,
      seconds,
      playSound,
      triggerHaptic,
      saveProgress,
      onGameEnd,
    ]
  );

  // Undo last action
  const handleUndo = useCallback(() => {
    if (history.length === 0 || isGameOver || hasWon) return;
    const previous = history[history.length - 1];
    setHistory((prev) => prev.slice(0, -1));
    setBoard(previous);
    playSound("pop");
    triggerHaptic("light");
  }, [history, isGameOver, hasWon, playSound, triggerHaptic]);

  // Erase cell
  const handleErase = useCallback(() => {
    if (!selectedCell || isGameOver || hasWon) return;
    const [r, c] = selectedCell;
    if (initialBoard[r][c] !== 0 || board[r][c] === 0) return;

    setHistory((prev) => [...prev.slice(-19), board.map((row) => [...row])]);

    const nextBoard = board.map((row) => [...row]);
    nextBoard[r][c] = 0;
    setBoard(nextBoard);

    setNotes((prev) => {
      const next = { ...prev };
      delete next[`${r}-${c}`];
      return next;
    });
    playSound("pop");
    triggerHaptic("light");
  }, [selectedCell, isGameOver, hasWon, initialBoard, board, playSound, triggerHaptic]);

  // Hint
  const handleHint = useCallback(() => {
    if (!selectedCell || isGameOver || hasWon || hintsRemaining <= 0) return;
    const [r, c] = selectedCell;
    if (initialBoard[r][c] !== 0 || board[r][c] === solution[r][c]) return;

    const correctNum = solution[r][c];
    const nextBoard = board.map((row) => [...row]);
    nextBoard[r][c] = correctNum;
    setBoard(nextBoard);
    setHintsRemaining((prev) => prev - 1);
    playSound("success");

    if (isBoardComplete(nextBoard, solution)) {
      setHasWon(true);
      setIsTimerRunning(false);
      confetti({ particleCount: 150, spread: 80, origin: { y: 0.5 } });
    }
  }, [selectedCell, isGameOver, hasWon, hintsRemaining, initialBoard, board, solution, playSound]);

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (isLeaderboardOpen || isGameOver || hasWon) return;

      if ((e.ctrlKey || e.metaKey) && (e.key === "z" || e.key === "Z")) {
        e.preventDefault();
        handleUndo();
      } else if (e.key >= "1" && e.key <= "9") {
        handleNumberInput(parseInt(e.key, 10));
      } else if (e.key === "Backspace" || e.key === "Delete") {
        handleErase();
      } else if (e.key === "n" || e.key === "N") {
        setNotesMode((prev) => !prev);
      } else if (e.key === "h" || e.key === "H") {
        handleHint();
      } else if (e.key === "u" || e.key === "U") {
        handleUndo();
      } else if (selectedCell) {
        const [r, c] = selectedCell;
        if (e.key === "ArrowUp" && r > 0) setSelectedCell([r - 1, c]);
        else if (e.key === "ArrowDown" && r < 8) setSelectedCell([r + 1, c]);
        else if (e.key === "ArrowLeft" && c > 0) setSelectedCell([r, c - 1]);
        else if (e.key === "ArrowRight" && c < 8) setSelectedCell([r, c + 1]);
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isLeaderboardOpen, isGameOver, hasWon, handleNumberInput, handleErase, handleHint, handleUndo, selectedCell]);

  const selectedValue = selectedCell ? board[selectedCell[0]][selectedCell[1]] : null;

  return (
    <div className="w-full max-w-sm mx-auto select-none relative">
      {/* Header Banner */}
      <div className="bg-gradient-to-br from-indigo-600 via-blue-600 to-cyan-600 rounded-3xl p-4 mb-3 border border-indigo-400/20 shadow-2xl shadow-blue-500/20">
        <div className="flex items-center justify-between mb-3">
          <div>
            <h2 className="text-xl font-black text-white flex items-center gap-2">
              <span>🧩</span> Sudoku
            </h2>
            <p className="text-xs font-bold text-indigo-100">
              Mantık ve Odaklanma
            </p>
          </div>
          <div className="flex flex-col items-end gap-1">
            {highScore > 0 && (
              <div className="bg-white/20 border border-white/30 rounded-xl px-2 py-1 text-center backdrop-blur-sm">
                <span className="text-[0.5rem] font-black text-white/80 block uppercase">Rekor</span>
                <span className="text-xs font-black text-white">🏆 {highScore}</span>
              </div>
            )}
            <div className="flex gap-1">
              <button
                onClick={() => startNewGame(difficulty)}
                aria-label="Yeni Oyun"
                className="tap-scale bg-white/20 hover:bg-white/30 border border-white/30 rounded-xl px-2 py-1 text-xs font-bold text-white transition flex items-center gap-1"
              >
                🔄 Yenile
              </button>
              <GameSoundToggle />
              <button
                onClick={() => setIsLeaderboardOpen(true)}
                aria-label="Liderlik tablosunu aç"
                className="tap-scale bg-white/20 hover:bg-white/30 border border-white/30 rounded-xl px-2 py-1 text-xs font-bold text-white transition flex items-center gap-1"
              >
                🏅 Tablo
              </button>
            </div>
          </div>
        </div>

        {/* Difficulty Selector */}
        <div className="flex bg-black/20 p-1 rounded-2xl mb-3 backdrop-blur-sm">
          {(["easy", "medium", "hard"] as Difficulty[]).map((d) => (
            <button
              key={d}
              onClick={() => {
                setDifficulty(d);
                startNewGame(d);
              }}
              className={`flex-1 py-1 text-[0.7rem] font-black rounded-xl transition ${
                difficulty === d
                  ? "bg-white text-indigo-700 shadow-md"
                  : "text-white/80 hover:text-white"
              }`}
            >
              {d === "easy" ? "Kolay" : d === "medium" ? "Orta" : "Zor"}
            </button>
          ))}
        </div>

        {/* Status: Time, Mistakes, Hints */}
        <div className="grid grid-cols-3 gap-2 text-center">
          <div className="bg-black/20 rounded-xl p-1.5 backdrop-blur-sm">
            <span className="text-[0.55rem] font-black text-indigo-200 block uppercase">Süre</span>
            <span className="text-sm font-black text-white">
              {Math.floor(seconds / 60)}:{(seconds % 60).toString().padStart(2, "0")}
            </span>
          </div>
          <div className="bg-black/20 rounded-xl p-1.5 backdrop-blur-sm">
            <span className="text-[0.55rem] font-black text-indigo-200 block uppercase">Hata</span>
            <span className={`text-sm font-black ${mistakes > 0 ? "text-rose-300" : "text-white"}`}>
              {mistakes}/{maxMistakes}
            </span>
          </div>
          <div className="bg-black/20 rounded-xl p-1.5 backdrop-blur-sm">
            <span className="text-[0.55rem] font-black text-indigo-200 block uppercase">İpucu</span>
            <span className="text-sm font-black text-amber-300">💡 {hintsRemaining}</span>
          </div>
        </div>
      </div>

      {/* 9x9 Sudoku Board */}
      <div className="bg-slate-900 rounded-3xl p-2.5 sm:p-3 border border-slate-800 shadow-2xl mb-3 aspect-square grid grid-cols-9 grid-rows-9 gap-[1px] bg-slate-700/60 relative overflow-hidden">
        {board.map((row, r) =>
          row.map((val, c) => {
            const isClue = initialBoard[r][c] !== 0;
            const isSelected = selectedCell?.[0] === r && selectedCell?.[1] === c;
            const isSameRowOrCol = selectedCell && (selectedCell[0] === r || selectedCell[1] === c);
            const isSameBox =
              selectedCell &&
              Math.floor(selectedCell[0] / 3) === Math.floor(r / 3) &&
              Math.floor(selectedCell[1] / 3) === Math.floor(c / 3);
            const isSameVal = selectedValue && val === selectedValue && val !== 0;
            const isConflict = conflicts.has(`${r}-${c}`);
            const cellNotes = notes[`${r}-${c}`];

            // 3x3 Box borders
            const borderRight = c % 3 === 2 && c !== 8 ? "border-r-2 border-slate-500" : "";
            const borderBottom = r % 3 === 2 && r !== 8 ? "border-b-2 border-slate-500" : "";

            let bgClass = "bg-slate-900";
            if (isSelected) bgClass = "bg-indigo-600 text-white";
            else if (isConflict) bgClass = "bg-rose-900/60 text-rose-200";
            else if (isSameVal) bgClass = "bg-indigo-950/90 text-indigo-200";
            else if (isSameRowOrCol || isSameBox) bgClass = "bg-slate-800/80";

            return (
              <button
                key={`${r}-${c}`}
                onClick={() => setSelectedCell([r, c])}
                aria-label={`Hücre ${r + 1}, ${c + 1}`}
                className={`w-full h-full flex items-center justify-center font-black transition-colors select-none ${borderRight} ${borderBottom} ${bgClass} ${
                  isClue ? "text-white font-black" : val !== 0 ? "text-cyan-400 font-bold" : "text-transparent"
                } text-base sm:text-lg`}
              >
                {val !== 0 ? (
                  val
                ) : cellNotes && cellNotes.size > 0 ? (
                  <div className="grid grid-cols-3 grid-rows-3 w-full h-full p-0.5 pointer-events-none">
                    {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((n) => (
                      <span
                        key={n}
                        className={`text-[0.5rem] leading-none flex items-center justify-center ${
                          cellNotes.has(n) ? "text-indigo-300 font-bold" : "text-transparent"
                        }`}
                      >
                        {n}
                      </span>
                    ))}
                  </div>
                ) : (
                  ""
                )}
              </button>
            );
          })
        )}
      </div>

      {/* Action Tools: Undo, Erase, Notes, Hint */}
      <div className="flex justify-between gap-1.5 mb-3">
        <button
          onClick={handleUndo}
          disabled={history.length === 0}
          aria-label="Geri Al"
          className="flex-1 py-2 rounded-2xl bg-slate-800 hover:bg-slate-700 disabled:opacity-40 disabled:cursor-not-allowed text-xs font-bold text-slate-300 border border-slate-700 transition flex items-center justify-center gap-1"
        >
          <span>↩️</span> Geri ({history.length})
        </button>
        <button
          onClick={handleErase}
          aria-label="Sil"
          className="flex-1 py-2 rounded-2xl bg-slate-800 hover:bg-slate-700 text-xs font-bold text-slate-300 border border-slate-700 transition flex items-center justify-center gap-1"
        >
          <span>🧹</span> Sil
        </button>
        <button
          onClick={() => setNotesMode((prev) => !prev)}
          aria-label="Not Modu"
          className={`flex-1 py-2 rounded-2xl text-xs font-bold border transition flex items-center justify-center gap-1 ${
            notesMode
              ? "bg-indigo-600 text-white border-indigo-500 shadow-md shadow-indigo-500/30"
              : "bg-slate-800 hover:bg-slate-700 text-slate-300 border-slate-700"
          }`}
        >
          <span>✏️</span> Not
        </button>
        <button
          onClick={handleHint}
          disabled={hintsRemaining <= 0}
          aria-label="İpucu"
          className="flex-1 py-2 rounded-2xl bg-slate-800 hover:bg-slate-700 disabled:opacity-40 disabled:cursor-not-allowed text-xs font-bold text-amber-300 border border-slate-700 transition flex items-center justify-center gap-1"
        >
          <span>💡</span> İpucu
        </button>
      </div>

      {/* Number Pad (1-9) */}
      <div className="grid grid-cols-9 gap-1 mb-3">
        {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((num) => (
          <button
            key={num}
            onClick={() => handleNumberInput(num)}
            aria-label={`Rakam ${num}`}
            className="tap-scale py-3 rounded-xl bg-slate-800 hover:bg-indigo-600 active:bg-indigo-700 text-white font-black text-lg border border-slate-700 transition flex items-center justify-center shadow-md"
          >
            {num}
          </button>
        ))}
      </div>

      {/* Victory Modal */}
      {hasWon && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-950/90 backdrop-blur-sm p-4 animate-in fade-in duration-200">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 w-full max-w-sm text-center shadow-2xl">
            <div className="w-16 h-16 rounded-3xl bg-emerald-500 shadow-xl shadow-emerald-500/40 flex items-center justify-center mx-auto mb-4 text-3xl">
              🏆
            </div>
            <h3 className="text-2xl font-black text-white mb-1">Harika İş!</h3>
            <p className="text-xs text-emerald-400 font-bold mb-4">
              Sudoku Bulmacasını Başarıyla Çözdün!
            </p>
            <div className="grid grid-cols-2 gap-2 bg-white/5 border border-white/10 rounded-xl p-3 mb-4 text-xs font-bold text-slate-300">
              <div>
                <span className="text-[0.6rem] text-slate-400 font-black block uppercase">Süre</span>
                <span className="text-base text-white font-black">
                  {Math.floor(seconds / 60)}d {seconds % 60}s
                </span>
              </div>
              <div>
                <span className="text-[0.6rem] text-slate-400 font-black block uppercase">Zorluk</span>
                <span className="text-base text-indigo-300 font-black uppercase">{difficulty}</span>
              </div>
            </div>
            <button
              onClick={() => startNewGame(difficulty)}
              className="tap-scale w-full bg-gradient-to-r from-emerald-500 to-teal-600 hover:brightness-110 text-white font-black py-3 rounded-xl shadow-lg transition text-xs"
            >
              Yeni Bulmaca Çöz 🚀
            </button>
          </div>
        </div>
      )}

      {/* Game Over Modal */}
      {isGameOver && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-950/90 backdrop-blur-sm p-4 animate-in fade-in duration-200">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 w-full max-w-sm text-center shadow-2xl">
            <div className="w-16 h-16 rounded-3xl bg-rose-500 shadow-xl shadow-rose-500/40 flex items-center justify-center mx-auto mb-4 text-3xl">
              💔
            </div>
            <h3 className="text-2xl font-black text-white mb-1">Hata Limiti Aşıldı</h3>
            <p className="text-xs text-slate-400 font-bold mb-4">
              {maxMistakes} hata hakkını doldurdun. Tekrar denemek ister misin?
            </p>
            <button
              onClick={() => startNewGame(difficulty)}
              className="tap-scale w-full bg-gradient-to-r from-indigo-500 to-blue-600 hover:brightness-110 text-white font-black py-3 rounded-xl shadow-lg transition text-xs"
            >
              Tekrar Dene 🔄
            </button>
          </div>
        </div>
      )}

      {/* Leaderboard Modal */}
      <LeaderboardModal
        isOpen={isLeaderboardOpen}
        onClose={() => setIsLeaderboardOpen(false)}
        gameType="sudoku"
        gameTitle="Sudoku Şampiyonları"
        currentUserId={userId !== "guest" ? userId : undefined}
        currentScore={highScore}
      />
    </div>
  );
}
