"use client";

import confetti from "canvas-confetti";
import { useCallback, useEffect, useRef,useState } from "react";

import { useAudio } from "@/hooks/use-audio";

import { LeaderboardModal } from "./leaderboard-modal";

type MathMasterProps = {
  userId?: string;
  onGameEnd?: (score: number, stats: { level: number; correct: number }) => void;
};

type Question = {
  text: string;
  answer: number;
  options: number[];
};

export function MathMaster({ userId = "guest", onGameEnd }: MathMasterProps) {
  const [currentLevel, setCurrentLevel] = useState(1);
  const [score, setScore] = useState(0);
  const [highScore, setHighScore] = useState(0);
  const [lives, setLives] = useState(3);
  const [isGameOver, setIsGameOver] = useState(false);
  const [question, setQuestion] = useState<Question | null>(null);
  const [timeLeft, setTimeLeft] = useState(100);
  const [correctAnswers, setCorrectAnswers] = useState(0);
  const [streak, setStreak] = useState(0);
  const [isLeaderboardOpen, setIsLeaderboardOpen] = useState(false);
  
  // UI States for Polish
  const [selectedAnswer, setSelectedAnswer] = useState<number | null>(null);
  const [floatingText, setFloatingText] = useState<{ id: number; x: number; y: number; text: string }[]>([]);
  const floatIdRef = useRef(0);

  const { playSound } = useAudio();
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const previousQuestions = useRef<Set<string>>(new Set());
  // Refs for stale-closure-safe game end
  const scoreRef = useRef(0);
  const levelRef = useRef(1);
  const correctRef = useRef(0);

  // Load High Score
  useEffect(() => {
    if (userId === "guest") return;
    fetch("/api/games/progress?game_type=math_master")
      .then((r) => r.json())
      .then((data) => {
        if (data.high_score) setHighScore(data.high_score);
      })
      .catch(() => {});
  }, [userId]);

  const generateQuestion = useCallback((level: number): Question => {
    let qText = "";
    let ans = 0;
    
    // Level determines difficulty
    const operators = ["+", "-"];
    if (level > 3) operators.push("*");
    if (level > 6) operators.push("/");

    let isUnique = false;
    let attempts = 0;

    while (!isUnique && attempts < 50) {
      const op = operators[Math.floor(Math.random() * operators.length)];
      let a = 1, b = 1;

      if (op === "+") {
        a = Math.floor(Math.random() * (10 + level * 5)) + 1;
        b = Math.floor(Math.random() * (10 + level * 5)) + 1;
        ans = a + b;
      } else if (op === "-") {
        a = Math.floor(Math.random() * (10 + level * 5)) + 5;
        b = Math.floor(Math.random() * a) + 1; // b is always <= a for positive answers
        ans = a - b;
      } else if (op === "*") {
        a = Math.floor(Math.random() * (5 + Math.floor(level / 2))) + 2;
        b = Math.floor(Math.random() * 9) + 2;
        ans = a * b;
      } else if (op === "/") {
        b = Math.floor(Math.random() * 9) + 2;
        ans = Math.floor(Math.random() * (5 + Math.floor(level / 2))) + 2;
        a = b * ans; // Ensure clean division
      }

      qText = `${a} ${op} ${b}`;
      if (!previousQuestions.current.has(qText)) {
        isUnique = true;
        previousQuestions.current.add(qText);
      }
      attempts++;
    }

    // Generate 3 wrong options close to the real answer
    const optionsSet = new Set<number>([ans]);
    while (optionsSet.size < 4) {
      const offset = Math.floor(Math.random() * 9) - 4; // -4 to +4
      if (offset !== 0 && ans + offset >= 0) {
        optionsSet.add(ans + offset);
      } else {
        // Fallback for edge cases
        optionsSet.add(ans + Math.floor(Math.random() * 10) + 1);
      }
    }

    const options = Array.from(optionsSet).sort(() => Math.random() - 0.5);
    return { text: qText, answer: ans, options };
  }, []);

  const initGame = useCallback(() => {
    setScore(0);
    setCurrentLevel(1);
    setLives(3);
    setCorrectAnswers(0);
    setStreak(0);
    setIsGameOver(false);
    previousQuestions.current.clear();
    setQuestion(generateQuestion(1));
    setTimeLeft(100);
    scoreRef.current = 0;
    levelRef.current = 1;
    correctRef.current = 0;
  }, [generateQuestion]);

  useEffect(() => {
    initGame();
  }, [initGame]);

  // Timer
  useEffect(() => {
    if (isGameOver || !question) return;

    timerRef.current = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          handleWrongAnswer();
          return 100; // Reset time after taking a life
        }
        // Hız seviyeye göre artar
        return prev - (0.5 + currentLevel * 0.1); 
      });
    }, 50);

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [isGameOver, question, currentLevel]);

  const handleWrongAnswer = () => {
    playSound("error");
    setStreak(0);
    setLives((prev) => {
      const newLives = prev - 1;
      if (newLives <= 0) {
        endGame();
      } else {
        setQuestion(generateQuestion(currentLevel));
        setTimeLeft(100);
      }
      return newLives;
    });
  };

  const handleAnswer = (selected: number) => {
    if (isGameOver || !question || selectedAnswer !== null) return;

    setSelectedAnswer(selected);

    if (selected === question.answer) {
      playSound("pop");
      const timeBonus = Math.floor(timeLeft / 10);
      const streakBonus = streak * 2;
      const points = 10 + timeBonus + streakBonus + (currentLevel * 2);
      
      // Uçan Puan Ekleme
      const btn = document.getElementById(`btn-${selected}`);
      if (btn) {
        const rect = btn.getBoundingClientRect();
        const newFloat = { 
          id: floatIdRef.current++, 
          x: rect.left + rect.width / 2, 
          y: rect.top - 20, 
          text: `+${points}` 
        };
        setFloatingText(prev => [...prev, newFloat]);
        setTimeout(() => {
          setFloatingText(prev => prev.filter(f => f.id !== newFloat.id));
        }, 800);
      }

      const newScore = score + points;
      setScore(newScore);
      scoreRef.current = newScore;
      setStreak((prev) => prev + 1);
      const newCorrect = correctAnswers + 1;
      setCorrectAnswers(newCorrect);
      correctRef.current = newCorrect;
      const newLevel = Math.floor(newCorrect / 5) + 1;
      levelRef.current = newLevel;

      setTimeout(() => {
        if (newLevel > currentLevel) {
          playSound("success");
          setCurrentLevel(newLevel);
          confetti({
            particleCount: 50,
            spread: 60,
            origin: { y: 0.7 },
            colors: ["#f43f5e", "#3b82f6", "#10b981"],
          });
        }
        setQuestion(generateQuestion(newLevel));
        setTimeLeft(100);
        setSelectedAnswer(null);
      }, 250);
    } else {
      playSound("error");
      setTimeout(() => {
        setSelectedAnswer(null);
        handleWrongAnswer();
      }, 300);
    }
  };

  const endGame = async () => {
    setIsGameOver(true);
    playSound("error");
    if (timerRef.current) clearInterval(timerRef.current);

    const finalScore = scoreRef.current;
    const finalLevel = levelRef.current;
    const finalCorrect = correctRef.current;

    if (userId !== "guest") {
      try {
        const res = await fetch("/api/games/progress", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ game_type: "math_master", score: finalScore, level: finalLevel }),
        });
        const data = await res.json();
        if (data.high_score != null) {
          setHighScore(data.high_score);
          setTimeout(() => setIsLeaderboardOpen(true), 800);
        }
      } catch {
    // ignore non-fatal audio/storage errors
  }

      try {
        await fetch("/api/games/finish", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            game_type: "math_master",
            user_id: userId,
            score: finalScore,
            stats: { level: finalLevel, correct: finalCorrect },
          }),
        });
      } catch {
    // ignore non-fatal audio/storage errors
  }
    }

    if (onGameEnd) onGameEnd(finalScore, { level: finalLevel, correct: finalCorrect });
  };

  return (
    <div className="w-full max-w-sm mx-auto select-none">
      {/* Header */}
      <div className="bg-gradient-to-br from-rose-600 to-pink-700 rounded-3xl p-4 mb-3 border border-rose-400/20 shadow-2xl shadow-rose-500/20">
        <div className="flex items-center justify-between mb-3">
          <div>
            <h2 className="text-lg font-black text-white flex items-center gap-2">
              🧮 Matematik Ustası
            </h2>
            <p className="text-xs font-bold text-rose-200">
              Seviye {currentLevel} · {streak > 1 ? `🔥 ${streak} Kombo!` : "Hızlı ol!"}
            </p>
          </div>
          <div className="flex flex-col items-end gap-1">
            {highScore > 0 && (
              <div className="bg-yellow-400/20 border border-yellow-300/30 rounded-xl px-2 py-1 text-center">
                <span className="text-[0.5rem] font-black text-yellow-200 block uppercase">Rekor</span>
                <span className="text-xs font-black text-yellow-300">🏆 {highScore}</span>
              </div>
            )}
            <div className="flex gap-1">
              {!isGameOver && (
                <button 
                  onClick={endGame}
                  className="tap-scale bg-rose-500/80 hover:bg-rose-500 border border-rose-400/50 rounded-xl px-2 py-1 text-xs font-bold text-white transition-colors flex items-center gap-1"
                >
                  🛑 Bitir
                </button>
              )}
              <button 
                onClick={() => setIsLeaderboardOpen(true)}
                className="tap-scale bg-white/10 hover:bg-white/20 border border-white/20 rounded-xl px-2 py-1 text-xs font-bold text-white transition-colors flex items-center gap-1"
              >
                🏅 Tablo
              </button>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-2">
          <div className="bg-white/10 rounded-xl p-2 text-center backdrop-blur-sm">
            <span className="text-[0.6rem] font-black text-rose-200 block uppercase">Puan</span>
            <span className="text-lg font-black text-white">{score}</span>
          </div>
          <div className="bg-white/10 rounded-xl p-2 text-center backdrop-blur-sm flex items-center justify-center gap-1 text-lg">
            {Array.from({ length: 3 }).map((_, i) => (
              <span key={i} className={i < lives ? "text-rose-300" : "text-black/20"}>
                ❤️
              </span>
            ))}
          </div>
        </div>
      </div>

      {/* Game Area */}
      <div className={`bg-slate-900 rounded-3xl p-4 border shadow-2xl mb-3 relative overflow-hidden transition-colors duration-300 ${
        timeLeft < 25 && !isGameOver ? "border-rose-500/50 bg-rose-950/20" : "border-slate-800"
      }`}>
        {/* Red Pulse Overlay when time is running out */}
        {timeLeft < 25 && !isGameOver && (
          <div className="absolute inset-0 bg-rose-500/10 animate-pulse pointer-events-none" />
        )}

        {/* Progress Bar */}
        <div className="absolute top-0 left-0 right-0 h-1.5 bg-slate-800">
          <div 
            className={`h-full transition-all duration-75 ${
              timeLeft > 50 ? "bg-emerald-500" : timeLeft > 25 ? "bg-amber-400" : "bg-rose-500"
            }`}
            style={{ width: `${timeLeft}%` }}
          />
        </div>

        <div className="mt-4 mb-8 text-center">
          <div className="text-[0.65rem] font-black text-slate-500 uppercase tracking-widest mb-1">
            Soru {correctAnswers + 1}
          </div>
          <div className="text-4xl sm:text-5xl font-black text-white tracking-wider">
            {question?.text} <span className="text-rose-500">= ?</span>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3 relative z-10">
          {question?.options.map((opt, i) => {
            let btnClass = "bg-slate-800 hover:bg-slate-700 active:bg-slate-600 border-slate-700";
            if (selectedAnswer !== null) {
              if (opt === question.answer && selectedAnswer === opt) {
                btnClass = "bg-emerald-500 border-emerald-400 scale-105";
              } else if (opt === selectedAnswer && selectedAnswer !== question.answer) {
                btnClass = "bg-rose-500 border-rose-400 animate-shake";
              } else if (opt === question.answer) {
                btnClass = "bg-emerald-500/50 border-emerald-400/50"; // Doğru cevabı göster
              }
            }

            return (
              <button
                key={i}
                id={`btn-${opt}`}
                disabled={isGameOver || selectedAnswer !== null}
                onClick={() => handleAnswer(opt)}
                className={`tap-scale border rounded-2xl py-4 text-2xl font-black text-white transition-all shadow-lg ${btnClass}`}
              >
                {opt}
              </button>
            );
          })}
        </div>

        {/* Floating Texts */}
        {floatingText.map((ft) => (
          <div
            key={ft.id}
            className="fixed pointer-events-none z-50 text-2xl font-black text-emerald-400 drop-shadow-md animate-in slide-in-from-bottom-5 fade-in duration-300"
            style={{ left: ft.x, top: ft.y, transform: 'translate(-50%, -100%)' }}
          >
            {ft.text}
          </div>
        ))}

        {/* Game Over Overlay */}
        {isGameOver && (
          <div className="absolute inset-0 z-20 bg-slate-950/95 backdrop-blur-sm flex flex-col items-center justify-center p-6 text-center animate-in zoom-in-95 duration-200">
            <div className="w-16 h-16 bg-gradient-to-br from-rose-500 to-red-600 rounded-3xl flex items-center justify-center mb-3 shadow-2xl shadow-rose-500/40 text-3xl">
              💥
            </div>
            <h3 className="text-xl font-black text-white mb-1">
              Oyun Bitti!
            </h3>
            <p className="text-xs text-rose-300 font-bold mb-4">
              {correctAnswers} doğru cevap verdin.
            </p>
            <div className="bg-white/5 rounded-2xl p-4 w-full mb-4 border border-white/10">
              <p className="text-[0.65rem] text-slate-400 font-bold uppercase mb-1">Final Skor</p>
              <p className="text-3xl font-black text-white">{score}</p>
              {highScore > 0 && score >= highScore && (
                <p className="text-xs font-black text-yellow-400 mt-1 animate-pulse">🏆 Yeni Rekor!</p>
              )}
            </div>

            <button
              type="button"
              onClick={initGame}
              className="tap-scale w-full bg-gradient-to-r from-rose-500 to-pink-600 text-white font-black py-3 rounded-xl shadow-lg hover:brightness-110 transition text-sm"
            >
              Tekrar Oyna 🔄
            </button>
          </div>
        )}
      </div>

      <LeaderboardModal
        isOpen={isLeaderboardOpen}
        onClose={() => setIsLeaderboardOpen(false)}
        gameType="math_master"
        gameTitle="Matematik Ustası"
        currentUserId={userId !== "guest" ? userId : undefined}
        currentScore={score > 0 ? score : highScore}
      />
    </div>
  );
}
