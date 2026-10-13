"use client";

import { useEffect, useState } from "react";
import { CheckCircle2, ChevronLeft, ChevronRight, Eye, EyeOff, Maximize2, Minimize2, Play, RotateCcw, Timer, X } from "lucide-react";

interface SmartBoardQuestion {
  text: string;
  options: string[];
  correctIndex?: number;
}

interface SmartBoardPresenterProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  questions: SmartBoardQuestion[];
  initialIndex?: number;
}

export function SmartBoardPresenter({
  isOpen,
  onClose,
  title,
  questions,
  initialIndex = 0,
}: SmartBoardPresenterProps) {
  const [currentIndex, setCurrentIndex] = useState(initialIndex);
  const [showOptions, setShowOptions] = useState(true);
  const [revealedAnswer, setRevealedAnswer] = useState(false);
  const [timerSeconds, setTimerSeconds] = useState(45);
  const [timerRunning, setTimerRunning] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);

  const currentQ = questions[currentIndex] || questions[0];

  // Timer countdown
  useEffect(() => {
    let interval: NodeJS.Timeout | null = null;
    if (timerRunning && timerSeconds > 0) {
      interval = setInterval(() => {
        setTimerSeconds((prev) => {
          if (prev <= 1) {
            setTimerRunning(false);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [timerRunning, timerSeconds]);

  // Fullscreen toggle
  function toggleFullscreen() {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().then(() => setIsFullscreen(true)).catch(() => {});
    } else {
      document.exitFullscreen().then(() => setIsFullscreen(false)).catch(() => {});
    }
  }

  // Keyboard navigation for wireless clickers & keys
  useEffect(() => {
    if (!isOpen) return;

    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") {
        if (document.fullscreenElement) {
          document.exitFullscreen().catch(() => {});
          setIsFullscreen(false);
        } else {
          onClose();
        }
      } else if (e.key === "ArrowRight" || e.key === "PageDown") {
        e.preventDefault();
        if (currentIndex < questions.length - 1) {
          setCurrentIndex((c) => c + 1);
          setRevealedAnswer(false);
          setTimerSeconds(45);
          setTimerRunning(false);
        }
      } else if (e.key === "ArrowLeft" || e.key === "PageUp") {
        e.preventDefault();
        if (currentIndex > 0) {
          setCurrentIndex((c) => c - 1);
          setRevealedAnswer(false);
          setTimerSeconds(45);
          setTimerRunning(false);
        }
      } else if (e.key === " ") {
        e.preventDefault();
        setTimerRunning((r) => !r);
      } else if (e.key === "Enter") {
        e.preventDefault();
        setRevealedAnswer((rev) => !rev);
      }
    }

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, currentIndex, questions.length, onClose]);

  if (!isOpen || !currentQ) return null;

  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-slate-950 text-white select-none animate-in fade-in duration-200">
      {/* Top Smart Board Header */}
      <header className="flex h-20 items-center justify-between border-b border-slate-800 bg-slate-900/90 px-8 backdrop-blur-md">
        <div className="flex items-center gap-4">
          <span className="flex size-12 items-center justify-center rounded-2xl bg-gradient-to-tr from-amber-500 to-orange-500 text-2xl shadow-lg">
            🖥️
          </span>
          <div>
            <div className="flex items-center gap-2">
              <span className="rounded-full bg-amber-500/20 px-3 py-0.5 text-xs font-black uppercase tracking-wider text-amber-400">
                Akıllı Tahta / Sınıf Sunumu
              </span>
              <span className="text-xs font-bold text-slate-400">
                Soru {currentIndex + 1} / {questions.length}
              </span>
            </div>
            <h2 className="text-lg font-black text-white truncate max-w-xl">{title}</h2>
          </div>
        </div>

        {/* Central Timer Display */}
        <div className="flex items-center gap-3 rounded-2xl border border-slate-800 bg-slate-950 px-5 py-2 shadow-inner">
          <Timer className={`size-6 ${timerSeconds <= 10 && timerRunning ? "text-rose-500 animate-pulse" : "text-amber-400"}`} />
          <span className={`text-2xl font-black font-mono tracking-wider ${timerSeconds <= 10 && timerRunning ? "text-rose-400" : "text-white"}`}>
            {timerSeconds}s
          </span>
          <button
            type="button"
            onClick={() => setTimerRunning((r) => !r)}
            className="rounded-lg bg-slate-800 p-2 text-slate-300 hover:bg-slate-700 hover:text-white"
            title="Zamanlayıcıyı Başlat / Durdur (Boşluk)"
          >
            <Play className={`size-4 ${timerRunning ? "fill-amber-400 text-amber-400" : ""}`} />
          </button>
          <button
            type="button"
            onClick={() => {
              setTimerSeconds(45);
              setTimerRunning(false);
            }}
            className="rounded-lg bg-slate-800 p-2 text-slate-300 hover:bg-slate-700 hover:text-white"
            title="Süreyi Sıfırla (45s)"
          >
            <RotateCcw className="size-4" />
          </button>
        </div>

        {/* Right Action Controls */}
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={toggleFullscreen}
            className="flex items-center gap-2 rounded-xl border border-slate-700 bg-slate-800 px-4 py-2.5 text-sm font-bold text-slate-200 hover:bg-slate-700"
            title="Tam Ekran (F11)"
          >
            {isFullscreen ? <Minimize2 className="size-4" /> : <Maximize2 className="size-4" />}
            <span className="hidden sm:inline">{isFullscreen ? "Pencereye Dön" : "Tam Ekran"}</span>
          </button>

          <button
            type="button"
            onClick={onClose}
            className="flex size-11 items-center justify-center rounded-xl bg-rose-600/20 text-rose-400 hover:bg-rose-600 hover:text-white transition-colors"
            title="Kapat (Esc)"
          >
            <X className="size-6" />
          </button>
        </div>
      </header>

      {/* Main Classroom Projection Body */}
      <main className="flex-1 overflow-y-auto p-8 lg:p-14 flex flex-col justify-center max-w-6xl mx-auto w-full">
        {/* Large Question Text */}
        <div className="rounded-3xl border border-slate-800 bg-slate-900/60 p-8 lg:p-12 shadow-2xl backdrop-blur-md">
          <div className="flex items-center justify-between mb-4">
            <span className="rounded-xl bg-indigo-500/20 px-4 py-1.5 text-sm font-black text-indigo-400">
              SORU {currentIndex + 1}
            </span>
            <span className="text-xs font-semibold text-slate-400">
              Sunucu Kumandası: [←] Önceki · [→] Sonraki · [Boşluk] Sayaç · [Enter] Çözüm
            </span>
          </div>

          <p className="text-2xl sm:text-4xl lg:text-5xl font-black text-slate-50 leading-snug tracking-tight">
            {currentQ.text}
          </p>
        </div>

        {/* Options Grid */}
        {showOptions ? (
          <div className="mt-8 grid grid-cols-1 md:grid-cols-2 gap-4 lg:gap-6 animate-in fade-in duration-200">
            {currentQ.options.map((opt, oi) => {
              const isCorrect = currentQ.correctIndex !== undefined && currentQ.correctIndex === oi;
              const isRevealed = revealedAnswer && isCorrect;

              return (
                <div
                  key={oi}
                  className={`flex items-center gap-5 rounded-2xl border p-5 lg:p-6 transition-all shadow-md ${
                    isRevealed
                      ? "border-emerald-500 bg-emerald-950/60 text-emerald-100 ring-4 ring-emerald-500/30 scale-[1.01]"
                      : "border-slate-800 bg-slate-900/40 text-slate-200 hover:border-slate-700 hover:bg-slate-900"
                  }`}
                >
                  <span
                    className={`flex size-12 shrink-0 items-center justify-center rounded-xl text-xl font-black ${
                      isRevealed
                        ? "bg-emerald-500 text-slate-950"
                        : "bg-slate-800 text-slate-300"
                    }`}
                  >
                    {String.fromCharCode(65 + oi)}
                  </span>
                  <span className="text-xl sm:text-2xl font-bold leading-relaxed">{opt}</span>
                  {isRevealed && (
                    <CheckCircle2 className="size-8 ml-auto text-emerald-400 shrink-0" />
                  )}
                </div>
              );
            })}
          </div>
        ) : (
          <div className="mt-12 rounded-2xl border border-dashed border-slate-800 p-8 text-center text-slate-500">
            Şıklar gizlendi. Öğrencilerden cevabı tahmin etmelerini isteyin.
          </div>
        )}
      </main>

      {/* Bottom Control Bar */}
      <footer className="flex h-24 items-center justify-between border-t border-slate-800 bg-slate-900/90 px-8 backdrop-blur-md">
        <button
          type="button"
          disabled={currentIndex === 0}
          onClick={() => {
            setCurrentIndex((c) => Math.max(0, c - 1));
            setRevealedAnswer(false);
            setTimerSeconds(45);
            setTimerRunning(false);
          }}
          className="flex items-center gap-3 rounded-2xl border border-slate-700 bg-slate-800 px-6 py-3.5 text-base font-black text-white hover:bg-slate-700 disabled:opacity-30 disabled:pointer-events-none"
        >
          <ChevronLeft className="size-6" />
          <span>Önceki Soru</span>
        </button>

        {/* Center Toggle Controls */}
        <div className="flex items-center gap-4">
          <button
            type="button"
            onClick={() => setShowOptions((s) => !s)}
            className="flex items-center gap-2 rounded-2xl border border-slate-700 bg-slate-800/80 px-5 py-3 text-sm font-bold text-slate-200 hover:bg-slate-700"
          >
            {showOptions ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
            <span>{showOptions ? "Şıkları Gizle" : "Şıkları Göster"}</span>
          </button>

          <button
            type="button"
            onClick={() => setRevealedAnswer((r) => !r)}
            className={`flex items-center gap-2 rounded-2xl px-6 py-3.5 text-sm font-black shadow-lg transition-all ${
              revealedAnswer
                ? "bg-emerald-600 text-white hover:bg-emerald-500 ring-2 ring-emerald-400"
                : "bg-gradient-to-r from-amber-500 to-orange-500 text-white hover:brightness-110"
            }`}
          >
            <CheckCircle2 className="size-5" />
            <span>{revealedAnswer ? "Doğru Cevap Açıklandı ✅" : "Doğru Cevabı Göster (Enter)"}</span>
          </button>
        </div>

        <button
          type="button"
          disabled={currentIndex === questions.length - 1}
          onClick={() => {
            setCurrentIndex((c) => Math.min(questions.length - 1, c + 1));
            setRevealedAnswer(false);
            setTimerSeconds(45);
            setTimerRunning(false);
          }}
          className="flex items-center gap-3 rounded-2xl bg-gradient-to-r from-indigo-500 to-violet-600 px-7 py-3.5 text-base font-black text-white shadow-lg hover:brightness-110 disabled:opacity-30 disabled:pointer-events-none"
        >
          <span>Sonraki Soru</span>
          <ChevronRight className="size-6" />
        </button>
      </footer>
    </div>
  );
}
