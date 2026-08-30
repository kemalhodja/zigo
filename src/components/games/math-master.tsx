"use client";

import confetti from "canvas-confetti";
import { useCallback, useEffect, useRef,useState } from "react";

import { useAudio } from "@/hooks/use-audio";
import { useGameProgress } from "@/hooks/use-game-progress";

import { GameSoundToggle } from "./game-sound-toggle";
import { LeaderboardModal } from "./leaderboard-modal";

type MathMasterProps = {
  userId?: string;
  onGameEnd?: (score: number, stats: { level: number; correct: number }) => void;
};

type Mode = "classic" | "grade8";

type Question = {
  text: string;
  answer: number;
  options: number[];
  topic?: string;
};

const SUPERSCRIPT: Record<string, string> = {
  "0": "⁰", "1": "¹", "2": "²", "3": "³", "4": "⁴",
  "5": "⁵", "6": "⁶", "7": "⁷", "8": "⁸", "9": "⁹",
};

function sup(n: number): string {
  return String(n).split("").map((ch) => SUPERSCRIPT[ch] ?? ch).join("");
}

function gcd(a: number, b: number): number {
  while (b !== 0) {
    [a, b] = [b, a % b];
  }
  return a;
}

// MEB 8. sınıf kazanımları (M.8.1.x) için Pisagor üçlüleri
const PISAGOR_TRIPLES: [number, number, number][] = [
  [3, 4, 5], [6, 8, 10], [5, 12, 13], [9, 12, 15], [8, 15, 17],
];

type Grade8Topic =
  | "uslu" | "uslukural" | "ebob" | "ekok"
  | "karekok" | "kokdis" | "denklem" | "pisagor";

const TOPIC_LABEL: Record<Grade8Topic, string> = {
  uslu: "Üslü İfadeler",
  uslukural: "Üslü Kurallar",
  ebob: "EBOB",
  ekok: "EKOK",
  karekok: "Kareköklü İfadeler",
  kokdis: "Kök Dışı Alma",
  denklem: "Doğrusal Denklem",
  pisagor: "Pisagor (Üçgenler)",
};

function randInt(min: number, max: number, rng: () => number = Math.random): number {
  return min + Math.floor(rng() * (max - min + 1));
}

function makeOptions(ans: number): number[] {
  const set = new Set<number>([ans]);
  const spread = Math.max(3, Math.round(Math.abs(ans) * 0.2));
  let guard = 0;
  while (set.size < 4 && guard++ < 100) {
    const off = randInt(-spread, spread);
    const v = off === 0 ? ans + spread : ans + off;
    if (v >= 0 && v !== ans) set.add(v);
  }
  let pad = 1;
  while (set.size < 4) {
    const v = ans + spread + pad++;
    if (v !== ans && v >= 0) set.add(v);
  }
  return Array.from(set).sort(() => Math.random() - 0.5);
}

type Grade8Question = { text: string; answer: number; topic: Grade8Topic };

