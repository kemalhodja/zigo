"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import confetti from "canvas-confetti";
import { MemoryCard } from "./memory-card";

// Seviyeler: Her seviyede farklı sayıda çift
const LEVELS = [
  { pairs: 4, icons: ["🚀", "⭐", "🌍", "☄️"] },
  { pairs: 6, icons: ["🚀", "⭐", "🌍", "☄️", "🪐", "👽"] },
  { pairs: 8, icons: ["🚀", "⭐", "🌍", "☄️", "🪐", "👽", "🔭", "🛸"] },
];

type Card = {
  id: string;
  icon: string;
  isFlipped: boolean;
  isMatched: boolean;
};

type ZihinAvcisiProps = {
  userId?: string;
  onGameEnd?: (score: number, stats: { time: number; moves: number }) => void;
};

function shuffleArray<T>(array: T[]): T[] {
  const newArray = [...array];
  for (let i = newArray.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [newArray[i], newArray[j]] = [newArray[j], newArray[i]];
  }
  return newArray;
}

export function ZihinAvcisi({ userId = "guest", onGameEnd }: ZihinAvcisiProps) {
  const [currentLevel, setCurrentLevel] = useState(0);
  const [startLevel, setStartLevel] = useState<number | null>(null); // Kaydedilen seviyeyi yükle
  const [cards, setCards] = useState<Card[]>([]);
  const [moves, setMoves] = useState(0);
  const [timeElapsed, setTimeElapsed] = useState(0);
  const [isGameFinished, setIsGameFinished] = useState(false);
  const [isLevelComplete, setIsLevelComplete] = useState(false);
  const [totalScore, setTotalScore] = useState(0);
  const [highScore, setHighScore] = useState(0);
  const [levelScore, setLevelScore] = useState(0);

  const [firstChoice, setFirstChoice] = useState<Card | null>(null);
  const [secondChoice, setSecondChoice] = useState<Card | null>(null);
  const [isLocked, setIsLocked] = useState(false);

  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const startTimeRef = useRef<number | null>(null);

  // Kaydedilen ilerlemeyi yükle
  useEffect(() => {
    if (userId === "guest") return;
    fetch("/api/games/progress?game_type=memory_card")
      .then((r) => r.json())
      .then((data) => {
        if (data.high_score) setHighScore(data.high_score);
        if (data.last_level) {
          setStartLevel(data.last_level);
          setCurrentLevel(Math.min(data.last_level, LEVELS.length - 1));
        }
      })
      .catch(() => {});
  }, [userId]);

  const initLevel = useCallback((lvlIndex: number) => {
    const level = LEVELS[lvlIndex % LEVELS.length];
    const pairs = [...level.icons, ...level.icons];
    const shuffled = shuffleArray(pairs).map((icon) => ({
      id: crypto.randomUUID(),
      icon,
      isFlipped: false,
      isMatched: false,
    }));

    setCards(shuffled);
    setMoves(0);
    setFirstChoice(null);
    setSecondChoice(null);
    setIsLocked(false);
    setIsLevelComplete(false);
    setIsGameFinished(false);
    setTimeElapsed(0);

    if (timerRef.current) clearInterval(timerRef.current);
    startTimeRef.current = Date.now();
    timerRef.current = setInterval(() => {
      if (startTimeRef.current) {
        setTimeElapsed(Math.floor((Date.now() - startTimeRef.current) / 1000));
      }
    }, 1000);
  }, []);

  // İlerleme yüklenmeden önce bekle
  useEffect(() => {
    if (userId !== "guest" && startLevel === null) return; // Henüz yüklenmedi
    initLevel(currentLevel);
    return () => { if (timerRef.current) clearInterval(timerRef.current); };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentLevel, startLevel]);

  const handleCardClick = (id: string) => {
    if (isLocked || isLevelComplete) return;

    const clickedCard = cards.find((c) => c.id === id);
    if (!clickedCard || clickedCard.isFlipped || clickedCard.isMatched) return;

    if (!firstChoice) {
      setFirstChoice(clickedCard);
      setCards((prev) => prev.map((c) => (c.id === id ? { ...c, isFlipped: true } : c)));
    } else if (firstChoice.id !== id && !secondChoice) {
      setIsLocked(true);
      setSecondChoice(clickedCard);
      setCards((prev) => prev.map((c) => (c.id === id ? { ...c, isFlipped: true } : c)));
      setMoves((prev) => prev + 1);
    }
  };

  useEffect(() => {
    if (!firstChoice || !secondChoice) return;

    if (firstChoice.icon === secondChoice.icon) {
      setCards((prev) =>
        prev.map((c) => (c.icon === firstChoice.icon ? { ...c, isMatched: true } : c))
      );
      setFirstChoice(null);
      setSecondChoice(null);
      setIsLocked(false);
    } else {
      const t = setTimeout(() => {
        setCards((prev) =>
          prev.map((c) =>
            c.id === firstChoice.id || c.id === secondChoice.id
              ? { ...c, isFlipped: false }
              : c
          )
        );
        setFirstChoice(null);
        setSecondChoice(null);
        setIsLocked(false);
      }, 900);
      return () => clearTimeout(t);
    }
  }, [firstChoice, secondChoice]);

  useEffect(() => {
    if (cards.length === 0) return;
    if (!cards.every((c) => c.isMatched)) return;

    if (timerRef.current) clearInterval(timerRef.current);
    setIsLevelComplete(true);

    const earned = Math.max(10, Math.floor(1000 / Math.max(1, timeElapsed)) - moves * 5);
    const newTotal = totalScore + earned;
    setLevelScore(earned);
    setTotalScore(newTotal);

    confetti({
      particleCount: 120,
      spread: 70,
      origin: { y: 0.6 },
      colors: ["#6366f1", "#a855f7", "#10b981", "#f59e0b"],
    });

    const isLast = currentLevel >= LEVELS.length - 1;
    if (isLast) {
      setIsGameFinished(true);
      saveProgress(newTotal, currentLevel);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [cards]);

  const saveProgress = async (score: number, level: number) => {
    if (userId === "guest") return;
    try {
      const res = await fetch("/api/games/progress", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ game_type: "memory_card", score, level }),
      });
      const data = await res.json();
      if (data.high_score) setHighScore(data.high_score);
    } catch {}

    try {
      await fetch("/api/games/finish", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          game_type: "memory_card",
          user_id: userId,
          score,
          stats: { time: timeElapsed, moves },
        }),
      });
    } catch {}

    if (onGameEnd) onGameEnd(score, { time: timeElapsed, moves });
  };

  const handleNextLevel = () => {
    const next = currentLevel + 1;
    saveProgress(totalScore, next);
    setCurrentLevel(next);
  };

  const handleRestart = () => {
    setTotalScore(0);
    setCurrentLevel(0);
    initLevel(0);
  };

  const formatTime = (s: number) =>
    `${Math.floor(s / 60)}:${(s % 60).toString().padStart(2, "0")}`;

  const level = LEVELS[currentLevel % LEVELS.length];
  const cols = level.pairs <= 4 ? 4 : level.pairs <= 6 ? 4 : 4;

  return (
    <div className="w-full max-w-sm mx-auto select-none">
      <style dangerouslySetInnerHTML={{
        __html: `
          .preserve-3d { transform-style: preserve-3d; }
          .backface-hidden { backface-visibility: hidden; -webkit-backface-visibility: hidden; }
          .rotate-y-180 { transform: rotateY(180deg); }
        `
      }} />

      {/* Header */}
      <div className="bg-gradient-to-br from-violet-600 to-indigo-700 rounded-3xl p-4 mb-3 shadow-2xl shadow-violet-500/30 border border-violet-400/20">
        <div className="flex items-center justify-between mb-3">
          <div>
            <h2 className="text-lg font-black text-white flex items-center gap-2">
              🧠 Zihin Avcısı
            </h2>
            <p className="text-xs font-bold text-violet-200">
              Seviye {currentLevel + 1} / {LEVELS.length} · {level.pairs} Çift
            </p>
          </div>
          {highScore > 0 && (
            <div className="bg-yellow-400/20 border border-yellow-300/30 rounded-2xl px-3 py-1.5 text-center">
              <span className="text-[0.55rem] font-black text-yellow-200 block uppercase tracking-wider">Rekor</span>
              <span className="text-sm font-black text-yellow-300">🏆 {highScore}</span>
            </div>
          )}
        </div>
        <div className="grid grid-cols-3 gap-2">
          <div className="bg-white/10 rounded-xl p-2 text-center backdrop-blur-sm">
            <span className="text-[0.6rem] font-black text-violet-200 block uppercase">Süre</span>
            <span className="text-sm font-black text-white">{formatTime(timeElapsed)}</span>
          </div>
          <div className="bg-white/10 rounded-xl p-2 text-center backdrop-blur-sm">
            <span className="text-[0.6rem] font-black text-violet-200 block uppercase">Hamle</span>
            <span className="text-sm font-black text-white">{moves}</span>
          </div>
          <div className="bg-white/20 rounded-xl p-2 text-center backdrop-blur-sm border border-white/20">
            <span className="text-[0.6rem] font-black text-violet-200 block uppercase">Puan</span>
            <span className="text-sm font-black text-white">{totalScore}</span>
          </div>
        </div>
      </div>

      {/* Game Grid */}
      <div className="bg-slate-900 rounded-3xl p-3 border border-slate-800 shadow-2xl mb-3">
        <div
          className="grid gap-2"
          style={{ gridTemplateColumns: `repeat(${cols}, minmax(0, 1fr))` }}
        >
          {cards.map((card) => (
            <MemoryCard
              key={card.id}
              id={card.id}
              icon={card.icon}
              isFlipped={card.isFlipped}
              isMatched={card.isMatched}
              onClick={handleCardClick}
            />
          ))}
        </div>
      </div>

      {/* Level Complete Overlay */}
      {isLevelComplete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4 animate-in fade-in duration-200">
          <div className="bg-gradient-to-br from-slate-900 to-slate-800 border border-white/10 rounded-3xl p-7 max-w-sm w-full text-center shadow-2xl animate-in zoom-in-95 duration-300">
            <div className="w-20 h-20 bg-gradient-to-br from-violet-500 to-indigo-600 rounded-3xl flex items-center justify-center mx-auto mb-4 shadow-2xl shadow-violet-500/40 text-4xl">
              {isGameFinished ? "🏆" : "⭐"}
            </div>
            <h3 className="text-2xl font-black text-white mb-1">
              {isGameFinished ? "Tüm Seviyeleri Bitirdin!" : `Seviye ${currentLevel + 1} Tamamlandı!`}
            </h3>
            <p className="text-sm text-slate-400 font-medium mb-5">
              {isGameFinished ? "Hafıza şampiyonusun! 🎉" : `Bu seviyede ${levelScore} puan kazandın!`}
            </p>

            <div className="grid grid-cols-3 gap-2 mb-5">
              <div className="bg-white/5 rounded-2xl p-3 border border-white/10">
                <p className="text-[0.6rem] font-bold text-slate-400 uppercase">Süre</p>
                <p className="text-base font-black text-violet-400">{formatTime(timeElapsed)}</p>
              </div>
              <div className="bg-white/5 rounded-2xl p-3 border border-white/10">
                <p className="text-[0.6rem] font-bold text-slate-400 uppercase">Hamle</p>
                <p className="text-base font-black text-indigo-400">{moves}</p>
              </div>
              <div className="bg-gradient-to-br from-emerald-500/20 to-teal-500/20 rounded-2xl p-3 border border-emerald-400/30">
                <p className="text-[0.6rem] font-bold text-emerald-400 uppercase">Puan</p>
                <p className="text-base font-black text-emerald-400">+{levelScore}</p>
              </div>
            </div>

            {isGameFinished ? (
              <button
                onClick={handleRestart}
                className="tap-scale w-full bg-gradient-to-r from-violet-500 to-indigo-600 text-white font-black py-3.5 rounded-2xl shadow-lg hover:brightness-110 transition text-sm"
              >
                Baştan Başla 🔄
              </button>
            ) : (
              <button
                onClick={handleNextLevel}
                className="tap-scale w-full bg-gradient-to-r from-emerald-500 to-teal-600 text-white font-black py-3.5 rounded-2xl shadow-lg hover:brightness-110 transition text-sm"
              >
                Sonraki Seviye → Seviye {currentLevel + 2} 🚀
              </button>
            )}
            <button
              onClick={handleRestart}
              className="tap-scale w-full mt-2 bg-white/5 text-slate-400 font-bold py-2.5 rounded-2xl hover:bg-white/10 transition text-xs border border-white/10"
            >
              Baştan Başla
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
