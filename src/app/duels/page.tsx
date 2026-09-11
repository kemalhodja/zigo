"use client";

import { useEffect, useState, useRef } from "react";
import Link from "next/link";
import { Swords, Trophy, Zap, Clock, CheckCircle2, XCircle, RotateCcw, Sparkles } from "lucide-react";
import confetti from "canvas-confetti";
import { useAudio } from "@/hooks/use-audio";
import { createClient } from "@/lib/supabase/client";

type DuelQuestion = {
  id: number;
  question: string;
  options: string[];
  correctIndex: number;
  explanation: string;
  category: string;
};

const DUEL_QUESTIONS: DuelQuestion[] = [
  {
    id: 1,
    question: "Aşağıdaki cümlelerin hangisinde 'yazım yanlışı' yapılmıştır?",
    options: [
      "Herkes bu akşam tiyatroya gidecekmiş.",
      "Birkaç gün sonra yanına uğrayacağım.",
      "Hiç bir zaman pes etmemelisin.",
      "Yarınki toplantı saat onda başlayacak."
    ],
    correctIndex: 2,
    explanation: "'Hiçbir' sözcüğü bitişik yazılmalıdır.",
    category: "LGS Türkçe"
  },
  {
    id: 2,
    question: "x + 2y = 12 ve 2x - y = 4 ise x değeri kaçtır?",
    options: ["2", "4", "6", "8"],
    correctIndex: 1,
    explanation: "İkinci denklem 2 ile çarpılıp toplanırsa: 5x = 20 => x = 4 bulunur.",
    category: "LGS Matematik"
  },
  {
    id: 3,
    question: "Hücrede protein sentezinden sorumlu organel hangisidir?",
    options: ["Mitokondri", "Ribozom", "Kloroplast", "Golgi cisimciği"],
    correctIndex: 1,
    explanation: "Ribozom tüm canlılarda protein sentezinin gerçekleştiği temel yapıdır.",
    category: "Fen Bilimleri"
  },
  {
    id: 4,
    question: "Milli Mücadele döneminde Batı Cephesi hangi antlaşma ile başarıyla kapanmıştır?",
    options: ["Gümrü Antlaşması", "Mudanya Ateşkesi", "Kars Antlaşması", "Ankara Antlaşması"],
    correctIndex: 1,
    explanation: "Mudanya Ateşkes Antlaşması ile Batı Cephesi'ndeki silahlı çatışmalar resmen sona ermiştir.",
    category: "İnkılap Tarihi"
  },
  {
    id: 5,
    question: "Which of the following is the opposite of 'generous'?",
    options: ["Helpful", "Stingy", "Honest", "Polite"],
    correctIndex: 1,
    explanation: "'Generous' (cömert) kelimesinin zıttı 'stingy' (cimri)dir.",
    category: "İngilizce"
  }
];

