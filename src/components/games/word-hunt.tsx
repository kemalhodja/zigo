"use client";

import confetti from "canvas-confetti";
import { useCallback, useEffect, useRef, useState } from "react";

import { useAudio } from "@/hooks/use-audio";
import { useGameProgress } from "@/hooks/use-game-progress";

import { GameSoundToggle } from "./game-sound-toggle";
import { LeaderboardModal } from "./leaderboard-modal";
import { WORD_DICTIONARY, type WordEntry } from "./word-dictionary";
import { bestKeyState, evaluateGuess, type LetterState } from "./wordle-logic";

const ROWS = 6;
type Lang = "TR" | "EN";
type GameMode = "classic" | "daily";

type WordHuntProps = {
  userId?: string;
  onGameEnd?: (score: number, stats: { level: number }) => void;
};

export function WordHunt({ userId = "guest", onGameEnd }: WordHuntProps) {
  const [selectedLang, setSelectedLang] = useState<Lang | null>(null);
  const [gameMode, setGameMode] = useState<GameMode>("classic");
  const [_validWords, setValidWords] = useState<Record<number, Set<string>> | null>(null);

  // Classic level progression
  const [currentLevel, setCurrentLevel] = useState(1);
  const [targetWordObj, setTargetWordObj] = useState<WordEntry | null>(null);
  const [guesses, setGuesses] = useState<string[]>(Array(ROWS).fill(""));
  const [currentRow, setCurrentRow] = useState(0);
  const [isGameOver, setIsGameOver] = useState(false);
  const [hasWon, setHasWon] = useState(false);
  const [score, setScore] = useState(0);

  // Daily Duel specific states
  const [dailyDateKey, setDailyDateKey] = useState<string>("");
  const [dailyAlreadyPlayed, setDailyAlreadyPlayed] = useState(false);
  const [dailyScore, setDailyScore] = useState(0);
  const [duelSeconds, setDuelSeconds] = useState(0);
  const [isTimerRunning, setIsTimerRunning] = useState(false);
  const [copiedShare, setCopiedShare] = useState(false);

  const [shakeRow, setShakeRow] = useState(-1);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [isLoadingTarget, setIsLoadingTarget] = useState(false);

  const { playSound } = useAudio();
  const keyboardRef = useRef<HTMLDivElement>(null);
  const winLatchRef = useRef(false);
  const validWordsRef = useRef<Record<number, Set<string>> | null>(null);

  // Classic mode progress hook
  const {
    highScore: classicHighScore,
    isLeaderboardOpen,
    setIsLeaderboardOpen,
    saveProgress: saveClassicProgress,
  } = useGameProgress({ gameType: "word_hunt", userId });

  // Daily mode progress hook
  const {
    highScore: dailyHighScore,
    saveProgress: saveDailyProgress,
  } = useGameProgress({ gameType: "word_hunt_daily", userId });

  const targetWord = targetWordObj?.word || "";
  const targetMeaning = targetWordObj?.meaning || "";
  const cols = targetWord.length || 5;

  // Fetch initial classic progress
  useEffect(() => {
    if (userId === "guest") return;
    fetch(`/api/games/progress?game_type=word_hunt`)
      .then((r) => r.json())
      .then((data) => {
        if (data.last_level) setCurrentLevel(data.last_level);
      })
      .catch(() => {});
  }, [userId]);

  // Check daily played status in localStorage whenever dateKey changes
  useEffect(() => {
    if (!dailyDateKey) return;
    const storageKey = `zigo_word_daily_${userId}_${dailyDateKey}`;
    const saved = localStorage.getItem(storageKey);
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        setDailyAlreadyPlayed(true);
        setDailyScore(parsed.score || 0);
      } catch {
        setDailyAlreadyPlayed(true);
      }
    } else {
      setDailyAlreadyPlayed(false);
    }
  }, [dailyDateKey, userId]);

  // Duel Timer
  useEffect(() => {
    let interval: NodeJS.Timeout | null = null;
    if (gameMode === "daily" && isTimerRunning && !isGameOver && !dailyAlreadyPlayed) {
      interval = setInterval(() => {
        setDuelSeconds((prev) => prev + 1);
      }, 1000);
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [gameMode, isTimerRunning, isGameOver, dailyAlreadyPlayed]);

  const initLevel = useCallback(async (level: number, lang: Lang, mode: GameMode) => {
    setIsLoadingTarget(true);
    winLatchRef.current = false;
    let wordObj: (WordEntry & { dateKey?: string }) | null = null;

    try {
      const url =
        mode === "daily"
          ? `/api/games/word?lang=${lang}&daily=true`
          : `/api/games/word?lang=${lang}&level=${level}`;
      const res = await fetch(url);
      if (res.ok) {
        wordObj = await res.json();
        if (mode === "daily" && wordObj?.dateKey) {
          setDailyDateKey(wordObj.dateKey);
        }
      }
    } catch (err) {
      console.error("Failed to fetch target word, using fallback", err);
    }

    if (!wordObj || !wordObj.word) {
      let wordLen = 4;
      if (mode === "daily") {
        wordLen = 5;
      } else {
        if (level >= 3 && level <= 5) wordLen = 5;
        if (level >= 6) wordLen = 6;
      }

      const wordList = WORD_DICTIONARY[lang][wordLen] || WORD_DICTIONARY[lang][4];
      wordObj = wordList[Math.floor(Math.random() * wordList.length)];
    }

    setTargetWordObj(wordObj);
    setGuesses(Array(ROWS).fill(""));
    setCurrentRow(0);
    setIsGameOver(false);
    setHasWon(false);
    setShakeRow(-1);
    setToastMessage(null);
    setDuelSeconds(0);
    setIsTimerRunning(mode === "daily");
    setCopiedShare(false);
    setIsLoadingTarget(false);
  }, []);

  useEffect(() => {
    if (selectedLang) {
      initLevel(currentLevel, selectedLang, gameMode);

      // Fetch the dictionary for the selected language
      fetch(`/dictionaries/${selectedLang.toLowerCase()}-words.json`)
        .then((res) => res.json())
        .then((data: Record<string, string[]>) => {
          const parsedDict: Record<number, Set<string>> = {};
          for (const [len, words] of Object.entries(data)) {
            parsedDict[parseInt(len, 10)] = new Set(
              words.map((w) => w.toLocaleLowerCase(selectedLang === "TR" ? "tr-TR" : "en-US"))
            );
          }
          setValidWords(parsedDict);
          validWordsRef.current = parsedDict;
        })
        .catch((err) => {
          console.error("Failed to load dictionary", err);
        });
    }
  }, [currentLevel, selectedLang, gameMode, initLevel]);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    playSound("error");
    setTimeout(() => setToastMessage(null), 2000);
  };

  const isValidWord = (guess: string, lang: Lang, wordLen: number): boolean => {
    const dict = validWordsRef.current;
    if (dict && dict[wordLen]) {
      const lowerGuess = guess.toLocaleLowerCase(lang === "TR" ? "tr-TR" : "en-US");
      if (dict[wordLen].has(guess) || dict[wordLen].has(lowerGuess)) return true;
    }
    const fallbackList = WORD_DICTIONARY[lang][wordLen];
    if (fallbackList && fallbackList.some((w) => w.word === guess)) return true;
    if (!dict) return true;
    return false;
  };

  const calculateDuelScore = (attempts: number, seconds: number): number => {
    const attemptPts = Math.max(100, (7 - attempts) * 150);
    const timeBonus = Math.max(0, Math.min(400, Math.floor((180 - seconds) * 2.5)));
    return attemptPts + timeBonus;
  };

  const saveGameProgress = (finalScore: number, newLevel: number, won: boolean) => {
    if (gameMode === "daily") {
      setIsTimerRunning(false);
      const earnedScore = won ? finalScore : 0;
      setDailyScore(earnedScore);
      setDailyAlreadyPlayed(true);

      if (dailyDateKey) {
        localStorage.setItem(
          `zigo_word_daily_${userId}_${dailyDateKey}`,
          JSON.stringify({ score: earnedScore, date: dailyDateKey, won })
        );
      }

      void saveDailyProgress(earnedScore, 1, { attempts: currentRow + 1, seconds: duelSeconds });
      if (onGameEnd) onGameEnd(earnedScore, { level: 1 });
    } else {
      void saveClassicProgress(finalScore, newLevel, { level: newLevel });
      if (onGameEnd) onGameEnd(finalScore, { level: newLevel });
    }
  };

  const onKeyPress = useCallback(
    (key: string) => {
      if (isGameOver || !selectedLang || !targetWord) return;
      if (gameMode === "daily" && dailyAlreadyPlayed) return;
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
          setIsTimerRunning(false);
          playSound("success");

          if (gameMode === "daily") {
            const earned = calculateDuelScore(currentRow + 1, duelSeconds);
            confetti({
              particleCount: 120,
              spread: 80,
              origin: { y: 0.6 },
              colors: ["#f59e0b", "#10b981", "#6366f1"],
            });
            saveGameProgress(earned, 1, true);
          } else {
            const earned = Math.max(10, 100 - currentRow * 15);
            const newScore = score + earned;
            setScore(newScore);

            confetti({
              particleCount: 100,
              spread: 70,
              origin: { y: 0.6 },
              colors: ["#10b981", "#34d399", "#f59e0b"],
            });

            saveGameProgress(newScore, currentLevel + 1, true);
          }
        } else {
          if (currentRow === ROWS - 1) {
            setIsGameOver(true);
            setIsTimerRunning(false);
            playSound("error");
            showToast(targetWord);
            saveGameProgress(gameMode === "daily" ? 0 : score, currentLevel, false);
          } else {
            setCurrentRow((prev) => prev + 1);
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
    },
    [
      currentRow,
      guesses,
      isGameOver,
      playSound,
      targetWord,
      score,
      currentLevel,
      cols,
      selectedLang,
      gameMode,
      dailyAlreadyPlayed,
      duelSeconds,
    ]
  );

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (isLeaderboardOpen || isGameOver) return;
      if (e.ctrlKey || e.metaKey || e.altKey || !selectedLang) return;

      const key = selectedLang === "TR" ? e.key.toLocaleUpperCase("tr-TR") : e.key.toUpperCase();
      if (key === "ENTER") {
        e.preventDefault();
        onKeyPress("ENTER");
      } else if (key === "BACKSPACE") {
        e.preventDefault();
        onKeyPress("BACKSPACE");
      } else if (/^[A-ZÇĞİÖŞÜ]$/.test(key)) onKeyPress(key);
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [onKeyPress, selectedLang, isLeaderboardOpen, isGameOver]);

  const getLetterStates = (guess: string): LetterState[] => evaluateGuess(targetWord, guess);

  const getLetterState = (guess: string, index: number): LetterState => {
    if (!guess) return "empty";
    return getLetterStates(guess)[index];
  };

  const getKeyColor = (key: string) => {
    const collected: LetterState[] = [];
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

  const generateShareText = () => {
    const count = hasWon ? currentRow + 1 : "X";
    const minutes = Math.floor(duelSeconds / 60);
    const secs = duelSeconds % 60;
    const timeStr = `${minutes > 0 ? `${minutes}d ` : ""}${secs}s`;

    let grid = "";
    for (let i = 0; i <= (hasWon ? currentRow : ROWS - 1); i++) {
      const g = guesses[i];
      if (!g || g.length !== cols) continue;
      const states = getLetterStates(g);
      const rowEmojis = states
        .map((s) => (s === "correct" ? "🟩" : s === "present" ? "🟨" : "⬛"))
        .join("");
      grid += rowEmojis + "\n";
    }

    return `🔥 Zigo Günlük Düello (${dailyDateKey || "Bugün"})\n🎯 ${count}/6 Deneme | ⏱️ ${timeStr}\nSkor: ${dailyScore} Puan\n\n${grid}\nSen benden daha hızlı çözebilir misin?`;
  };

  const handleCopyShare = () => {
    const text = generateShareText();
    if (navigator.clipboard) {
      navigator.clipboard.writeText(text);
      setCopiedShare(true);
      setTimeout(() => setCopiedShare(false), 2500);
    }
  };

  const KEYBOARD_TR = [
    ["E", "R", "T", "Y", "U", "I", "O", "P", "Ğ", "Ü"],
    ["A", "S", "D", "F", "G", "H", "J", "K", "L", "Ş", "İ"],
    ["ENTER", "Z", "C", "V", "B", "N", "M", "Ö", "Ç", "BACKSPACE"],
  ];

  const KEYBOARD_EN = [
    ["Q", "W", "E", "R", "T", "Y", "U", "I", "O", "P"],
    ["A", "S", "D", "F", "G", "H", "J", "K", "L"],
    ["ENTER", "Z", "X", "C", "V", "B", "N", "M", "BACKSPACE"],
  ];

  const keyboardRows = selectedLang === "EN" ? KEYBOARD_EN : KEYBOARD_TR;

  if (!selectedLang) {
    return (
      <div className="w-full max-w-sm mx-auto p-6 bg-slate-900 rounded-3xl border border-slate-800 shadow-2xl text-center">
        <h2 className="text-2xl font-black text-white mb-6">
          🔤 Word Hunt
          <br />
          <span className="text-sm text-teal-400">Kelime Avı</span>
        </h2>
        <p className="text-sm font-bold text-slate-400 mb-6">
          Hangi dilde oynamak istersin?
          <br />
          Choose your language
        </p>

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
      <style
        dangerouslySetInnerHTML={{
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
        `,
        }}
      />

      {/* Mode Selector Tabs */}
      <div className="flex bg-slate-900/90 p-1 rounded-2xl mb-3 border border-slate-800 shadow-lg">
        <button
          onClick={() => {
            if (gameMode !== "classic") setGameMode("classic");
          }}
          className={`flex-1 py-2 text-xs font-black rounded-xl transition flex items-center justify-center gap-1.5 ${
            gameMode === "classic"
              ? "bg-teal-500 text-white shadow-md shadow-teal-500/20"
              : "text-slate-400 hover:text-white"
          }`}
        >
          <span>🎯</span>
          <span>{selectedLang === "TR" ? "Sonsuz Pratik" : "Practice"}</span>
        </button>
        <button
          onClick={() => {
            if (gameMode !== "daily") setGameMode("daily");
          }}
          className={`flex-1 py-2 text-xs font-black rounded-xl transition flex items-center justify-center gap-1.5 ${
            gameMode === "daily"
              ? "bg-gradient-to-r from-amber-500 to-orange-600 text-white shadow-md shadow-orange-500/20"
              : "text-slate-400 hover:text-white"
          }`}
        >
          <span>🔥</span>
          <span>{selectedLang === "TR" ? "Günün Düellosu" : "Daily Duel"}</span>
        </button>
      </div>

      {/* Header Banner */}
      <div
        className={`rounded-3xl p-4 mb-3 border shadow-2xl transition-colors ${
          gameMode === "daily"
            ? "bg-gradient-to-br from-amber-600 to-orange-700 border-amber-400/20 shadow-orange-500/20"
            : "bg-gradient-to-br from-teal-600 to-emerald-700 border-teal-400/20 shadow-teal-500/20"
        }`}
      >
        <div className="flex items-center justify-between mb-3">
          <div>
            <h2 className="text-lg font-black text-white flex items-center gap-2">
              {gameMode === "daily" ? "🔥 Günün Düellosu" : "🔤 " + (selectedLang === "TR" ? "Kelime Avı" : "Word Hunt")}
            </h2>
            <p className="text-xs font-bold text-white/80">
              {gameMode === "daily"
                ? dailyDateKey || "Her Gün 1 Hak"
                : (selectedLang === "TR" ? "Seviye" : "Level") + ` ${currentLevel}`}
            </p>
          </div>
          <div className="flex flex-col items-end gap-1">
            {((gameMode === "daily" ? dailyHighScore : classicHighScore) > 0) && (
              <div className="bg-yellow-400/20 border border-yellow-300/30 rounded-xl px-2 py-1 text-center">
                <span className="text-[0.5rem] font-black text-yellow-200 block uppercase">
                  {selectedLang === "TR" ? "Rekor" : "Best"}
                </span>
                <span className="text-xs font-black text-yellow-300">
                  🏆 {gameMode === "daily" ? dailyHighScore : classicHighScore}
                </span>
              </div>
            )}
            <div className="flex gap-1">
              {!isGameOver && gameMode === "classic" && (
                <button
                  onClick={() => {
                    setIsGameOver(true);
                    setHasWon(false);
                    saveGameProgress(score, currentLevel, false);
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

        {/* Status Bar: Time & Points */}
        <div className="grid grid-cols-2 gap-2 text-center">
          <div className="bg-white/10 rounded-xl p-2 backdrop-blur-sm">
            <span className="text-[0.6rem] font-black text-white/70 block uppercase">
              {gameMode === "daily" ? "Süre" : selectedLang === "TR" ? "Toplam Puan" : "Score"}
            </span>
            <span className="text-lg font-black text-white">
              {gameMode === "daily"
                ? `${Math.floor(duelSeconds / 60)}:${(duelSeconds % 60).toString().padStart(2, "0")}`
                : score}
            </span>
          </div>
          <div className="bg-white/10 rounded-xl p-2 backdrop-blur-sm">
            <span className="text-[0.6rem] font-black text-white/70 block uppercase">
              {gameMode === "daily" ? "Kalan Hak" : selectedLang === "TR" ? "Hedef Harf" : "Letters"}
            </span>
            <span className="text-lg font-black text-white">
              {gameMode === "daily" ? `${ROWS - currentRow}` : `${cols} Harf`}
            </span>
          </div>
        </div>
      </div>

      {isLoadingTarget && (
        <div className="absolute inset-0 z-10 bg-slate-900/80 backdrop-blur-sm rounded-3xl flex items-center justify-center">
          <div className="animate-spin text-teal-500 text-4xl">🔄</div>
        </div>
      )}

      {/* Daily Already Completed Screen */}
      {gameMode === "daily" && dailyAlreadyPlayed && !isGameOver && (
        <div className="bg-slate-900 rounded-3xl p-6 border border-slate-800 shadow-2xl mb-3 text-center">
          <div className="w-14 h-14 rounded-2xl bg-amber-500/20 border border-amber-500/30 flex items-center justify-center mx-auto mb-3 text-2xl">
            ⏳
          </div>
          <h3 className="text-base font-black text-white mb-1">
            Günün Düellosunu Tamamladın!
          </h3>
          <p className="text-xs font-bold text-slate-400 mb-4">
            Her gün için 1 yarışma hakkı bulunur. Yeni kelime yarın 00:00&apos;da açılacaktır.
          </p>
          <div className="bg-white/5 border border-white/10 rounded-xl p-3 mb-4 flex justify-between items-center">
            <span className="text-xs text-slate-400 font-bold">Günün Skoru:</span>
            <span className="text-base font-black text-amber-400">{dailyScore} Puan</span>
          </div>
          <button
            onClick={() => setGameMode("classic")}
            className="tap-scale w-full bg-teal-500 hover:bg-teal-400 text-white font-black py-3 rounded-xl shadow-lg transition text-xs"
          >
            Sonsuz Modda Pratik Yap 🚀
          </button>
        </div>
      )}

      {/* Grid */}
      {!(gameMode === "daily" && dailyAlreadyPlayed && !isGameOver) && (
        <>
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
                    if (cols > 6) boxSize = "w-7 h-7 sm:w-10 sm:h-10";
                    if (cols > 7) boxSize = "w-6 h-6 sm:w-9 sm:h-9";
                    if (cols > 8) boxSize = "w-6 h-6 sm:w-8 sm:h-8";

                    let fontSize = "text-2xl";
                    if (cols > 6) fontSize = "text-lg";
                    if (cols > 7) fontSize = "text-base";
                    if (cols > 8) fontSize = "text-sm";

                    const winBounceDelay = isWinRow ? { animationDelay: `${j * 100 + 700}ms` } : {};

                    return (
                      <div
                        key={j}
                        className={`${boxSize} flex items-center justify-center rounded-xl border-2 ${fontSize} font-black uppercase transition-colors ${bgClass} ${extraClass} ${
                          isWinRow ? "animate-[winBounce_0.6s_ease_forwards]" : ""
                        }`}
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
                        isAction
                          ? "w-11 sm:w-16 h-10 sm:h-12 text-[0.6rem] sm:text-[0.65rem] bg-slate-700 border-slate-800 text-white"
                          : `w-[1.9rem] sm:w-10 h-10 sm:h-12 text-lg ${getKeyColor(key)}`
                      }`}
                    >
                      {key === "BACKSPACE" ? "⌫" : key === "ENTER" ? (selectedLang === "TR" ? "GİR" : "ENT") : key}
                    </button>
                  );
                })}
              </div>
            ))}
          </div>
        </>
      )}

      {/* Game Over Overlay */}
      {isGameOver && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-950/90 backdrop-blur-sm p-4 animate-in fade-in duration-200">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 w-full max-w-sm text-center shadow-2xl">
            <div
              className={`w-16 h-16 rounded-3xl flex items-center justify-center mx-auto mb-4 text-3xl shadow-xl ${
                hasWon ? "bg-emerald-500 shadow-emerald-500/40" : "bg-rose-500 shadow-rose-500/40"
              }`}
            >
              {hasWon ? "🎉" : "💔"}
            </div>
            <h3 className="text-xl font-black text-white mb-1">
              {hasWon
                ? (gameMode === "daily" ? "Düelloyu Kazandın! 🔥" : selectedLang === "TR" ? "Tebrikler!" : "Congratulations!")
                : (gameMode === "daily" ? "Düello Bitti" : selectedLang === "TR" ? "Maalesef Bilemedin" : "Game Over")}
            </h3>

            {gameMode === "daily" && hasWon && (
              <p className="text-xs font-black text-amber-400 mb-3">
                🎯 {currentRow + 1}. Denemede | ⏱️ {Math.floor(duelSeconds / 60)}d {duelSeconds % 60}s | 🏆 {dailyScore} Puan
              </p>
            )}

            <p className="text-sm text-slate-400 font-bold mb-3">
              {selectedLang === "TR" ? "Kelime:" : "Word:"}{" "}
              <span className="text-emerald-400 uppercase tracking-widest text-lg ml-1">{targetWord}</span>
            </p>

            <div className="bg-white/5 border border-white/10 rounded-xl p-3 mb-4 text-left">
              <span className="text-[0.6rem] font-black text-slate-400 block uppercase mb-1">
                {selectedLang === "TR" ? "ANLAMI" : "MEANING"}
              </span>
              <p className="text-xs text-white font-semibold leading-relaxed">
                {targetMeaning}
              </p>
            </div>

            {gameMode === "daily" ? (
              <div className="flex flex-col gap-2">
                <button
                  onClick={handleCopyShare}
                  className="tap-scale w-full bg-gradient-to-r from-amber-500 to-orange-600 hover:brightness-110 text-white font-black py-3 rounded-xl shadow-lg transition text-xs flex items-center justify-center gap-2"
                >
                  <span>{copiedShare ? "✅ Kopyalandı!" : "📋 Sonucu Paylaş (Kopyala)"}</span>
                </button>
                <button
                  onClick={() => {
                    setIsGameOver(false);
                    setGameMode("classic");
                  }}
                  className="tap-scale w-full bg-slate-800 hover:bg-slate-700 text-slate-200 font-black py-3 rounded-xl transition text-xs"
                >
                  Sonsuz Modda Devam Et 🎯
                </button>
              </div>
            ) : (
              <button
                onClick={() => {
                  if (hasWon) {
                    setCurrentLevel((prev) => prev + 1);
                  } else {
                    initLevel(currentLevel, selectedLang, "classic");
                  }
                }}
                className={`tap-scale w-full text-white font-black py-3 rounded-xl shadow-lg transition text-sm ${
                  hasWon
                    ? "bg-gradient-to-r from-emerald-500 to-teal-600 hover:brightness-110"
                    : "bg-gradient-to-r from-slate-700 to-slate-600 hover:bg-slate-600"
                }`}
              >
                {hasWon
                  ? selectedLang === "TR"
                    ? `Seviye ${currentLevel + 1}'e Geç 🚀`
                    : `Next Level ${currentLevel + 1} 🚀`
                  : selectedLang === "TR"
                  ? "Tekrar Dene 🔄"
                  : "Try Again 🔄"}
              </button>
            )}
          </div>
        </div>
      )}

      {/* Leaderboard Modal */}
      <LeaderboardModal
        isOpen={isLeaderboardOpen}
        onClose={() => setIsLeaderboardOpen(false)}
        gameType={gameMode === "daily" ? "word_hunt_daily" : "word_hunt"}
        gameTitle={gameMode === "daily" ? "Günün Kelime Düellosu" : selectedLang === "TR" ? "Kelime Avı" : "Word Hunt"}
        currentUserId={userId !== "guest" ? userId : undefined}
        currentScore={
          gameMode === "daily"
            ? dailyScore > 0 ? dailyScore : dailyHighScore
            : score > 0 ? score : classicHighScore
        }
      />
    </div>
  );
}