function genGrade8Question(level: number): Grade8Question {
  const pool: Grade8Topic[] = ["uslu", "ebob"];
  if (level >= 2) pool.push("ekok");
  if (level >= 3) pool.push("karekok");
  if (level >= 4) pool.push("denklem");
  if (level >= 5) pool.push("pisagor");
  if (level >= 6) pool.push("uslukural");
  if (level >= 7) pool.push("kokdis");
  const topic = pool[Math.floor(Math.random() * pool.length)];

  switch (topic) {
    case "uslu": {
      const base = randInt(2, level > 3 ? 9 : 6);
      const exp = randInt(2, level > 4 ? 4 : 3);
      return { text: `${base}${sup(exp)} = ?`, answer: Math.pow(base, exp), topic };
    }
    case "uslukural": {
      const base = [2, 3, 5][randInt(0, 2)];
      const m = randInt(2, 5);
      const n = randInt(2, 5);
      if (Math.random() < 0.5) {
        return {
          text: `${base}${sup(m)} · ${base}${sup(n)} = ${base}ᵏ , k = ?`,
          answer: m + n,
          topic,
        };
      }
      return {
        text: `(${base}${sup(m)})${sup(n)} = ${base}ᵏ , k = ?`,
        answer: m * n,
        topic,
      };
    }
    case "ebob":
    case "ekok": {
      const a = randInt(8, 36);
      const b = randInt(8, 36);
      const g = gcd(a, b);
      return topic === "ebob"
        ? { text: `EBOB(${a}, ${b}) = ?`, answer: g, topic }
        : { text: `EKOK(${a}, ${b}) = ?`, answer: (a * b) / g, topic };
    }
    case "karekok": {
      const k = randInt(4, 15);
      return { text: `√${k * k} = ?`, answer: k, topic };
    }
    case "kokdis": {
      const r = [2, 3, 5][randInt(0, 2)];
      const k = randInt(2, 9);
      return { text: `√${k * k * r} = k√${r} ise k = ?`, answer: k, topic };
    }
    case "denklem": {
      const x = randInt(2, 12);
      const a = randInt(2, 9);
      if (Math.random() < 0.6) {
        const b = randInt(1, 20);
        return { text: `${a}x + ${b} = ${a * x + b} , x = ?`, answer: x, topic };
      }
      const b = a * x - randInt(1, a * x - 1);
      return { text: `${a}x - ${b} = ${a * x - b} , x = ?`, answer: x, topic };
    }
    case "pisagor": {
      const [a0, b0, c0] = PISAGOR_TRIPLES[randInt(0, PISAGOR_TRIPLES.length - 1)];
      const scale = Math.random() < 0.5 ? 1 : 2;
      return {
        text: `Dik kenarları ${a0 * scale} ve ${b0 * scale} olan üçgenin hipotenüsü ?`,
        answer: c0 * scale,
        topic,
      };
    }
  }
}

