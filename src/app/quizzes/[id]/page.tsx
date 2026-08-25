"use client";

import { useParams, useRouter } from "next/navigation";
import { useEffect, useState } from "react";

type SolvePayload = {
  id: string;
  title: string;
  description: string | null;
  totalQuestions: number;
  questions: { text: string; options: string[] }[];
};

type Phase =
  | { kind: "loading" }
  | { kind: "error"; message: string }
  | { kind: "playing" }
  | { kind: "grading" }
  | { kind: "done"; correct: number; total: number; score: number };

export default function SolveQuizPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const quizId = params.id;

  const [phase, setPhase] = useState<Phase>({ kind: "loading" });
  const [quiz, setQuiz] = useState<SolvePayload | null>(null);
  const [index, setIndex] = useState(0);
  const [selected, setSelected] = useState<number | null>(null);
  const [answers, setAnswers] = useState<number[]>([]);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    fetch(`/api/quizzes/user/${quizId}/solve`, { method: "POST" })
      .then(async (r) => {
        const body = await r.json().catch(() => null);
        if (!r.ok) throw new Error(body?.error ?? `HTTP ${r.status}`);
        return body.data as SolvePayload;
      })
      .then((data) => {
        setQuiz(data);
        setPhase({ kind: "playing" });
      })
      .catch((err: Error) => setPhase({ kind: "error", message: err.message }));
  }, [quizId]);

  async function finish(finalAnswer: number) {
    if (!quiz) return;
    const allAnswers = [...answers, finalAnswer];
    setPhase({ kind: "grading" });
    try {
      const response = await fetch(`/api/quizzes/user/${quizId}/grade`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ answers: allAnswers }),
      });
      const body = await response.json().catch(() => null);
      if (!response.ok) throw new Error(body?.error ?? "Değerlendirilemedi");
      setPhase({
        kind: "done",
        correct: body.data.correct,
        total: body.data.total,
        score: body.data.score,
      });
    } catch {
      setPhase({ kind: "error", message: "Değerlendirme başarısız oldu." });
    }
  }

  function next() {
    if (selected === null || !quiz) return;
    const isLast = index + 1 >= quiz.totalQuestions;
    const allAnswers = [...answers, selected];
    setAnswers(allAnswers);

    if (isLast) {
      void finish(selected);
      return;
    }
    setIndex((i) => i + 1);
    setSelected(null);
  }

  if (phase.kind === "loading" || phase.kind === "grading") {
    return (
      <div className="grid min-h-screen place-items-center bg-slate-50 text-sm font-bold text-slate-400">
        {phase.kind === "grading" ? "Sonuçlar hesaplanıyor..." : "Yükleniyor..."}
      </div>
    );
  }

  if (phase.kind === "error") {
    return (
      <div className="grid min-h-screen place-items-center bg-slate-50 p-6">
        <div className="max-w-md rounded-2xl border border-slate-100 bg-white p-6 text-center shadow-sm">
          <p className="text-3xl">😕</p>
          <p className="mt-2 text-sm font-bold text-slate-600">{phase.message}</p>
          <button
            type="button"
            onClick={() => router.push("/quizzes")}
            className="tap-scale mt-4 rounded-xl bg-slate-900 px-6 py-2.5 text-sm font-black text-white"
          >
            Quiz Arena&apos;ya Dön
          </button>
        </div>
      </div>
    );
  }

  if (phase.kind === "done") {
    const emoji =
      phase.correct === phase.total ? "🏆" : phase.correct > phase.total / 2 ? "👏" : "💪";
    return (
      <div className="min-h-screen bg-slate-50 px-4 pb-20 pt-10">
        <div className="mx-auto max-w-md rounded-3xl border border-slate-100 bg-white p-8 text-center shadow-sm">
          <p className="text-5xl">{emoji}</p>
          <h1 className="mt-3 text-2xl font-black text-night">
            {phase.correct}/{phase.total} doğru!
          </h1>
          <p className="mt-1 text-4xl font-black text-indigo-600">{phase.score} puan</p>
          <div className="mt-6 space-y-2">
            <button
              type="button"
              onClick={() => {
                void navigator.clipboard?.writeText(window.location.href);
                setCopied(true);
              }}
              className="tap-scale w-full rounded-xl bg-gradient-to-r from-fuchsia-500 to-purple-600 py-3.5 text-sm font-black text-white shadow-lg transition hover:brightness-110"
            >
              {copied ? "✅ Link kopyalandı!" : "🔗 Meydan okumak için linki paylaş"}
            </button>
            <button
              type="button"
              onClick={() => router.push("/quizzes")}
              className="tap-scale w-full rounded-xl border border-slate-200 py-3 text-sm font-black text-slate-600 transition hover:bg-slate-50"
            >
              Quiz Arena&apos;ya Dön
            </button>
          </div>
        </div>
      </div>
    );
  }

  const question = quiz!.questions[index];

  return (
    <div className="min-h-screen bg-slate-50 pb-20">
      <header className="sticky top-0 z-20 flex items-center justify-between border-b border-slate-100 bg-white/80 px-4 py-3 backdrop-blur-md">
        <span className="rounded-full bg-indigo-50 px-3 py-1 text-xs font-black text-indigo-600">
          {index + 1} / {quiz!.totalQuestions}
        </span>
        <h1 className="truncate px-3 text-sm font-bold text-night">{quiz!.title}</h1>
        <span className="text-xs font-black text-slate-400">✏️</span>
      </header>

      <main className="mx-auto max-w-xl p-4">
        <div className="h-1.5 overflow-hidden rounded-full bg-slate-200">
          <div
            className="h-full rounded-full bg-indigo-500 transition-all"
            style={{
              width: `${((index + (selected !== null ? 1 : 0)) / quiz!.totalQuestions) * 100}%`,
            }}
          />
        </div>

        <p className="mt-6 mb-5 text-lg font-black leading-relaxed text-night">{question.text}</p>

        <div className="space-y-2.5">
          {question.options.map((opt, oi) => (
            <button
              key={oi}
              type="button"
              onClick={() => setSelected(oi)}
              disabled={selected !== null && selected !== oi}
              className={`tap-scale w-full rounded-2xl border p-4 text-left text-sm font-bold transition ${
                selected === oi
                  ? "!border-indigo-500 !bg-indigo-50 ring-2 ring-indigo-200"
                  : "border-slate-200 bg-white hover:border-indigo-300 hover:bg-indigo-50/50 disabled:opacity-60"
              }`}
            >
              <span className="mr-2 inline-flex h-6 w-6 items-center justify-center rounded-full bg-slate-100 text-xs font-black text-slate-500">
                {String.fromCharCode(65 + oi)}
              </span>
              {opt}
            </button>
          ))}
        </div>

        {selected !== null ? (
          <button
            type="button"
            onClick={next}
            className="tap-scale mt-6 w-full rounded-2xl bg-gradient-to-r from-indigo-500 to-blue-600 py-4 text-sm font-black text-white shadow-lg transition hover:brightness-110"
          >
            {index + 1 >= quiz!.totalQuestions ? "Bitir ve Sonucu Gör" : "Sonraki Soru →"}
          </button>
        ) : null}
      </main>
    </div>
  );
}
