"use client";

import confetti from "canvas-confetti";
import { useCallback, useEffect, useRef,useState } from "react";

import { useAudio } from "@/hooks/use-audio";
import { useGameProgress } from "@/hooks/use-game-progress";

import { GameSoundToggle } from "./game-sound-toggle";
import { LeaderboardModal } from "./leaderboard-modal";
import { WORD_DICTIONARY, type WordEntry } from "./word-dictionary";
import { bestKeyState, evaluateGuess, type LetterState } from "./wordle-logic";

const ROWS = 6;
type Lang = "TR" | "EN";

type WordHuntProps = {
  userId?: string;
  onGameEnd?: (score: number, stats: { level: number }) => void;
};

export function WordHunt({ userId = "guest", onGameEnd }: WordHuntProps) {
  const [selectedLang, setSelectedLang] = useState<Lang | null>(null);
  const [_validWords, setValidWords] = useState<Record<number, Set<string>> | null>(null);
  
  const [currentLevel, setCurrentLevel] = useState(1);
  const [targetWordObj, setTargetWordObj] = useState<WordEntry | null>(null);
  const [guesses, setGuesses] = useState<string[]>(Array(ROWS).fill(""));
  const [currentRow, setCurrentRow] = useState(0);
  const [isGameOver, setIsGameOver] = useState(false);
  const [hasWon, setHasWon] = useState(false);
  const [score, setScore] = useState(0);
  
  const [shakeRow, setShakeRow] = useState(-1);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const { playSound } = useAudio();
  const keyboardRef = useRef<HTMLDivElement>(null);
  const winLatchRef = useRef(false);
  const validWordsRef = useRef<Record<number, Set<string>> | null>(null);

  const {
    highScore,
    isLeaderboardOpen,
    setIsLeaderboardOpen,
    saveProgress,
  } = useGameProgress({ gameType: "word_hunt", userId });

  const targetWord = targetWordObj?.word || "";
  const targetMeaning = targetWordObj?.meaning || "";
  const cols = targetWord.length || 5;

  useEffect(() => {
    if (userId === "guest") return;
    fetch(`/api/games/progress?game_type=word_hunt`)
      .then((r) => r.json())
      .then((data) => {
        if (data.last_level) setCurrentLevel(data.last_level);
      })
      .catch(() => {});
  }, [userId]);

  const initLevel = useCallback((level: number, lang: Lang) => {
    let wordLen = 4;
    if (level >= 3 && level <= 5) wordLen = 5;
    if (level >= 6) wordLen = 6;
    
    const wordList = WORD_DICTIONARY[lang][wordLen];
    const wordObj = wordList[Math.floor(Math.random() * wordList.length)];
    
    setTargetWordObj(wordObj);
    setGuesses(Array(ROWS).fill(""));
    setCurrentRow(0);
    setIsGameOver(false);
    setHasWon(false);
    setShakeRow(-1);
    setToastMessage(null);
  }, []);

  useEffect(() => {
    if (selectedLang) {
      initLevel(currentLevel, selectedLang);
      
      // Fetch the dictionary for the selected language
      fetch(`/dictionaries/${selectedLang.toLowerCase()}-words.json`)
        .then(res => res.json())
        .then((data: Record<string, string[]>) => {
          const parsedDict: Record<number, Set<string>> = {};
          for (const [len, words] of Object.entries(data)) {
            parsedDict[parseInt(len, 10)] = new Set(words.map(w => w.toLocaleLowerCase(selectedLang === "TR" ? "tr-TR" : "en-US")));
          }
          setValidWords(parsedDict);
          validWordsRef.current = parsedDict; // Always keep ref in sync
        })
        .catch(err => {
          console.error("Failed to load dictionary", err);
        });
    }
  }, [currentLevel, selectedLang, initLevel]);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    playSound("error");
    setTimeout(() => setToastMessage(null), 2000);
  };

  const isValidWord = (guess: string, lang: Lang, wordLen: number): boolean => {
    // Sözlük dosyamız çok kısıtlı (sadece hedef kelimeleri içeriyor) olduğu için
    // oyuncunun deneme yapmasını engellememek adına tüm tahminleri geçerli sayıyoruz.
    return true;
  };

  const onKeyPress = useCallback((key: string) => {
    if (isGameOver || !selectedLang || !targetWord) return;
    playSound("pop");

    if (key === "ENTER") {
      if (guesses[currentRow].length !== cols) {
        setShakeRow(currentRow);
        showToast(selectedLang === "TR" ? "Yeterli harf yok" : "Not enough letters");
        setTimeout(() => setShakeRow(-1), 500);
        return;
      }
      
      const guess = guesses[currentRow];
      
      if (!isValidWord(guess, selectedLang, cols)) {
        setShakeRow(currentRow);
        showToast(selectedLang === "TR" ? "Sözlükte bulunamadı" : "Not in dictionary");
        setTimeout(() => setShakeRow(-1), 500);
        return;
      }

      if (guess === targetWord) {
        if (winLatchRef.current || isGameOver) return;
        winLatchRef.current = true;
        setHasWon(true);
        setIsGameOver(true);
        playSound("success");
        
        const earned = Math.max(10, 100 - currentRow * 15);
        const newScore = score + earned;
        setScore(newScore);

        confetti({
          particleCount: 100,
          spread: 70,
          origin: { y: 0.6 },
          colors: ["#10b981", "#34d399", "#f59e0b"],
        });

        saveGameProgress(newScore, currentLevel + 1);
      } else {
        if (currentRow === ROWS - 1) {
          setIsGameOver(true);
          playSound("error");
          showToast(targetWord);
          saveGameProgress(score, currentLevel);
        } else {
          setCurrentRow(prev => prev + 1);
        }
      }
    } else if (key === "BACKSPACE") {
      setGuesses((prev) => {
        const newGuesses = [...prev];
        newGuesses[currentRow] = newGuesses[currentRow].slice(0, -1);
        return newGuesses;
      });
    } else {
      if (guesses[currentRow].length < cols) {
        setGuesses((prev) => {
          const newGuesses = [...prev];
          newGuesses[currentRow] += key;
          return newGuesses;
        });
      }
    }
  }, [currentRow, guesses, isGameOver, playSound, targetWord, score, currentLevel, cols, selectedLang]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (isLeaderboardOpen || isGameOver) return;
      if (e.ctrlKey || e.metaKey || e.altKey || !selectedLang) return;
      
      const key = selectedLang === "TR" ? e.key.toLocaleUpperCase("tr-TR") : e.key.toUpperCase();
      if (key === "ENTER") {
        e.preventDefault();
        onKeyPress("ENTER");
      }
      else if (key === "BACKSPACE") {
        e.preventDefault();
        onKeyPress("BACKSPACE");
      }
      else if (/^[A-ZÇĞİÖŞÜ]$/.test(key)) onKeyPress(key);
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [onKeyPress, selectedLang, isLeaderboardOpen, isGameOver]);

  const saveGameProgress = (finalScore: number, newLevel: number) => {
    void saveProgress(finalScore, newLevel, { level: newLevel });
    if (onGameEnd) onGameEnd(finalScore, { level: newLevel });
  };

  // İki aşamalı değerlendirme wordle-logic.ts'te test edilir
  const getLetterStates = (guess: string): LetterState[] => evaluateGuess(targetWord, guess);

  const getLetterState = (guess: string, index: number): LetterState => {
    if (!guess) return "empty";
    return getLetterStates(guess)[index];
  };

  const getKeyColor = (key: string) => {
    const collected: LetterState[] = [];
    // Only evaluate SUBMITTED rows (i < currentRow), never the active row
    for (let i = 0; i < currentRow; i++) {
      const guess = guesses[i];
      if (!guess || guess.length !== cols) continue;
      for (let j = 0; j < cols; j++) {
        if (guess[j] === key) {
          collected.push(getLetterState(guess, j));
        }
      }
    }
    if (collected.includes("correct")) return "bg-emerald-500 border-emerald-600 text-white";
    const state = bestKeyState(collected);
    if (state === "present") return "bg-amber-500 border-amber-600 text-white";
    if (state === "absent") return "bg-slate-700 border-slate-800 text-slate-400";
    return "bg-slate-800 border-slate-700 text-white hover:bg-slate-700 active:bg-slate-600";
  };

  const KEYBOARD_TR = [
    ["E", "R", "T", "Y", "U", "I", "O", "P", "Ğ", "Ü"],
    ["A", "S", "D", "F", "G", "H", "J", "K", "L", "Ş", "İ"],
    ["ENTER", "Z", "C", "V", "B", "N", "M", "Ö", "Ç", "BACKSPACE"]
  ];

  const KEYBOARD_EN = [
    ["Q", "W", "E", "R", "T", "Y", "U", "I", "O", "P"],
    ["A", "S", "D", "F", "G", "H", "J", "K", "L"],
    ["ENTER", "Z", "X", "C", "V", "B", "N", "M", "BACKSPACE"]
  ];

  const keyboardRows = selectedLang === "EN" ? KEYBOARD_EN : KEYBOARD_TR;

  if (!selectedLang) {
    return (
      <div className="w-full max-w-sm mx-auto p-6 bg-slate-900 rounded-3xl border border-slate-800 shadow-2xl text-center">
        <h2 className="text-2xl font-black text-white mb-6">🔤 Word Hunt<br/><span className="text-sm text-teal-400">Kelime Avı</span></h2>
        <p className="text-sm font-bold text-slate-400 mb-6">Hangi dilde oynamak istersin?<br/>Choose your language</p>
        
        <div className="flex flex-col gap-3">
          <button 
            onClick={() => setSelectedLang("TR")}
            className="w-full bg-gradient-to-r from-teal-500 to-emerald-600 text-white font-black py-4 rounded-xl shadow-lg hover:brightness-110 transition text-lg"
          >
            🇹🇷 Türkçe
          </button>
          <button 
            onClick={() => setSelectedLang("EN")}
            className="w-full bg-gradient-to-r from-indigo-500 to-blue-600 text-white font-black py-4 rounded-xl shadow-lg hover:brightness-110 transition text-lg"
          >
            🇬🇧 English
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full max-w-sm mx-auto select-none relative">
      <style dangerouslySetInnerHTML={{
        __html: `
          @keyframes flipIn {
            0% { transform: rotateX(0deg); opacity: 1; }
            45% { transform: rotateX(-90deg); opacity: 0.3; }
            55% { transform: rotateX(-90deg); opacity: 0.3; }
            100% { transform: rotateX(0deg); opacity: 1; }
          }
          .animate-flip { animation: flipIn 0.5s ease forwards; }
          @keyframes shake {
            0%, 100% { transform: translateX(0); }
            20% { transform: translateX(-8px); }
            40% { transform: translateX(8px); }
            60% { transform: translateX(-6px); }
            80% { transform: translateX(6px); }
          }
          .animate-shake { animation: shake 0.45s ease-in-out; }
          @keyframes letterPop {
            0% { transform: scale(1); }
            50% { transform: scale(1.18); }
            100% { transform: scale(1); }
          }
          .animate-pop { animation: letterPop 0.12s ease-out; }
          @keyframes winBounce {
            0%, 100% { transform: translateY(0); }
            25% { transform: translateY(-12px); }
            50% { transform: translateY(-6px); }
            75% { transform: translateY(-10px); }
          }
        `
      }} />

      {/* Header */}
      <div className="bg-gradient-to-br from-teal-600 to-emerald-700 rounded-3xl p-4 mb-3 border border-teal-400/20 shadow-2xl shadow-teal-500/20">
        <div className="flex items-center justify-between mb-3">
          <div>
            <h2 className="text-lg font-black text-white flex items-center gap-2">
              🔤 {selectedLang === "TR" ? "Kelime Avı" : "Word Hunt"}
            </h2>
            <p className="text-xs font-bold text-teal-200">
              {selectedLang === "TR" ? "Seviye" : "Level"} {currentLevel}
            </p>
          </div>
          <div className="flex flex-col items-end gap-1">
            {highScore > 0 && (
              <div className="bg-yellow-400/20 border border-yellow-300/30 rounded-xl px-2 py-1 text-center">
                <span className="text-[0.5rem] font-black text-yellow-200 block uppercase">{selectedLang === "TR" ? "Rekor" : "Best"}</span>
                <span className="text-xs font-black text-yellow-300">🏆 {highScore}</span>
              </div>
            )}
            <div className="flex gap-1">
              {!isGameOver && (
                <button 
                  onClick={() => {
                    setIsGameOver(true);
                    setHasWon(false);
                    saveGameProgress(score, currentLevel);
                  }}
                  aria-label="Oyunu bitir"
                  className="tap-scale bg-rose-500/80 hover:bg-rose-500 border border-rose-400/50 rounded-xl px-2 py-1 text-xs font-bold text-white transition-colors flex items-center gap-1"
                >
                  🛑 {selectedLang === "TR" ? "Bitir" : "Finish"}
                </button>
              )}
              <GameSoundToggle />
              <button 
                onClick={() => setIsLeaderboardOpen(true)}
                aria-label="Liderlik tablosunu aç"
                className="tap-scale bg-white/10 hover:bg-white/20 border border-white/20 rounded-xl px-2 py-1 text-xs font-bold text-white transition-colors flex items-center gap-1"
              >
                🏅 {selectedLang === "TR" ? "Tablo" : "Ranks"}
              </button>
            </div>
          </div>
        </div>
        <div className="bg-white/10 rounded-xl p-2 text-center backdrop-blur-sm">
          <span className="text-[0.6rem] font-black text-teal-200 block uppercase">{selectedLang === "TR" ? "Toplam Puan" : "Total Score"}</span>
          <span className="text-lg font-black text-white">{score}</span>
        </div>
      </div>

      {/* Grid */}
      <div className="bg-slate-900 rounded-3xl p-4 border border-slate-800 shadow-2xl mb-3 flex flex-col items-center gap-2 relative">
        {toastMessage && (
          <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 bg-white text-black font-black px-4 py-2 rounded-xl shadow-2xl z-20 animate-in fade-in zoom-in duration-200 text-center whitespace-nowrap">
            {toastMessage}
          </div>
        )}

        {guesses.map((guess, i) => {
          const isCurrentRow = i === currentRow;
          const isSubmitted = i < currentRow;
          const isWinRow = hasWon && i === currentRow - 1;
          
          return (
            <div 
              key={i} 
              className={`flex gap-2 ${shakeRow === i ? "animate-shake" : ""}`}
            >
              {Array.from({ length: cols }).map((_, j) => {
                const letter = guess[j] || "";
                let bgClass = "bg-slate-800 border-slate-700 text-white";
                let flipDelay = {};
                let extraClass = "";
                
                if (letter && isCurrentRow) {
                  bgClass = "bg-slate-800 border-white/70 text-white border-2";
                  extraClass = "animate-pop";
                } else if (isSubmitted) {
                  const state = getLetterState(guess, j);
                  flipDelay = { animationDelay: `${j * 150}ms` };
                  if (state === "correct") {
                    bgClass = isWinRow
                      ? "bg-emerald-500 border-emerald-600 text-white animate-flip"
                      : "bg-emerald-500 border-emerald-600 text-white animate-flip";
                  } else if (state === "present") {
                    bgClass = "bg-amber-500 border-amber-600 text-white animate-flip";
                  } else {
                    bgClass = "bg-slate-600 border-slate-700 text-slate-300 animate-flip";
                  }
                }

                let boxSize = "w-11 h-11 sm:w-14 sm:h-14";
                if (cols > 5) boxSize = "w-9 h-9 sm:w-12 sm:h-12";
                if (cols > 6) boxSize = "w-8 h-8 sm:w-10 sm:h-10";

                const winBounceDelay = isWinRow ? { animationDelay: `${j * 100 + 700}ms` } : {};

                return (
                  <div
                    key={j}
                    className={`${boxSize} flex items-center justify-center rounded-xl border-2 text-2xl font-black uppercase transition-colors ${bgClass} ${extraClass} ${isWinRow ? "animate-[winBounce_0.6s_ease_forwards]" : ""}`}
                    style={{ ...flipDelay, ...winBounceDelay }}
                  >
                    {letter}
                  </div>
                );
              })}
            </div>
          );
        })}
      </div>

      {/* Keyboard */}
      <div ref={keyboardRef} className="bg-slate-900 rounded-3xl p-3 border border-slate-800 shadow-2xl mb-3">
        {keyboardRows.map((row, i) => (
          <div key={i} className="flex justify-center gap-1 sm:gap-1.5 mb-1.5 last:mb-0">
            {row.map((key) => {
              const isAction = key === "ENTER" || key === "BACKSPACE";
              return (
                <button
                  key={key}
                  onClick={() => onKeyPress(key)}
                  className={`tap-scale border-b-4 rounded-xl flex items-center justify-center font-black transition-colors ${
                    isAction ? "w-11 sm:w-16 h-10 sm:h-12 text-[0.6rem] sm:text-[0.65rem] bg-slate-700 border-slate-800 text-white" : `w-[1.9rem] sm:w-10 h-10 sm:h-12 text-lg ${getKeyColor(key)}`
                  }`}
                >
                  {key === "BACKSPACE" ? "⌫" : key === "ENTER" ? (selectedLang === "TR" ? "GİR" : "ENT") : key}
                </button>
              );
            })}
          </div>
        ))}
      </div>

      {/* Game Over Overlay */}
      {isGameOver && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-950/90 backdrop-blur-sm p-4 animate-in fade-in duration-200">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 w-full max-w-sm text-center shadow-2xl">
            <div className={`w-16 h-16 rounded-3xl flex items-center justify-center mx-auto mb-4 text-3xl shadow-xl ${
              hasWon ? "bg-emerald-500 shadow-emerald-500/40" : "bg-rose-500 shadow-rose-500/40"
            }`}>
              {hasWon ? "🎉" : "💔"}
            </div>
            <h3 className="text-xl font-black text-white mb-2">
              {hasWon 
                ? (selectedLang === "TR" ? "Tebrikler!" : "Congratulations!") 
                : (selectedLang === "TR" ? "Maalesef Bilemedin" : "Game Over")}
            </h3>
            <p className="text-sm text-slate-400 font-bold mb-4">
              {selectedLang === "TR" ? "Kelime:" : "Word:"} <span className="text-emerald-400 uppercase tracking-widest text-lg ml-1">{targetWord}</span>
            </p>

            <div className="bg-white/5 border border-white/10 rounded-xl p-3 mb-4 text-left">
              <span className="text-[0.6rem] font-black text-slate-400 block uppercase mb-1">{selectedLang === "TR" ? "ANLAMI" : "MEANING"}</span>
              <p className="text-sm text-white font-semibold leading-relaxed">
                {targetMeaning}
              </p>
            </div>
            
            <button
              onClick={() => {
                if (hasWon) {
                  setCurrentLevel(prev => prev + 1);
                } else {
                  initLevel(currentLevel, selectedLang);
                }
              }}
              className={`tap-scale w-full text-white font-black py-3 rounded-xl shadow-lg transition text-sm ${
                hasWon ? "bg-gradient-to-r from-emerald-500 to-teal-600 hover:brightness-110" : "bg-gradient-to-r from-slate-700 to-slate-600 hover:bg-slate-600"
              }`}
            >
              {hasWon 
                ? (selectedLang === "TR" ? `Seviye ${currentLevel + 1}'e Geç 🚀` : `Next Level ${currentLevel + 1} 🚀`) 
                : (selectedLang === "TR" ? "Tekrar Dene 🔄" : "Try Again 🔄")}
            </button>
          </div>
        </div>
      )}

      <LeaderboardModal
        isOpen={isLeaderboardOpen}
        onClose={() => setIsLeaderboardOpen(false)}
        gameType="word_hunt"
        gameTitle={selectedLang === "TR" ? "Kelime Avı" : "Word Hunt"}
        currentUserId={userId !== "guest" ? userId : undefined}
        currentScore={score > 0 ? score : highScore}
      />
    </div>
  );
}