export function MathMaster({ userId = "guest", onGameEnd }: MathMasterProps) {
  const [mode, setMode] = useState<Mode | null>(null);
  const [currentLevel, setCurrentLevel] = useState(1);
  const [score, setScore] = useState(0);
  const [lives, setLives] = useState(3);
  const [isGameOver, setIsGameOver] = useState(false);
  const [question, setQuestion] = useState<Question | null>(null);
  const [timeLeft, setTimeLeft] = useState(100);
  const [correctAnswers, setCorrectAnswers] = useState(0);
  const [streak, setStreak] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const [isShaking, setIsShaking] = useState(false);

  const { playSound } = useAudio();
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const previousQuestions = useRef<Set<string>>(new Set());
  // Refs for stale-closure-safe game end
  const scoreRef = useRef(0);
  const levelRef = useRef(1);
  const correctRef = useRef(0);
  const livesRef = useRef(3);
  const zeroHandledRef = useRef(false);
  const answeringRef = useRef(false);
  const endedRef = useRef(false);

  const {
    highScore,
    isLeaderboardOpen,
    setIsLeaderboardOpen,
    saveProgress,
  } = useGameProgress({ gameType: "math_master", userId });

  // UI States for Polish
  const [selectedAnswer, setSelectedAnswer] = useState<number | null>(null);
  const [floatingText, setFloatingText] = useState<{ id: number; x: number; y: number; text: string }[]>([]);
  const floatIdRef = useRef(0);

  const generateQuestion = useCallback((level: number, activeMode: Mode): Question => {
    if (activeMode === "grade8") {
      const g8 = genGrade8Question(level);
      return { text: g8.text, answer: g8.answer, topic: TOPIC_LABEL[g8.topic], options: makeOptions(g8.answer) };
    }

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

  const initGame = useCallback((activeMode: Mode) => {
    setScore(0);
    setCurrentLevel(1);
    setLives(3);
    livesRef.current = 3;
    setCorrectAnswers(0);
    setStreak(0);
    setIsGameOver(false);
    setIsPaused(false);
    previousQuestions.current.clear();
    setQuestion(generateQuestion(1, activeMode));
    setTimeLeft(100);
    zeroHandledRef.current = false;
    scoreRef.current = 0;
    levelRef.current = 1;
    correctRef.current = 0;
  }, [generateQuestion]);

  useEffect(() => {
    if (mode) initGame(mode);
  }, [mode, initGame]);

  // Timer — yalnızca süreyi azaltır, yan etki içermez
  // 8. sınıf modu: MEB soruları daha uzun düşünmeyi gerektirdiği için süre 3 kat yavaş akar
  useEffect(() => {
    if (isGameOver || isPaused || !question) return;

    const drainDivisor = mode === "grade8" ? 3 : 1;
    timerRef.current = setInterval(() => {
      setTimeLeft((prev) => Math.max(0, prev - (0.5 + currentLevel * 0.1) / drainDivisor));
    }, 50);

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [isGameOver, isPaused, question, currentLevel, mode]);

  // Süre bitince can kaybı (updater dışında, tek seferlik)
  useEffect(() => {
    if (isGameOver || isPaused || !question) return;
    if (timeLeft <= 0 && !zeroHandledRef.current) {
      zeroHandledRef.current = true;
      handleWrongAnswer();
    }
  }, [timeLeft, isGameOver, isPaused, question, currentLevel]);

  const handleWrongAnswer = () => {
    playSound("error");
    setStreak(0);
    setIsShaking(true);
    setTimeout(() => setIsShaking(false), 500);
    
    if (typeof navigator !== "undefined" && navigator.vibrate) {
      navigator.vibrate([40, 40, 40]); // Heavy double vibrate
    }
    
    const newLives = livesRef.current - 1;
    livesRef.current = newLives;
    setLives(newLives);
    if (newLives <= 0) {
      endGame();
    } else {
      setQuestion(generateQuestion(currentLevel, mode ?? "classic"));
      setTimeLeft(100);
      zeroHandledRef.current = false;
    }
  };

  const handleAnswer = (selected: number) => {
    if (answeringRef.current || isGameOver || isPaused || !question || selectedAnswer !== null) return;
    answeringRef.current = true;

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
        setQuestion(generateQuestion(newLevel, mode ?? "classic"));
        setTimeLeft(100);
        zeroHandledRef.current = false;
        setSelectedAnswer(null);
        answeringRef.current = false;
      }, 250);
    } else {
      playSound("error");
      setTimeout(() => {
        setSelectedAnswer(null);
        answeringRef.current = false;
        handleWrongAnswer();
      }, 300);
    }
  };

  const endGame = async () => {
    if (endedRef.current) return;
    endedRef.current = true;
    setIsGameOver(true);
    playSound("error");
    if (timerRef.current) clearInterval(timerRef.current);

    const finalScore = scoreRef.current;
    const finalLevel = levelRef.current;
    const finalCorrect = correctRef.current;

    await saveProgress(finalScore, finalLevel, { level: finalLevel, correct: finalCorrect, mode });

    if (onGameEnd) onGameEnd(finalScore, { level: finalLevel, correct: finalCorrect });
  };

  useEffect(() => {
    const onVisibility = () => {
      if (document.hidden && !isGameOver) setIsPaused(true);
    };
    document.addEventListener("visibilitychange", onVisibility);
    return () => document.removeEventListener("visibilitychange", onVisibility);
  }, [isGameOver]);

  if (mode === null) {
    return (
      <div className="w-full max-w-sm mx-auto p-6 bg-slate-900 rounded-3xl border border-slate-800 shadow-2xl text-center select-none">
        <h2 className="text-2xl font-black text-white mb-1">🧮 Matematik Ustası</h2>
        <p className="text-sm font-bold text-slate-400 mb-6">Hangi modda oynamak istersin?</p>
        <div className="flex flex-col gap-3">
          <button
            type="button"
            onClick={() => setMode("classic")}
            className="tap-scale w-full bg-gradient-to-r from-rose-500 to-pink-600 text-white font-black py-4 rounded-xl shadow-lg hover:brightness-110 transition"
          >
            ♾️ Klasik Mod
            <span className="block text-[0.62rem] font-bold text-white/80 mt-0.5">
              Hızlanan dört işlem maratonu
            </span>
          </button>
          <button
            type="button"
            onClick={() => setMode("grade8")}
            className="tap-scale w-full bg-gradient-to-r from-indigo-500 to-blue-600 text-white font-black py-4 rounded-xl shadow-lg hover:brightness-110 transition"
          >
            🎓 8. Sınıf Modu
            <span className="block text-[0.62rem] font-bold text-white/80 mt-0.5">
              MEB müfredatı: Üslü · Karekök · EBOB-EKOK · Denklem · Pisagor
            </span>
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className={`w-full max-w-sm mx-auto select-none ${isShaking ? "animate-shake" : ""}`}>
      <style dangerouslySetInnerHTML={{ __html: `
        @keyframes overdriveGrid {
          from { background-position: 0 0, 0 0, 0 0; }
          to { background-position: 0 0, 0 0, 0 30px; }
        }
      `}} />
      {/* Header */}
      <div className="bg-gradient-to-br from-rose-600 to-pink-700 rounded-3xl p-4 mb-3 border border-rose-400/20 shadow-2xl shadow-rose-500/20">
        <div className="flex items-center justify-between mb-3">
          <div>
            <h2 className="text-lg font-black text-white flex items-center gap-2">
              🧮 Matematik Ustası
            </h2>
            <p className="text-xs font-bold text-rose-200">
              {mode === "grade8"
                ? `🎓 8. Sınıf · Seviye ${currentLevel}`
                : `Seviye ${currentLevel} · ${streak > 1 ? `🔥 ${streak} Kombo!` : "Hızlı ol!"}`}
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
              {!isGameOver && !isPaused && (
                <button
                  onClick={() => setIsPaused(true)}
                  aria-label="Oyunu duraklat"
                  title="Duraklat"
                  className="tap-scale bg-white/10 hover:bg-white/20 border border-white/20 rounded-xl px-2 py-1 text-xs font-bold text-white transition-colors"
                >
                  ⏸️
                </button>
              )}
              <GameSoundToggle />
              {!isGameOver && (
                <button 
                  onClick={endGame}
                  aria-label="Oyunu bitir"
                  className="tap-scale bg-rose-500/80 hover:bg-rose-500 border border-rose-400/50 rounded-xl px-2 py-1 text-xs font-bold text-white transition-colors flex items-center gap-1"
                >
                  🛑 Bitir
                </button>
              )}
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

        <div className="grid grid-cols-2 gap-2">
          <div className={`rounded-xl p-2 text-center backdrop-blur-sm transition-all duration-300 ${
            streak >= 3 
              ? "bg-gradient-to-r from-orange-500 to-rose-600 shadow-lg shadow-orange-500/50 scale-105" 
              : "bg-white/10"
          }`}>
            <span className="text-[0.6rem] font-black text-white block uppercase">
              {streak >= 3 ? `🔥 KOMBO x${streak}` : "Puan"}
            </span>
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
      <div className={`bg-slate-900 rounded-3xl p-4 border shadow-2xl mb-3 relative overflow-hidden transition-all duration-300 ${
        timeLeft < 25 && !isGameOver ? "border-rose-500 shadow-[inset_0_0_80px_rgba(225,29,72,0.4)]" : 
        streak >= 5 ? "border-fuchsia-500 shadow-[0_0_40px_rgba(217,70,239,0.4)]" : "border-slate-800"
      }`}>
        {/* Red Pulse Overlay when time is running out */}
        {timeLeft < 25 && !isGameOver && (
          <div className="absolute inset-0 bg-rose-500/10 animate-pulse pointer-events-none" />
        )}

        {/* Overdrive Grid Background */}
        {streak >= 5 && !isGameOver && (
          <div className="absolute inset-0 pointer-events-none mix-blend-screen opacity-50 z-0 flex flex-col justify-end">
            <div className="w-full h-[150%] bg-gradient-to-t from-fuchsia-600/30 to-transparent absolute bottom-0 left-0" />
            <div 
              className="w-full h-full absolute bottom-0 left-0 perspective-[500px]"
              style={{
                backgroundImage: "linear-gradient(transparent 0%, rgba(217,70,239,0.5) 100%), linear-gradient(90deg, rgba(217,70,239,0.4) 1px, transparent 1px), linear-gradient(rgba(217,70,239,0.4) 1px, transparent 1px)",
                backgroundSize: "100% 100%, 30px 30px, 30px 30px",
                animation: "overdriveGrid 0.5s linear infinite",
                transformOrigin: "bottom",
                transform: "rotateX(45deg) scale(1.5)"
              }}
            />
          </div>
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

        <div className="mt-4 mb-8 text-center relative z-10">
          <div className="text-[0.65rem] font-black text-slate-500 uppercase tracking-widest mb-1">
            Soru {correctAnswers + 1}
          </div>
          {question?.topic && (
            <div className="inline-block mb-2 text-[0.58rem] font-black uppercase tracking-wider bg-white/10 border border-white/10 text-slate-300 px-2 py-0.5 rounded-md">
              📚 {question.topic}
            </div>
          )}
          <div className="text-4xl sm:text-5xl font-black text-white tracking-wider">
            {question?.text} {!question?.topic && <span className="text-rose-500">= ?</span>}
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3 relative z-10">
          {question?.options.map((opt, i) => {
            const KAHOOT_COLORS = [
              { base: "bg-rose-600 border-rose-700 hover:bg-rose-500", correct: "bg-emerald-500 border-emerald-600", wrong: "bg-rose-800 border-rose-900 opacity-70", shape: "△" },
              { base: "bg-blue-600 border-blue-700 hover:bg-blue-500", correct: "bg-emerald-500 border-emerald-600", wrong: "bg-blue-900 border-blue-900 opacity-70", shape: "□" },
              { base: "bg-amber-500 border-amber-600 hover:bg-amber-400", correct: "bg-emerald-500 border-emerald-600", wrong: "bg-amber-800 border-amber-900 opacity-70", shape: "◯" },
              { base: "bg-emerald-600 border-emerald-700 hover:bg-emerald-500", correct: "bg-emerald-400 border-emerald-500", wrong: "bg-emerald-900 border-emerald-900 opacity-70", shape: "♥" },
            ];
            const color = KAHOOT_COLORS[i];
            let btnClass = color.base;
            if (selectedAnswer !== null) {
              if (opt === question.answer) btnClass = color.correct + " scale-105 shadow-lg";
              else if (opt === selectedAnswer) btnClass = color.wrong + " animate-shake";
              else btnClass = color.base + " opacity-40";
            }

            return (
              <button
                key={i}
                id={`btn-${opt}`}
                disabled={isGameOver || selectedAnswer !== null}
                onClick={() => handleAnswer(opt)}
                className={`tap-scale border-b-4 rounded-2xl py-4 text-2xl font-black text-white transition-all shadow-lg ${btnClass} flex items-center justify-center gap-2`}
              >
                <span className="text-base opacity-70">{color.shape}</span>
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

        {/* Pause Overlay */}
        {isPaused && !isGameOver && (
          <div className="absolute inset-0 z-20 bg-slate-950/95 backdrop-blur-sm flex flex-col items-center justify-center p-6 text-center animate-in zoom-in-95 duration-200 rounded-3xl">
            <div className="w-16 h-16 bg-gradient-to-br from-violet-500 to-indigo-600 rounded-3xl flex items-center justify-center mb-3 shadow-2xl shadow-violet-500/40 text-3xl">
              ⏸
            </div>
            <h3 className="text-xl font-black text-white mb-1">
              Oyun Duraklatıldı
            </h3>
            <p className="text-xs text-slate-400 font-bold mb-4">
              Süre durduruldu. Hazır olduğunda devam et!
            </p>
            <button
              type="button"
              onClick={() => setIsPaused(false)}
              className="tap-scale w-full bg-gradient-to-r from-emerald-500 to-teal-600 text-white font-black py-3 rounded-xl shadow-lg hover:brightness-110 transition text-sm"
            >
              ▶ Devam Et
            </button>
            <button
              type="button"
              onClick={() => initGame(mode ?? "classic")}
              className="tap-scale w-full mt-2 bg-white/5 text-slate-400 font-bold py-2.5 rounded-xl hover:bg-white/10 transition text-xs border border-white/10"
            >
              Baştan Başla
            </button>
          </div>
        )}

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
              {highScore > 0 && score > highScore && (
                <p className="text-xs font-black text-yellow-400 mt-1 animate-pulse">🏆 Yeni Rekor!</p>
              )}
            </div>

            <button
              type="button"
              onClick={() => initGame(mode ?? "classic")}
              className="tap-scale w-full bg-gradient-to-r from-rose-500 to-pink-600 text-white font-black py-3 rounded-xl shadow-lg hover:brightness-110 transition text-sm"
            >
              Tekrar Oyna 🔄
            </button>
            <button
              type="button"
              onClick={() => setMode(null)}
              className="tap-scale w-full mt-2 bg-white/5 text-slate-400 font-bold py-2.5 rounded-xl hover:bg-white/10 transition text-xs border border-white/10"
            >
              🎓 Mod Değiştir
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


