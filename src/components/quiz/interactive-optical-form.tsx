"use client";

import { useMemo } from "react";
import { Check, CheckCircle2, Clock, RotateCcw, X, XCircle } from "lucide-react";

export interface InteractiveOpticalFormProps {
  totalQuestions: number;
  optionsCount?: number; // 4 (A-D) or 5 (A-E)
  answers: (number | null)[];
  onSelectAnswer: (questionIndex: number, optionIndex: number | null) => void;
  activeQuestionIndex?: number;
  onJumpToQuestion?: (questionIndex: number) => void;
  isSubmitted?: boolean;
  correctAnswers?: (number | null)[];
  timerSeconds?: number;
  examTitle?: string;
  className?: string;
}

export function InteractiveOpticalForm({
  totalQuestions,
  optionsCount = 4,
  answers,
  onSelectAnswer,
  activeQuestionIndex,
  onJumpToQuestion,
  isSubmitted = false,
  correctAnswers,
  timerSeconds,
  examTitle = "Optik Cevap Formu",
  className = "",
}: InteractiveOpticalFormProps) {
  const letters = useMemo(
    () => Array.from({ length: optionsCount }, (_, i) => String.fromCharCode(65 + i)),
    [optionsCount],
  );

  const stats = useMemo(() => {
    let filled = 0;
    let correct = 0;
    let wrong = 0;
    let empty = 0;

    for (let i = 0; i < totalQuestions; i++) {
      const ans = answers[i];
      if (ans !== null && ans !== undefined) {
        filled++;
        if (correctAnswers && correctAnswers[i] !== undefined) {
          if (ans === correctAnswers[i]) correct++;
          else wrong++;
        }
      } else {
        empty++;
      }
    }

    // Standard MEB net formula (3 wrong takes 1 correct)
    const net = Math.max(0, correct - wrong / 3);

    return { filled, empty, correct, wrong, net: Number(net.toFixed(2)) };
  }, [totalQuestions, answers, correctAnswers]);

  function formatTime(secs: number) {
    const mins = Math.floor(secs / 60);
    const rem = secs % 60;
    return `${mins.toString().padStart(2, "0")}:${rem.toString().padStart(2, "0")}`;
  }

  function handleBubbleClick(qIdx: number, optIdx: number) {
    if (isSubmitted) return;
    if (typeof navigator !== "undefined" && navigator.vibrate) {
      navigator.vibrate(8);
    }
    // Toggle: if already chosen, toggle off or switch
    if (answers[qIdx] === optIdx) {
      onSelectAnswer(qIdx, null);
    } else {
      onSelectAnswer(qIdx, optIdx);
    }
  }

  return (
    <div
      className={`rounded-3xl border border-slate-200 bg-white p-4 shadow-sm font-sans ${className}`}
    >
      {/* Optical Sheet Header */}
      <div className="border-b border-slate-200 pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="flex size-7 items-center justify-center rounded-lg bg-indigo-600 text-xs font-black text-white">
              O
            </span>
            <div>
              <h3 className="text-xs font-black text-night uppercase tracking-wider">
                {examTitle}
              </h3>
              <p className="text-[0.65rem] font-bold text-slate-400">
                Dijital Optik Kodlama & Okuma
              </p>
            </div>
          </div>

          {timerSeconds !== undefined && !isSubmitted ? (
            <div className="flex items-center gap-1.5 rounded-xl border border-amber-200 bg-amber-50 px-2.5 py-1 text-xs font-black text-amber-800">
              <Clock className="size-3.5 text-amber-600" />
              <span>{formatTime(timerSeconds)}</span>
            </div>
          ) : null}
        </div>

        {/* Live Counters */}
        <div className="mt-2.5 flex items-center justify-between text-[0.68rem] font-bold">
          {isSubmitted ? (
            <div className="flex w-full items-center justify-between rounded-xl bg-slate-50 p-2">
              <span className="text-emerald-600 font-black">✅ {stats.correct} Doğru</span>
              <span className="text-rose-600 font-black">❌ {stats.wrong} Yanlış</span>
              <span className="text-slate-500 font-black">⚪ {stats.empty} Boş</span>
              <span className="rounded-md bg-indigo-600 px-2 py-0.5 text-white font-black">
                {stats.net} Net
              </span>
            </div>
          ) : (
            <>
              <span className="text-indigo-600 font-black">
                ● {stats.filled} / {totalQuestions} Kodlandı
              </span>
              <span className="text-slate-400">
                ○ {stats.empty} Boş
              </span>
            </>
          )}
        </div>
      </div>

      {/* Optical Rows Grid */}
      <div className="mt-3 divide-y divide-slate-100 max-h-[460px] overflow-y-auto pr-1">
        {Array.from({ length: totalQuestions }, (_, qIdx) => {
          const selectedOpt = answers[qIdx];
          const isRowActive = activeQuestionIndex === qIdx;
          const correctOpt = correctAnswers ? correctAnswers[qIdx] : null;

          return (
            <div
              key={qIdx}
              onClick={() => onJumpToQuestion && onJumpToQuestion(qIdx)}
              className={`flex items-center justify-between py-2 px-2 rounded-xl transition ${
                isRowActive
                  ? "bg-indigo-50/70 ring-1 ring-indigo-200"
                  : "hover:bg-slate-50"
              }`}
            >
              {/* Question Number */}
              <div className="flex items-center gap-2">
                <span
                  className={`w-6 text-center text-xs font-black ${
                    isRowActive ? "text-indigo-600" : "text-slate-600"
                  }`}
                >
                  {(qIdx + 1).toString().padStart(2, "0")}
                </span>
              </div>

              {/* Bubbles A, B, C, D, (E) */}
              <div className="flex items-center gap-1.5 sm:gap-2">
                {letters.map((letter, optIdx) => {
                  const isSelected = selectedOpt === optIdx;
                  const isCorrect = isSubmitted && correctOpt === optIdx;
                  const isWrongSelection = isSubmitted && isSelected && correctOpt !== optIdx;

                  let bubbleClass = "border-slate-300 bg-white text-slate-700 hover:border-slate-400";
                  if (isSelected && !isSubmitted) {
                    // Realistic pencil filled circle
                    bubbleClass =
                      "border-slate-900 bg-slate-800 text-white shadow-xs font-black ring-2 ring-slate-400";
                  } else if (isCorrect) {
                    bubbleClass =
                      "border-emerald-600 bg-emerald-600 text-white font-black ring-2 ring-emerald-300";
                  } else if (isWrongSelection) {
                    bubbleClass =
                      "border-rose-500 bg-rose-500 text-white font-black line-through";
                  }

                  return (
                    <button
                      key={optIdx}
                      type="button"
                      disabled={isSubmitted}
                      onClick={(e) => {
                        e.stopPropagation();
                        handleBubbleClick(qIdx, optIdx);
                      }}
                      className={`flex size-6.5 sm:size-7 items-center justify-center rounded-full border text-[0.68rem] font-bold transition-all ${bubbleClass}`}
                      title={`${qIdx + 1}. Soru: ${letter} şıkkı`}
                    >
                      {letter}
                    </button>
                  );
                })}
              </div>

              {/* Clear Option Button */}
              <div className="w-6 text-right">
                {!isSubmitted && selectedOpt !== null && selectedOpt !== undefined ? (
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      onSelectAnswer(qIdx, null);
                    }}
                    className="text-slate-300 hover:text-rose-500 p-1"
                    title="Bu soruyu boş bırak"
                  >
                    <X className="size-3" />
                  </button>
                ) : null}

                {isSubmitted && (
                  <span className="text-[0.65rem] font-black">
                    {selectedOpt === correctOpt ? (
                      <span className="text-emerald-600">✓</span>
                    ) : selectedOpt === null ? (
                      <span className="text-slate-300">—</span>
                    ) : (
                      <span className="text-rose-500">✗</span>
                    )}
                  </span>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Akıllı Adaptif Telafi Köprüsü (Sosyal Medya Dikkat Dağınıklığını Eğitime Çevirme) */}
      {isSubmitted && (stats.wrong > 0 || stats.empty > 0) && (
        <div className="mt-5 rounded-2xl border border-indigo-100 bg-gradient-to-br from-indigo-50/80 via-white to-purple-50/50 p-4 shadow-xs">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="flex size-7 items-center justify-center rounded-xl bg-indigo-600 text-xs text-white">
                🎯
              </span>
              <div>
                <h4 className="text-xs font-black text-indigo-950">
                  Adaptif Telafi Önerisi ({stats.wrong} Yanlış · {stats.empty} Boş)
                </h4>
                <p className="text-[0.65rem] text-indigo-700 font-medium">
                  Rastgele içeriklerde vakit kaybetmeyin, zayıf olduğunuz soruların telafi haplarını izleyin.
                </p>
              </div>
            </div>
          </div>

          <div className="mt-3 grid grid-cols-1 sm:grid-cols-2 gap-2">
            <a
              href="/micro"
              className="tap-scale flex items-center justify-between rounded-xl bg-white p-2.5 border border-indigo-100 shadow-2xs hover:border-indigo-300 transition"
            >
              <div className="flex items-center gap-2">
                <span className="text-base">⚡</span>
                <div>
                  <p className="text-xs font-black text-night">60 Sn. Konu Hapları</p>
                  <p className="text-[0.62rem] text-slate-500">Yanlış yaptığın konunun kilit püf noktası</p>
                </div>
              </div>
              <span className="text-xs font-black text-indigo-600">İzle →</span>
            </a>

            <a
              href="/questions"
              className="tap-scale flex items-center justify-between rounded-xl bg-white p-2.5 border border-purple-100 shadow-2xs hover:border-purple-300 transition"
            >
              <div className="flex items-center gap-2">
                <span className="text-base">🙋</span>
                <div>
                  <p className="text-xs font-black text-night">Öğretmene Sor</p>
                  <p className="text-[0.62rem] text-slate-500">Çözemediğin sorunun fotoğrafını yükle</p>
                </div>
              </div>
              <span className="text-xs font-black text-purple-600">Sor →</span>
            </a>
          </div>
        </div>
      )}
    </div>
  );
}
