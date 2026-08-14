"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import { MemoryCard } from "./memory-card";

const ICONS = ["🚀", "🪐", "⭐", "🔭", "🌍", "👽", "☄️", "🛸"];
const PAIRS = [...ICONS, ...ICONS];

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

// Shuffle function
function shuffleArray<T>(array: T[]): T[] {
  const newArray = [...array];
  for (let i = newArray.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [newArray[i], newArray[j]] = [newArray[j], newArray[i]];
  }
  return newArray;
}

export function ZihinAvcisi({ userId = "guest", onGameEnd }: ZihinAvcisiProps) {
  const [cards, setCards] = useState<Card[]>([]);
  const [moves, setMoves] = useState(0);
  const [startTime, setStartTime] = useState<number | null>(null);
  const [timeElapsed, setTimeElapsed] = useState(0);
  const [isGameFinished, setIsGameFinished] = useState(false);
  const [score, setScore] = useState<number | null>(null);
  
  // Selection state
  const [firstChoice, setFirstChoice] = useState<Card | null>(null);
  const [secondChoice, setSecondChoice] = useState<Card | null>(null);
  const [isLocked, setIsLocked] = useState(false);
  
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  // Initialize Game
  const initGame = useCallback(() => {
    const shuffledCards = shuffleArray(PAIRS).map((icon) => ({
      id: crypto.randomUUID(),
      icon,
      isFlipped: false,
      isMatched: false,
    }));
    
    setCards(shuffledCards);
    setMoves(0);
    setFirstChoice(null);
    setSecondChoice(null);
    setIsGameFinished(false);
    setScore(null);
    setTimeElapsed(0);
    setStartTime(Date.now());
    
    if (timerRef.current) clearInterval(timerRef.current);
    timerRef.current = setInterval(() => {
      setStartTime((prevStartTime) => {
        if (prevStartTime) {
          setTimeElapsed(Math.floor((Date.now() - prevStartTime) / 1000));
        }
        return prevStartTime;
      });
    }, 1000);
  }, []);

  // Run once on mount
  useEffect(() => {
    initGame();
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [initGame]);

  // Handle Card Click
  const handleCardClick = (id: string) => {
    if (isLocked || isGameFinished) return;
    
    const clickedCard = cards.find((c) => c.id === id);
    if (!clickedCard || clickedCard.isFlipped || clickedCard.isMatched) return;

    if (!firstChoice) {
      setFirstChoice(clickedCard);
      setCards((prev) =>
        prev.map((c) => (c.id === id ? { ...c, isFlipped: true } : c))
      );
    } else if (firstChoice.id !== id && !secondChoice) {
      setSecondChoice(clickedCard);
      setCards((prev) =>
        prev.map((c) => (c.id === id ? { ...c, isFlipped: true } : c))
      );
      setMoves((prev) => prev + 1);
    }
  };

  // Evaluate Match
  useEffect(() => {
    if (firstChoice && secondChoice) {
      setIsLocked(true);
      
      if (firstChoice.icon === secondChoice.icon) {
        // Match!
        setCards((prev) =>
          prev.map((c) => {
            if (c.icon === firstChoice.icon) {
              return { ...c, isMatched: true };
            }
            return c;
          })
        );
        resetTurn();
      } else {
        // No match - hide after 1 second
        setTimeout(() => {
          setCards((prev) =>
            prev.map((c) => {
              if (c.id === firstChoice.id || c.id === secondChoice.id) {
                return { ...c, isFlipped: false };
              }
              return c;
            })
          );
          resetTurn();
        }, 1000);
      }
    }
  }, [firstChoice, secondChoice]);

  // Check Game End
  useEffect(() => {
    if (cards.length > 0 && cards.every((c) => c.isMatched)) {
      if (timerRef.current) clearInterval(timerRef.current);
      setIsGameFinished(true);
      
      // Calculate score: (1000 / Süre) - (Hamle Sayısı * 5)
      // We'll adjust it to be a more positive number generally.
      const rawScore = Math.floor(10000 / Math.max(1, timeElapsed)) - (moves * 10);
      const finalScore = Math.max(10, rawScore); // Minimum 10 points
      setScore(finalScore);
      
      // Send API Request
      handleGameFinish(finalScore, timeElapsed, moves);
    }
  }, [cards, timeElapsed, moves]);

  const resetTurn = () => {
    setFirstChoice(null);
    setSecondChoice(null);
    setIsLocked(false);
  };

  const handleGameFinish = async (finalScore: number, timeTaken: number, movesMade: number) => {
    try {
      await fetch("/api/games/finish", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          game_type: "memory_card",
          user_id: userId,
          score: finalScore,
          stats: { time: timeTaken, moves: movesMade },
        }),
      });
      console.log("Oyun skoru başarıyla gönderildi:", finalScore);
      
      if (onGameEnd) {
        onGameEnd(finalScore, { time: timeTaken, moves: movesMade });
      }
    } catch (error) {
      console.error("Skor gönderme hatası:", error);
    }
  };

  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m}:${s.toString().padStart(2, "0")}`;
  };

  return (
    <div className="w-full max-w-xl mx-auto p-4 sm:p-6 bg-slate-50 rounded-3xl border border-slate-200 shadow-sm">
      {/* Required CSS for 3D Flips */}
      <style dangerouslySetInnerHTML={{__html: `
        .preserve-3d { transform-style: preserve-3d; }
        .backface-hidden { backface-visibility: hidden; }
        .rotate-y-180 { transform: rotateY(180deg); }
      `}} />

      {/* Header / HUD */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-xl font-black text-indigo-900 flex items-center gap-2">
            <span>🧠</span> Zihin Avcısı
          </h2>
          <p className="text-xs font-bold text-slate-500 mt-1">Görsel Hafıza Egzersizi</p>
        </div>
        <div className="flex gap-4">
          <div className="bg-white px-3 py-1.5 rounded-xl shadow-xs border border-slate-100 flex flex-col items-center">
            <span className="text-[0.65rem] font-black uppercase text-slate-400">Süre</span>
            <span className="text-sm font-black text-night">{formatTime(timeElapsed)}</span>
          </div>
          <div className="bg-white px-3 py-1.5 rounded-xl shadow-xs border border-slate-100 flex flex-col items-center">
            <span className="text-[0.65rem] font-black uppercase text-slate-400">Hamle</span>
            <span className="text-sm font-black text-night">{moves}</span>
          </div>
        </div>
      </div>

      {/* Game Grid */}
      <div className="grid grid-cols-4 gap-2 sm:gap-4 mb-6">
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

      {/* Actions */}
      <div className="flex justify-center">
        <button
          onClick={initGame}
          className="tap-scale bg-white border border-slate-200 text-night text-xs font-black px-4 py-2 rounded-xl shadow-xs hover:bg-slate-50 transition"
        >
          Yeniden Başlat 🔄
        </button>
      </div>

      {/* Game Over Overlay */}
      {isGameFinished && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm animate-in fade-in duration-300 p-4">
          <div className="bg-white rounded-3xl p-8 max-w-sm w-full text-center shadow-2xl animate-in zoom-in-95 duration-300">
            <div className="w-20 h-20 bg-gradient-to-br from-indigo-100 to-purple-100 rounded-full flex items-center justify-center mx-auto mb-4 border-4 border-white shadow-md text-4xl">
              🎉
            </div>
            <h3 className="text-2xl font-black text-night mb-2">Harika İş Çıkardın!</h3>
            <p className="text-sm text-slate-500 font-medium mb-6">
              Hafızanı başarıyla test ettin. İşte sonuçların:
            </p>
            
            <div className="grid grid-cols-2 gap-3 mb-6">
              <div className="bg-slate-50 p-3 rounded-2xl border border-slate-100">
                <p className="text-xs font-bold text-slate-400 uppercase">Toplam Süre</p>
                <p className="text-lg font-black text-indigo-600">{formatTime(timeElapsed)}</p>
              </div>
              <div className="bg-slate-50 p-3 rounded-2xl border border-slate-100">
                <p className="text-xs font-bold text-slate-400 uppercase">Hamle Sayısı</p>
                <p className="text-lg font-black text-purple-600">{moves}</p>
              </div>
              <div className="col-span-2 bg-gradient-to-r from-emerald-500 to-teal-500 p-3 rounded-2xl text-white shadow-lg shadow-emerald-500/20">
                <p className="text-xs font-bold text-emerald-100 uppercase">Kazanılan Zigo Puanı</p>
                <p className="text-2xl font-black">+{score}</p>
              </div>
            </div>

            <button
              onClick={initGame}
              className="tap-scale w-full bg-night text-white font-black py-3.5 rounded-xl shadow-md hover:bg-slate-800 transition"
            >
              Tekrar Oyna
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