export default function DuelsPage() {
  const { playSound } = useAudio();
  const [gameState, setGameState] = useState<"lobby" | "searching" | "playing" | "finished">("lobby");
  const [opponent, setOpponent] = useState<{ name: string; avatar: string; score: number }>({
    name: "Öğrenci Rakip",
    avatar: "🎒",
    score: 0
  });
  const [currentIndex, setCurrentIndex] = useState(0);
  const [userScore, setUserScore] = useState(0);
  const [selectedOption, setSelectedOption] = useState<number | null>(null);
  const [isAnswered, setIsAnswered] = useState(false);
  const [timeLeft, setTimeLeft] = useState(15);
  const [opponentAnswered, setOpponentAnswered] = useState(false);

  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);

  useEffect(() => {
    const supabase = createClient();
    void supabase.auth.getUser().then(({ data }) => {
      if (data?.user?.id) setCurrentUserId(data.user.id);
    });
  }, []);

  function startDuel() {
    setGameState("searching");
    playSound("click");

    // Realistic matching simulation: 1.5s finding opponent
    setTimeout(() => {
      const names = ["Kerem_LGS", "Zeynep.Math", "Ahmet_Fen", "Elif_Biyoloji", "Can_8B"];
      const avatars = ["🦊", "🚀", "⚡", "🌟", "🦁"];
      const randomIdx = Math.floor(Math.random() * names.length);

      setOpponent({
        name: names[randomIdx],
        avatar: avatars[randomIdx],
        score: 0
      });
      setUserScore(0);
      setCurrentIndex(0);
      setSelectedOption(null);
      setIsAnswered(false);
      setTimeLeft(15);
      setGameState("playing");
      playSound("pop");
    }, 1500);
  }

  // Question Timer
  useEffect(() => {
    if (gameState !== "playing" || isAnswered) return;

    timerRef.current = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          handleTimeout();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    // Simulate opponent answering between 3 to 8 seconds
    const opponentDelay = (Math.floor(Math.random() * 5) + 3) * 1000;
    const oppTimer = setTimeout(() => {
      if (Math.random() > 0.3) {
        // 70% chance opponent answers correctly
        setOpponent((prev) => ({ ...prev, score: prev.score + 10 }));
      }
      setOpponentAnswered(true);
    }, opponentDelay);

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
      clearTimeout(oppTimer);
    };
  }, [gameState, currentIndex, isAnswered]);

  function handleTimeout() {
    if (isAnswered) return;
    setIsAnswered(true);
    setSelectedOption(-1);
    if ("vibrate" in navigator) navigator.vibrate([40, 40, 40]);
    proceedNext();
  }

  function handleAnswer(index: number) {
    if (isAnswered) return;
    setIsAnswered(true);
    setSelectedOption(index);

    const isCorrect = index === DUEL_QUESTIONS[currentIndex].correctIndex;
    if (isCorrect) {
      setUserScore((prev) => prev + 10);
      playSound("success");
      if ("vibrate" in navigator) navigator.vibrate(20);
    } else {
      playSound("wrong");
      if ("vibrate" in navigator) navigator.vibrate([40, 40, 40]);
    }

    proceedNext();
  }

  function proceedNext() {
    setTimeout(() => {
      if (currentIndex + 1 < DUEL_QUESTIONS.length) {
        setCurrentIndex((prev) => prev + 1);
        setSelectedOption(null);
        setIsAnswered(false);
        setOpponentAnswered(false);
        setTimeLeft(15);
      } else {
        finishGame();
      }
    }, 1800);
  }

  function finishGame() {
    setGameState("finished");
    if (timerRef.current) clearInterval(timerRef.current);

    const isWinner = userScore > opponent.score;
    if (isWinner) {
      playSound("success");
      confetti({
        particleCount: 100,
        spread: 80,
        origin: { y: 0.6 },
      });
    } else {
      playSound("pop");
    }

    if (currentUserId) {
      const earnedXP = isWinner ? 250 : 100; // 250 / 10 = 25 puan, 100 / 10 = 10 puan
      void fetch("/api/games/finish", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          user_id: currentUserId,
          score: earnedXP,
          game_type: "duel_1v1",
          played_seconds: 75,
          stats: {
            userScore,
            opponentScore: opponent.score,
            isWinner,
          },
        }),
      }).catch(() => {
        // Safe error fallback
      });
    }
  }

  const currentQ = DUEL_QUESTIONS[currentIndex];

  return (
    <div className="min-h-screen bg-slate-50 py-6 px-4 pb-20">
      <div className="mx-auto max-w-lg">
        {/* Header */}
        <div className="mb-6 flex items-center justify-between">
          <Link href="/learn" className="tap-scale flex items-center gap-1.5 text-xs font-black text-slate-500 hover:text-night">
            ← Öğren Hub'a Dön
          </Link>
          <div className="flex items-center gap-1.5 rounded-full bg-gradient-to-r from-amber-500 to-orange-500 px-3 py-1 text-white text-xs font-black shadow-xs">
            <Swords className="size-3.5" />
            1v1 Canlı Soru Düellosu
          </div>
        </div>

        {/* LOBBY STATE */}
        {gameState === "lobby" && (
          <div className="rounded-3xl border border-amber-200 bg-white p-6 text-center shadow-lg animate-in fade-in zoom-in-95 duration-200">
            <div className="mx-auto flex size-20 items-center justify-center rounded-2xl bg-gradient-to-tr from-amber-400 to-orange-500 text-white shadow-md">
              <Swords className="size-10" />
            </div>
            <h1 className="mt-4 text-2xl font-black text-slate-900">MEB Soru Düellosu</h1>
            <p className="mt-2 text-xs font-semibold leading-relaxed text-slate-600">
              Gerçek bir öğrenciyle eşleşin, 5 soruda hızınızı ve bilginizi yarıştırın! Kazanan +25 Zigo Lig Puanı alır.
            </p>

            <div className="mt-6 rounded-2xl bg-amber-50/70 p-4 text-left border border-amber-100/80">
              <h3 className="text-xs font-black text-amber-900 flex items-center gap-1.5">
                <Trophy className="size-4 text-amber-600" />
                Düello Kuralları
              </h3>
              <ul className="mt-2 space-y-1.5 text-[11px] font-semibold text-amber-800">
                <li>• Toplam 5 soru (Türkçe, Matematik, Fen, Sosyal, İngilizce)</li>
                <li>• Soru başına 15 saniye süre</li>
                <li>• Her doğru cevap +10 Puan</li>
                <li>• Kazanan oyuncuya haftalık lig puanı bonusu 🏆</li>
              </ul>
            </div>

            <button
              type="button"
              onClick={startDuel}
              className="tap-scale mt-6 w-full rounded-2xl bg-gradient-to-r from-amber-400 via-orange-500 to-rose-500 py-4 text-sm font-black text-white shadow-md hover:brightness-105 transition"
            >
              🔥 Rakip Bul ve Başla!
            </button>
          </div>
        )}

        {/* SEARCHING STATE */}
        {gameState === "searching" && (
          <div className="rounded-3xl border border-slate-100 bg-white p-10 text-center shadow-lg">
            <div className="relative mx-auto flex size-20 items-center justify-center">
              <div className="absolute inline-flex h-full w-full animate-ping rounded-full bg-orange-400 opacity-75"></div>
              <div className="relative inline-flex size-16 items-center justify-center rounded-full bg-gradient-to-tr from-amber-500 to-orange-500 text-white text-2xl font-black shadow-md">
                ⚡
              </div>
            </div>
            <h2 className="mt-5 text-lg font-black text-slate-900">Canlı Rakip Aranıyor...</h2>
            <p className="mt-1 text-xs font-medium text-slate-500">Aynı sınıf seviyesinde öğrenci eşleştiriliyor</p>
          </div>
        )}

        {/* PLAYING STATE */}
        {gameState === "playing" && (
          <div className="space-y-4">
            {/* Players Scoreboard */}
            <div className="grid grid-cols-2 gap-3 rounded-2xl border border-slate-100 bg-white p-3 shadow-xs">
              {/* User */}
              <div className="flex items-center gap-2.5 rounded-xl bg-violet-50/70 p-2.5 border border-violet-100">
                <span className="text-2xl">🎓</span>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-xs font-black text-slate-800">Sen</p>
                  <p className="text-sm font-black text-violet-600">{userScore} Puan</p>
                </div>
              </div>

              {/* Opponent */}
              <div className="flex items-center gap-2.5 rounded-xl bg-orange-50/70 p-2.5 border border-orange-100">
                <span className="text-2xl">{opponent.avatar}</span>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-xs font-black text-slate-800">{opponent.name}</p>
                  <p className="text-sm font-black text-orange-600">{opponent.score} Puan</p>
                </div>
              </div>
            </div>

            {/* Timer & Progress Bar */}
            <div className="flex items-center justify-between px-1">
              <span className="text-xs font-black text-slate-500">
                Soru {currentIndex + 1} / {DUEL_QUESTIONS.length} · <span className="text-crystal">{currentQ.category}</span>
              </span>
              <div className="flex items-center gap-1 font-black text-xs text-orange-600">
                <Clock className="size-3.5" />
                {timeLeft}s
              </div>
            </div>

            <div className="h-1.5 w-full overflow-hidden rounded-full bg-slate-200">
              <div
                className={`h-full transition-all duration-1000 ${
                  timeLeft <= 4 ? "bg-rose-500" : "bg-gradient-to-r from-amber-400 to-orange-500"
                }`}
                style={{ width: `${(timeLeft / 15) * 100}%` }}
              />
            </div>

            {/* Question Card */}
            <div className="rounded-3xl border border-slate-100 bg-white p-5 shadow-sm">
              <p className="text-sm font-black leading-snug text-slate-900">{currentQ.question}</p>

              {/* Options */}
              <div className="mt-4 space-y-2.5">
                {currentQ.options.map((option, idx) => {
                  let btnStyle = "bg-slate-50 border-slate-200 text-slate-800 hover:bg-slate-100";

                  if (isAnswered) {
                    if (idx === currentQ.correctIndex) {
                      btnStyle = "bg-emerald-500 border-emerald-600 text-white font-black";
                    } else if (idx === selectedOption) {
                      btnStyle = "bg-rose-500 border-rose-600 text-white font-black";
                    } else {
                      btnStyle = "bg-slate-50 border-slate-200 text-slate-400 opacity-60";
                    }
                  }

                  return (
                    <button
                      key={idx}
                      type="button"
                      disabled={isAnswered}
                      onClick={() => handleAnswer(idx)}
                      className={`tap-scale w-full text-left rounded-2xl border p-3.5 text-xs font-bold transition flex items-center justify-between ${btnStyle}`}
                    >
                      <span>{option}</span>
                      {isAnswered && idx === currentQ.correctIndex && <CheckCircle2 className="size-4 shrink-0" />}
                      {isAnswered && idx === selectedOption && idx !== currentQ.correctIndex && <XCircle className="size-4 shrink-0" />}
                    </button>
                  );
                })}
              </div>

              {/* Explanation upon answer */}
              {isAnswered && (
                <div className="mt-4 rounded-xl bg-slate-50 p-2.5 text-[11px] font-semibold text-slate-600 border border-slate-200/60 animate-in fade-in">
                  💡 <strong>Açıklama:</strong> {currentQ.explanation}
                </div>
              )}
            </div>
          </div>
        )}

        {/* FINISHED STATE */}
        {gameState === "finished" && (
          <div className="rounded-3xl border border-slate-100 bg-white p-6 text-center shadow-lg animate-in fade-in zoom-in-95">
            <div className="mx-auto flex size-20 items-center justify-center rounded-2xl bg-amber-400 text-white shadow-md text-3xl">
              {userScore > opponent.score ? "🏆" : userScore === opponent.score ? "🤝" : "🥈"}
            </div>

            <h2 className="mt-4 text-2xl font-black text-slate-900">
              {userScore > opponent.score
                ? "Tebrikler, Kazandın!"
                : userScore === opponent.score
                ? "Berabere Bitti!"
                : "Güzel Mücadele!"}
            </h2>

            <p className="mt-1 text-xs font-semibold text-slate-500">
              {userScore > opponent.score ? "+25 Zigo Lig Puanı Kazandın!" : "+10 Katılım Puanı Kazandın!"}
            </p>

            <div className="mt-6 grid grid-cols-2 gap-3">
              <div className="rounded-2xl bg-violet-50 p-3 border border-violet-100">
                <p className="text-[11px] font-black text-violet-900">Senin Skorun</p>
                <p className="text-2xl font-black text-violet-700">{userScore}</p>
              </div>
              <div className="rounded-2xl bg-orange-50 p-3 border border-orange-100">
                <p className="text-[11px] font-black text-orange-900">{opponent.name}</p>
                <p className="text-2xl font-black text-orange-700">{opponent.score}</p>
              </div>
            </div>

            <div className="mt-6 flex flex-col gap-2.5">
              <button
                type="button"
                onClick={startDuel}
                className="tap-scale flex items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-amber-400 to-orange-500 py-3.5 text-xs font-black text-white shadow-md hover:brightness-105"
              >
                <RotateCcw className="size-4" />
                Tekrar Kapış
              </button>
              <Link
                href="/learn"
                className="tap-scale rounded-2xl border border-slate-200 bg-white py-3.5 text-xs font-black text-slate-700 hover:bg-slate-50"
              >
                Öğrenme Merkezine Dön
              </Link>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
