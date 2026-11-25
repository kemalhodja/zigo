"use client";

import { CheckCircle2, RotateCcw, XCircle } from "lucide-react";
import { useState } from "react";

import type { TopicQuestion } from "@/lib/domain/curriculum-topics";

export function TopicMiniQuiz({
  topicTitle,
  questions,
}: {
  topicTitle: string;
  questions: TopicQuestion[];
}) {
  const [answers, setAnswers] = useState<Record<number, number>>({});

  function handleSelect(qIndex: number, optionIndex: number) {
    if (answers[qIndex] !== undefined) return;
    if (typeof navigator !== "undefined" && navigator.vibrate) {
      navigator.vibrate(10);
    }
    setAnswers((prev) => ({ ...prev, [qIndex]: optionIndex }));
  }

  function handleReset() {
    setAnswers({});
  }

  const answeredCount = Object.keys(answers).length;
  const correctCount = questions.reduce(
    (acc, q, idx) => (answers[idx] === q.correctIndex ? acc + 1 : acc),
    0,
  );

  return (
    <section className="rounded-3xl border border-slate-200 bg-white p-5 sm:p-6 shadow-sm space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 pb-4">
        <div>
          <span className="text-[11px] font-black uppercase tracking-wider text-violet-600">
            İnteraktif Mini Test
          </span>
          <h2 className="text-lg sm:text-xl font-black text-night mt-0.5">
            {topicTitle} — Kendini Dene
          </h2>
        </div>
        <div className="flex items-center gap-3">
          {answeredCount > 0 ? (
            <span className="rounded-full bg-violet-50 px-3 py-1 text-xs font-black text-violet-700">
              {correctCount} / {questions.length} Doğru
            </span>
          ) : null}
          {answeredCount > 0 ? (
            <button
              type="button"
              onClick={handleReset}
              className="tap-scale inline-flex items-center gap-1.5 rounded-xl border border-slate-200 bg-slate-50 px-3 py-1.5 text-xs font-bold text-slate-700 hover:bg-slate-100 transition"
            >
              <RotateCcw className="size-3.5" />
              <span>Temizle</span>
            </button>
          ) : null}
        </div>
      </div>

      <div className="space-y-6">
        {questions.map((q, qIdx) => {
          const picked = answers[qIdx];
          const isAnswered = picked !== undefined;
          const isCorrect = picked === q.correctIndex;

          return (
            <div key={qIdx} className="space-y-3">
              <p className="text-sm sm:text-base font-bold text-night leading-relaxed">
                <span className="mr-2 inline-flex size-6 items-center justify-center rounded-lg bg-slate-100 text-xs font-black text-slate-700">
                  {qIdx + 1}
                </span>
                {q.question}
              </p>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                {q.options.map((opt, oIdx) => {
                  const isThisPicked = picked === oIdx;
                  const isRightOption = q.correctIndex === oIdx;

                  let btnClass =
                    "border-slate-200 bg-slate-50/70 text-slate-700 hover:border-violet-300 hover:bg-violet-50/50";
                  if (isAnswered) {
                    if (isRightOption) {
                      btnClass =
                        "border-emerald-500 bg-emerald-50 text-emerald-900 font-bold";
                    } else if (isThisPicked) {
                      btnClass =
                        "border-rose-400 bg-rose-50 text-rose-900 font-bold";
                    } else {
                      btnClass =
                        "border-slate-100 bg-slate-50 text-slate-400 opacity-75";
                    }
                  }

                  return (
                    <button
                      key={oIdx}
                      type="button"
                      disabled={isAnswered}
                      onClick={() => handleSelect(qIdx, oIdx)}
                      className={`tap-scale flex items-center justify-between gap-2 rounded-2xl border px-4 py-3 text-left text-xs sm:text-sm font-semibold transition ${btnClass}`}
                    >
                      <span>
                        <strong className="mr-2 font-black">
                          {String.fromCharCode(65 + oIdx)})
                        </strong>
                        {opt}
                      </span>
                      {isAnswered && isRightOption ? (
                        <CheckCircle2 className="size-4 shrink-0 text-emerald-600" />
                      ) : null}
                      {isAnswered && isThisPicked && !isRightOption ? (
                        <XCircle className="size-4 shrink-0 text-rose-500" />
                      ) : null}
                    </button>
                  );
                })}
              </div>

              {isAnswered ? (
                <div
                  className={`rounded-2xl border px-4 py-3 text-xs sm:text-sm font-medium leading-relaxed ${
                    isCorrect
                      ? "border-emerald-200 bg-emerald-50/70 text-emerald-900"
                      : "border-amber-200 bg-amber-50/80 text-amber-950"
                  }`}
                >
                  <strong className="font-black">
                    {isCorrect ? "Doğru! " : "Çözüm: "}
                  </strong>
                  {q.explanation}
                </div>
              ) : null}
            </div>
          );
        })}
      </div>
    </section>
  );
}
