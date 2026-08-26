"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import confetti from "canvas-confetti";
import { useAudio } from "@/hooks/use-audio";
import { useGameProgress } from "@/hooks/use-game-progress";
import { 
  TabooCard, 
  getRandomTabooCard, 
  getRandomDescription, 
  checkTabooGuess, 
  pointsForTaboo 
} from "@/lib/domain/taboo";
import { GameSoundToggle } from "./game-sound-toggle";
import { LeaderboardModal } from "./leaderboard-modal";

const ROUND_TIME = 60;

export function TabooGame({ userId = "guest" }: { userId?: string }) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [isGameOver, setIsGameOver] = useState(false);
  const [timeLeft, setTimeLeft] = useState(ROUND_TIME);
  const [score, setScore] = useState(0);
  const [combo, setCombo] = useState(0);
  
  const [currentCard, setCurrentCard] = useState<TabooCard | null>(null);
  const [currentDescription, setCurrentDescription] = useState("");
  const [guessInput, setGuessInput] = useState("");
  const [showHint, setShowHint] = useState(false);
  const [isError, setIsError] = useState(false);
  
  const { playSound } = useAudio();
  const { highScore, isLeaderboardOpen, setIsLeaderboardOpen, saveProgress } =
    useGameProgress({ gameType: "taboo", userId });
    
  const inputRef = useRef<HTMLInputElement>(null);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const scoreRef = useRef(0);
  const playedIdsRef = useRef<string[]>([]);

  // Start a new game
  const startGame = useCallback(() => {
    setScore(0);
    scoreRef.current = 0;
    setCombo(0);
    playedIdsRef.current = [];
    setTimeLeft(ROUND_TIME);
    setIsPlaying(true);
    setIsGameOver(false);
    nextCard();
    
    if (timerRef.current) clearInterval(timerRef.current);
    timerRef.current = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          endGame();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    
    setTimeout(() => {
      inputRef.current?.focus();
    }, 100);
  }, []);

  // Move to next card
  const nextCard = useCallback(() => {
    const card = getRandomTabooCard(playedIdsRef.current);
    playedIdsRef.current.push(card.id);
    
    setCurrentCard(card);
    setCurrentDescription(getRandomDescription(card));
    setGuessInput("");
    setShowHint(false);
    setIsError(false);
    inputRef.current?.focus();
  }, []);

  // End the game
  const endGame = useCallback(() => {
    setIsPlaying(false);
    setIsGameOver(true);
    if (timerRef.current) clearInterval(timerRef.current);
    void saveProgress(scoreRef.current, 1, { finalCombo: combo });
  }, [saveProgress, combo]);

  useEffect(() => {
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, []);

  // Handle guess submission
  const handleGuess = (e: React.FormEvent) => {
    e.preventDefault();
    if (!isPlaying || !currentCard || !guessInput.trim()) return;

    if (checkTabooGuess(guessInput, currentCard.word)) {
      // Correct guess
      playSound("success");
      const newCombo = combo + 1;
      setCombo(newCombo);
      
      const earned = pointsForTaboo(newCombo);
      scoreRef.current += earned;
      setScore(scoreRef.current);
      
      // Add bonus time (+3 seconds)
      setTimeLeft((prev) => Math.min(prev + 3, 90)); // cap at 90s
      
      confetti({
        particleCount: 50 + newCombo * 5,
        spread: 60,
        origin: { y: 0.8 },
        colors: ["#8b5cf6", "#ec4899", "#3b82f6"],
      });
      
      nextCard();
    } else {
      // Wrong guess
      playSound("error");
      setCombo(0);
      setIsError(true);
      setTimeout(() => setIsError(false), 400);
      // Briefly flash input red or just clear it
      // For a smoother experience, don't clear immediately, let user edit
    }
  };

  return (
    <div className="w-full max-w-md mx-auto">
      {/* Header */}
      <div className="bg-gradient-to-br from-violet-600 to-fuchsia-600 rounded-3xl p-4 mb-4 shadow-xl text-white">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-xl font-black flex items-center gap-2">
              🗣️ Zigo Tabu
            </h2>
            <p className="text-xs font-bold text-violet-200">
              Yapay Zekaya Karşı
            </p>
          </div>
          <div className="flex items-center gap-2">
            <GameSoundToggle />
            <button
              onClick={() => setIsLeaderboardOpen(true)}
              className="tap-scale bg-white/20 hover:bg-white/30 rounded-xl px-3 py-1.5 text-sm font-bold transition"
            >
              🏅 Rekorlar
            </button>
            {isPlaying && (
              <button
                onClick={endGame}
                className="tap-scale bg-rose-500 hover:bg-rose-600 rounded-xl px-2 py-1.5 text-sm font-bold transition"
              >
                🛑
              </button>
            )}
          </div>
        </div>

        <div className="grid grid-cols-3 gap-2">
          <div className="bg-white/10 rounded-xl p-2 text-center backdrop-blur-sm">
            <span className="text-[0.6rem] font-black text-violet-200 block uppercase tracking-wider">Süre</span>
            <span className={`text-2xl font-black ${timeLeft <= 10 ? 'text-rose-400 animate-pulse' : 'text-white'}`}>
              {timeLeft}s
            </span>
          </div>
          <div className="bg-white/10 rounded-xl p-2 text-center backdrop-blur-sm">
            <span className="text-[0.6rem] font-black text-violet-200 block uppercase tracking-wider">Puan</span>
            <span className="text-2xl font-black text-white">{score}</span>
          </div>
          <div className="bg-white/10 rounded-xl p-2 text-center backdrop-blur-sm">
            <span className="text-[0.6rem] font-black text-violet-200 block uppercase tracking-wider">Kombo</span>
            <span className="text-2xl font-black text-white">x{combo}</span>
          </div>
        </div>
      </div>

      {/* Game Area */}
      <div className="bg-white border-2 border-violet-100 rounded-[2rem] p-4 shadow-xl min-h-[300px] flex flex-col relative overflow-hidden">
        
        {!isPlaying && !isGameOver && (
          <div className="flex-1 flex flex-col items-center justify-center text-center p-4">
            <div className="text-6xl mb-4">🤖</div>
            <h3 className="text-lg font-black text-slate-800 mb-2">Zigo AI Seni Sınamaya Hazır!</h3>
            <p className="text-sm font-bold text-slate-500 mb-6">
              Sana bazı kelimeleri tarif edeceğim. Tabii ki yasaklı kelimeleri kullanmadan... Bakalım ne kadar hızlısın?
            </p>
            <button
              onClick={startGame}
              className="tap-scale w-full py-4 bg-gradient-to-r from-violet-600 to-fuchsia-600 text-white rounded-2xl font-black text-lg shadow-lg shadow-violet-500/30 hover:shadow-xl hover:scale-[1.02] transition-all"
            >
              Oyuna Başla ▶️
            </button>
          </div>
        )}

        {isGameOver && (
          <div className="flex-1 flex flex-col items-center justify-center text-center p-4 animate-in zoom-in-95">
            <div className="text-5xl mb-4">⏱️</div>
            <h3 className="text-2xl font-black text-slate-800 mb-1">Süre Bitti!</h3>
            <p className="text-sm font-bold text-slate-500 mb-4">Harika bir performans sergiledin.</p>
            
            <div className="bg-violet-50 rounded-2xl p-4 w-full mb-6 border-2 border-violet-100">
              <p className="text-xs font-black text-violet-400 uppercase mb-1">Final Skor</p>
              <p className="text-4xl font-black text-violet-700">{score}</p>
              {score > 0 && score >= highScore && (
                <p className="text-sm font-black text-amber-500 mt-2 animate-bounce">👑 YENİ REKOR!</p>
              )}
            </div>
            
            <button
              onClick={startGame}
              className="tap-scale w-full py-4 bg-gradient-to-r from-violet-600 to-fuchsia-600 text-white rounded-2xl font-black text-lg shadow-lg shadow-violet-500/30 hover:shadow-xl hover:scale-[1.02] transition-all"
            >
              Tekrar Oyna 🔄
            </button>
          </div>
        )}

        {isPlaying && currentCard && (
          <div className="flex-1 flex flex-col">
            {/* AI Message Bubble */}
            <div className="flex gap-3 mb-6">
              <div className="w-10 h-10 rounded-full bg-violet-100 flex items-center justify-center text-xl shrink-0 border border-violet-200 shadow-sm">
                🤖
              </div>
              <div className="bg-violet-50 border border-violet-100 rounded-2xl rounded-tl-sm p-4 text-slate-700 font-bold text-sm shadow-sm relative">
                <span className="text-[0.6rem] font-black text-violet-400 absolute -top-2 bg-white px-1.5 rounded border border-violet-100">Zigo AI</span>
                "{currentDescription}"
              </div>
            </div>

            {/* Hint Box (Forbidden Words) */}
            <div className="mb-6 flex-1 flex flex-col justify-end">
              {!showHint ? (
                <button
                  type="button"
                  onClick={() => setShowHint(true)}
                  className="tap-scale mx-auto block text-xs font-black text-amber-500 bg-amber-50 px-4 py-2 rounded-xl border-2 border-amber-200 border-dashed hover:bg-amber-100 transition"
                >
                  💡 Yasaklı Kelimeleri Göster (İpucu)
                </button>
              ) : (
                <div className="bg-amber-50 border-2 border-amber-200 rounded-xl p-3 animate-in fade-in slide-in-from-bottom-2">
                  <p className="text-[0.65rem] font-black text-amber-600 uppercase mb-2 text-center">Bu Kelimeler Yasak</p>
                  <div className="flex flex-wrap justify-center gap-1.5">
                    {currentCard.forbidden.map((fw, i) => (
                      <span key={i} className="bg-white text-slate-600 px-2.5 py-1 rounded-lg text-xs font-bold shadow-sm border border-amber-100 line-through decoration-rose-400 decoration-2">
                        {fw}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Input Area */}
            <form onSubmit={handleGuess} className="relative mt-auto">
              <input
                ref={inputRef}
                type="text"
                value={guessInput}
                onChange={(e) => {
                  setGuessInput(e.target.value);
                  if (isError) setIsError(false);
                }}
                placeholder="Kelimeyi tahmin et..."
                className={`w-full border-2 rounded-2xl py-4 pl-4 pr-24 text-lg font-black text-slate-800 placeholder:text-slate-400 focus:outline-none transition-colors ${
                  isError 
                    ? "border-rose-500 bg-rose-50" 
                    : "border-slate-200 bg-slate-50 focus:border-violet-500 focus:bg-white"
                }`}
                autoComplete="off"
                spellCheck="false"
              />
              <button
                type="button"
                onClick={() => {
                  playSound("error");
                  setCombo(0);
                  nextCard();
                }}
                title="Pas Geç (Kombo sıfırlanır)"
                className="absolute right-12 top-2 bottom-2 px-3 bg-slate-200 text-slate-600 rounded-xl font-black text-xs hover:bg-slate-300 transition-colors tap-scale flex items-center"
              >
                PAS
              </button>
              <button
                type="submit"
                disabled={!guessInput.trim()}
                className="absolute right-2 top-2 bottom-2 aspect-square bg-violet-600 text-white rounded-xl font-black flex items-center justify-center disabled:opacity-50 disabled:bg-slate-300 hover:bg-violet-700 transition-colors tap-scale"
              >
                ➔
              </button>
            </form>
          </div>
        )}
      </div>

      <LeaderboardModal
        isOpen={isLeaderboardOpen}
        onClose={() => setIsLeaderboardOpen(false)}
        gameType="taboo"
        gameTitle="Zigo Tabu"
        currentUserId={userId !== "guest" ? userId : undefined}
        currentScore={score > 0 ? score : highScore}
      />
    </div>
  );
}
