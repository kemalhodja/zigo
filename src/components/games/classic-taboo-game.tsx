"use client";

import confetti from "canvas-confetti";
import { useCallback, useEffect, useRef, useState } from "react";

import { useToast } from "@/components/ui/toast-system";
import { useAudio } from "@/hooks/use-audio";
import {
  getAvailableCategories,
  getRandomTabooCard,
  type TabooCard,
} from "@/lib/domain/taboo";

import { GameSoundToggle } from "./game-sound-toggle";

export function ClassicTabooGame() {
  const [gameState, setGameState] = useState<"setup" | "playing" | "round_end" | "game_over">("setup");
  
  // Game Settings
  const [timeSetting, setTimeSetting] = useState(60);
  const [selectedCategory, setSelectedCategory] = useState("Tümü");
  const [team1Name, setTeam1Name] = useState("Takım A");
  const [team2Name, setTeam2Name] = useState("Takım B");
  const [passLimit, setPassLimit] = useState(3);
  
  // Active Game State
  const [scores, setScores] = useState({ team1: 0, team2: 0 });
  const [currentTurn, setCurrentTurn] = useState<"team1" | "team2">("team1");
  const [round, setRound] = useState(1);
  const [timeLeft, setTimeLeft] = useState(timeSetting);
  const [currentCard, setCurrentCard] = useState<TabooCard | null>(null);
  const [passesLeft, setPassesLeft] = useState(passLimit);
  
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const playedIdsRef = useRef<string[]>([]);
  
  const { playSound } = useAudio();
  const toast = useToast();
  const categories = ["Tümü", ...getAvailableCategories()];

  // Cleanup timer on unmount
  useEffect(() => {
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, []);

  const nextCard = useCallback(() => {
    const card = getRandomTabooCard(playedIdsRef.current, selectedCategory);
    playedIdsRef.current.push(card.id);
    setCurrentCard(card);
  }, [selectedCategory]);

  const startRound = () => {
    setTimeLeft(timeSetting);
    setPassesLeft(passLimit);
    setGameState("playing");
    nextCard();
    
    if (timerRef.current) clearInterval(timerRef.current);
    timerRef.current = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          endRound();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  };

  const endRound = () => {
    if (timerRef.current) clearInterval(timerRef.current);
    playSound("error"); // Optional timeout sound
    setGameState("round_end");
  };

  const handleCorrect = () => {
    playSound("success");
    setScores(prev => ({
      ...prev,
      [currentTurn]: prev[currentTurn] + 1
    }));
    nextCard();
  };

  const handleTaboo = () => {
    playSound("error");
    setScores(prev => ({
      ...prev,
      [currentTurn]: prev[currentTurn] - 1
    }));
    nextCard();
  };

  const handlePass = () => {
    if (passesLeft > 0) {
      setPassesLeft(prev => prev - 1);
      nextCard();
    } else {
      toast.error("Pas hakkınız kalmadı!");
    }
  };

  const nextTurn = () => {
    if (currentTurn === "team1") {
      setCurrentTurn("team2");
    } else {
      // Both teams played this round
      if (round >= 3) {
        // End game after 3 rounds (example)
        setGameState("game_over");
        confetti({
          particleCount: 150,
          spread: 80,
          origin: { y: 0.6 },
          colors: ["#8b5cf6", "#ec4899", "#3b82f6", "#f59e0b"],
        });
      } else {
        setRound(prev => prev + 1);
        setCurrentTurn("team1");
      }
    }
    
    if (gameState !== "game_over") {
      setGameState("setup");
    }
  };

  const restartGame = () => {
    setScores({ team1: 0, team2: 0 });
    setRound(1);
    setCurrentTurn("team1");
    playedIdsRef.current = [];
    setGameState("setup");
  };

  return (
    <div className="w-full max-w-md mx-auto">
      {/* Header */}
      <div className="bg-gradient-to-br from-amber-500 to-orange-600 rounded-3xl p-4 mb-4 shadow-xl text-white shadow-orange-500/30">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-xl font-black flex items-center gap-2">
              👥 Klasik Tabu
            </h2>
            <p className="text-xs font-bold text-amber-100">
              Tur {round} / 3 · Sıra: <span className="font-black text-white">{currentTurn === "team1" ? team1Name : team2Name}</span>
            </p>
          </div>
          <div className="flex items-center gap-2">
            <GameSoundToggle />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div className={`bg-white/10 rounded-2xl p-3 text-center backdrop-blur-sm border-2 transition-all duration-300 ${currentTurn === "team1" ? "border-white shadow-inner scale-105" : "border-transparent opacity-70"}`}>
            <span className="text-[0.6rem] font-black text-amber-200 block uppercase tracking-wider">{team1Name}</span>
            <span className="text-3xl font-black text-white">{scores.team1}</span>
          </div>
          <div className={`bg-white/10 rounded-2xl p-3 text-center backdrop-blur-sm border-2 transition-all duration-300 ${currentTurn === "team2" ? "border-white shadow-inner scale-105" : "border-transparent opacity-70"}`}>
            <span className="text-[0.6rem] font-black text-amber-200 block uppercase tracking-wider">{team2Name}</span>
            <span className="text-3xl font-black text-white">{scores.team2}</span>
          </div>
        </div>
      </div>

      <div className="bg-white border-2 border-amber-100 rounded-[2rem] p-4 shadow-xl min-h-[400px] flex flex-col relative overflow-hidden">
        
        {/* SETUP SCREEN */}
        {gameState === "setup" && (
          <div className="flex-1 flex flex-col p-2">
            <h3 className="text-lg font-black text-slate-800 mb-4 text-center">
              Tur {round} - Sıra: <span className="text-amber-500">{currentTurn === "team1" ? team1Name : team2Name}</span>
            </h3>
            
            {round === 1 && currentTurn === "team1" && (
              <div className="space-y-4 mb-6 bg-amber-50 p-4 rounded-2xl border border-amber-100">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-black text-amber-700 mb-1">Takım 1</label>
                    <input 
                      type="text" 
                      value={team1Name}
                      onChange={e => setTeam1Name(e.target.value)}
                      className="w-full bg-white border border-amber-200 rounded-xl p-2 text-sm font-bold text-slate-700 focus:outline-none focus:border-amber-500"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-black text-amber-700 mb-1">Takım 2</label>
                    <input 
                      type="text" 
                      value={team2Name}
                      onChange={e => setTeam2Name(e.target.value)}
                      className="w-full bg-white border border-amber-200 rounded-xl p-2 text-sm font-bold text-slate-700 focus:outline-none focus:border-amber-500"
                    />
                  </div>
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-black text-amber-700 mb-1">Tur Süresi (Sn)</label>
                    <select 
                      value={timeSetting} 
                      onChange={e => setTimeSetting(Number(e.target.value))}
                      className="w-full bg-white border border-amber-200 rounded-xl p-2 text-sm font-bold text-slate-700 focus:outline-none focus:border-amber-500"
                    >
                      <option value={30}>30 Saniye</option>
                      <option value={60}>60 Saniye</option>
                      <option value={90}>90 Saniye</option>
                      <option value={120}>120 Saniye</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-black text-amber-700 mb-1">Pas Hakkı</label>
                    <select 
                      value={passLimit} 
                      onChange={e => setPassLimit(Number(e.target.value))}
                      className="w-full bg-white border border-amber-200 rounded-xl p-2 text-sm font-bold text-slate-700 focus:outline-none focus:border-amber-500"
                    >
                      <option value={0}>Yok</option>
                      <option value={1}>1 Pas</option>
                      <option value={2}>2 Pas</option>
                      <option value={3}>3 Pas</option>
                      <option value={5}>5 Pas</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-black text-amber-700 mb-1">Kategori</label>
                  <select 
                    value={selectedCategory} 
                    onChange={e => setSelectedCategory(e.target.value)}
                    className="w-full bg-white border border-amber-200 rounded-xl p-2 text-sm font-bold text-slate-700 focus:outline-none focus:border-amber-500"
                  >
                    {categories.map(c => <option key={c} value={c}>{c}</option>)}
                  </select>
                </div>
              </div>
            )}

            <div className="mt-auto">
              <button
                onClick={startRound}
                className="tap-scale w-full py-4 bg-gradient-to-r from-amber-500 to-orange-500 text-white rounded-2xl font-black text-lg shadow-lg shadow-amber-500/30 hover:shadow-xl hover:scale-[1.02] transition-all"
              >
                Turu Başlat 🚀
              </button>
            </div>
          </div>
        )}

        {/* PLAYING SCREEN */}
        {gameState === "playing" && currentCard && (
          <div className="flex-1 flex flex-col h-full">
            {/* Timer Row */}
            <div className="flex items-center justify-between mb-4">
              {/* Circular Timer */}
              <div className="relative w-16 h-16 flex items-center justify-center">
                <svg className="w-full h-full -rotate-90" viewBox="0 0 60 60">
                  <circle cx="30" cy="30" r="26" fill="none" stroke="rgba(0,0,0,0.08)" strokeWidth="5" />
                  <circle
                    cx="30" cy="30" r="26" fill="none"
                    stroke={timeLeft > timeSetting * 0.5 ? "#10b981" : timeLeft > timeSetting * 0.25 ? "#f59e0b" : "#ef4444"}
                    strokeWidth="5"
                    strokeLinecap="round"
                    strokeDasharray={`${2 * Math.PI * 26}`}
                    strokeDashoffset={`${2 * Math.PI * 26 * (1 - timeLeft / timeSetting)}`}
                    style={{ transition: "stroke-dashoffset 1s linear, stroke 0.5s" }}
                  />
                </svg>
                <span className={`absolute text-lg font-black ${timeLeft <= timeSetting * 0.25 ? "text-rose-500" : "text-slate-700"}`}>{timeLeft}</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-slate-500">Pas Hakkı:</span>
                {Array.from({ length: passLimit }).map((_, i) => (
                  <div key={i} className={`w-3 h-3 rounded-full ${i < passesLeft ? "bg-amber-400" : "bg-slate-200"}`} />
                ))}
              </div>
            </div>

            {/* Physical Card */}
            <div className="flex-1 flex flex-col mb-4 rounded-3xl overflow-hidden shadow-[0_8px_30px_rgba(0,0,0,0.18),0_2px_8px_rgba(0,0,0,0.12)] border border-slate-100">
              {/* Top - Target Word */}
              <div className="bg-gradient-to-br from-rose-500 to-red-600 flex items-center justify-center py-8 px-4">
                <h2 className="text-4xl sm:text-5xl font-black text-white text-center break-words uppercase tracking-wide drop-shadow-sm">
                  {currentCard.word}
                </h2>
              </div>
              {/* Divider */}
              <div className="bg-slate-800 h-2 w-full" />
              {/* Bottom - Forbidden Words */}
              <div className="bg-white flex-1 flex flex-col justify-center px-6 py-4">
                <div className="text-[0.65rem] font-black text-rose-500 uppercase tracking-widest text-center mb-3">⛔ Yasaklı Kelimeler</div>
                <div className="space-y-2">
                  {currentCard.forbidden.map((fw, i) => (
                    <div key={i} className="text-center font-bold text-xl text-slate-700 border-b border-dashed border-slate-200 last:border-0 pb-2 last:pb-0">
                      {fw}
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="grid grid-cols-3 gap-3">
              <button
                onClick={handleTaboo}
                className="tap-scale py-5 bg-rose-500 text-white rounded-2xl font-black shadow-lg shadow-rose-500/30 hover:bg-rose-600 active:scale-95 flex flex-col items-center justify-center gap-1 border-b-4 border-rose-700"
              >
                <span className="text-2xl">❌</span>
                <span className="text-xs uppercase tracking-wide">Tabu (-1)</span>
              </button>
              
              <button
                onClick={handlePass}
                disabled={passesLeft <= 0}
                className="tap-scale py-5 bg-slate-200 text-slate-600 rounded-2xl font-black shadow hover:bg-slate-300 active:scale-95 disabled:opacity-40 flex flex-col items-center justify-center gap-1 border-b-4 border-slate-400"
              >
                <span className="text-2xl">⏭️</span>
                <span className="text-xs uppercase tracking-wide">Pas</span>
              </button>

              <button
                onClick={handleCorrect}
                className="tap-scale py-5 bg-emerald-500 text-white rounded-2xl font-black shadow-lg shadow-emerald-500/30 hover:bg-emerald-600 active:scale-95 flex flex-col items-center justify-center gap-1 border-b-4 border-emerald-700"
              >
                <span className="text-2xl">✅</span>
                <span className="text-xs uppercase tracking-wide">Doğru (+1)</span>
              </button>
            </div>
          </div>
        )}

        {/* ROUND END */}
        {gameState === "round_end" && (
          <div className="flex-1 flex flex-col items-center justify-center text-center p-4">
            <div className="text-5xl mb-4">⏰</div>
            <h3 className="text-2xl font-black text-slate-800 mb-6">Süre Bitti!</h3>
            
            <p className="text-slate-600 mb-8 font-bold">
              Bu turdaki skorunuz güncellendi.
            </p>

            <button
              onClick={nextTurn}
              className="tap-scale w-full py-4 bg-slate-800 text-white rounded-2xl font-black text-lg shadow-lg hover:bg-slate-700 transition-all"
            >
              Devam Et ➔
            </button>
          </div>
        )}

        {/* GAME OVER */}
        {gameState === "game_over" && (
          <div className="flex-1 flex flex-col items-center justify-center text-center p-4 animate-in zoom-in-95">
            <div className="text-5xl mb-4">🏆</div>
            <h3 className="text-2xl font-black text-slate-800 mb-2">Oyun Bitti!</h3>
            
            <div className="bg-amber-50 rounded-2xl p-6 w-full mb-6 border-2 border-amber-100 space-y-4">
              <div className={`flex justify-between items-center ${scores.team1 > scores.team2 ? "text-amber-600 scale-110 font-black" : "text-slate-500 font-bold"}`}>
                <span>{team1Name}</span>
                <span className="text-2xl">{scores.team1}</span>
              </div>
              <div className="border-t border-amber-200 border-dashed"></div>
              <div className={`flex justify-between items-center ${scores.team2 > scores.team1 ? "text-amber-600 scale-110 font-black" : "text-slate-500 font-bold"}`}>
                <span>{team2Name}</span>
                <span className="text-2xl">{scores.team2}</span>
              </div>
            </div>

            <div className="mb-6">
              {scores.team1 > scores.team2 ? (
                <p className="text-xl font-black text-emerald-500">🎉 {team1Name} Kazandı!</p>
              ) : scores.team2 > scores.team1 ? (
                <p className="text-xl font-black text-emerald-500">🎉 {team2Name} Kazandı!</p>
              ) : (
                <p className="text-xl font-black text-slate-500">🤝 Berabere!</p>
              )}
            </div>
            
            <button
              onClick={restartGame}
              className="tap-scale w-full py-4 bg-gradient-to-r from-amber-500 to-orange-500 text-white rounded-2xl font-black text-lg shadow-lg hover:shadow-xl transition-all"
            >
              Yeni Oyun 🔄
            </button>
          </div>
        )}

      </div>
    </div>
  );
}
