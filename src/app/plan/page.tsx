"use client";

import Link from "next/link";
import { useState } from "react";

type PlanBlock = {
  timeLabel: string;
  subject: string;
  task: string;
  minutes: number;
};

type StudyPlan = {
  summary: string;
  blocks: PlanBlock[];
  motivation: string;
  source: "ai" | "rule";
};

const SUBJECT_ICONS: Record<string, string> = {
  Tekrar: "🧠",
  "Soru Çözümü": "📝",
  Çalışma: "🎯",
  "Oyunla Öğren": "🎮",
};

export default function StudyPlanPage() {
  const [plan, setPlan] = useState<StudyPlan | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function generate() {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch("/api/ai/study-plan", { method: "POST" });
      const body = await response.json().catch(() => null);
      if (!response.ok) {
        setError(body?.error ?? "Plan oluşturulamadı.");
        return;
      }
      setPlan(body.data as StudyPlan);
    } catch {
      setError("Bağlantı hatası. Tekrar deneyin.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-slate-50 pb-20">
      <header className="sticky top-0 z-20 flex items-center justify-between border-b border-slate-100 bg-white/80 px-4 py-3 backdrop-blur-md">
        <Link
          href="/"
          className="flex h-10 w-10 items-center justify-center rounded-full bg-slate-50 text-slate-500 transition-colors hover:bg-slate-100"
        >
          ←
        </Link>
        <h1 className="text-lg font-bold text-night">🤖 AI Koç</h1>
        <div className="w-10" />
      </header>

      <main className="mx-auto max-w-xl space-y-5 p-4">
        {!plan && !loading && !error ? (
          <div className="rounded-3xl bg-gradient-to-br from-violet-600 to-indigo-700 p-8 text-center text-white shadow-lg">
            <p className="text-5xl">🧙‍♂️</p>
            <h2 className="mt-3 text-xl font-black">Bugünün planı seni bekliyor</h2>
            <p className="mx-auto mt-2 max-w-xs text-sm font-medium text-violet-100">
              Çalışma alışkanlıklarını, tekrar kartlarını ve quiz geçmişini analiz edip sana özel
              bir günlük plan hazırlıyorum.
            </p>
            <button
              type="button"
              onClick={generate}
              className="tap-scale mt-6 rounded-2xl bg-white px-10 py-3.5 text-sm font-black text-violet-700 shadow-xl transition hover:brightness-105"
            >
              Planımı Oluştur ✨
            </button>
          </div>
        ) : null}

        {loading ? (
          <div className="rounded-3xl border border-slate-100 bg-white p-8 text-center shadow-sm">
            <p className="animate-pulse text-sm font-black text-slate-500">
              Verilerin analiz ediliyor...
            </p>
          </div>
        ) : null}

        {error ? (
          <p className="rounded-xl bg-rose-50 p-4 text-sm font-bold text-rose-600">{error}</p>
        ) : null}

        {plan ? (
          <>
            <div
              className={`rounded-2xl p-5 text-white shadow-md ${
                plan.source === "ai"
                  ? "bg-gradient-to-br from-violet-600 to-indigo-700"
                  : "bg-gradient-to-br from-slate-700 to-slate-800"
              }`}
            >
              <p className="text-[0.65rem] font-black uppercase tracking-widest text-white/70">
                {plan.source === "ai" ? "✨ AI Koç analizi" : "📋 Zigo koçluk motoru"}
              </p>
              <p className="mt-1 text-sm font-semibold leading-relaxed">{plan.summary}</p>
            </div>

            <div className="space-y-3">
              {plan.blocks.map((block, i) => (
                <div
                  key={i}
                  className="flex items-start gap-3 rounded-2xl border border-slate-100 bg-white p-4 shadow-sm"
                >
                  <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-indigo-50 text-xl">
                    {SUBJECT_ICONS[block.subject] ?? "📚"}
                  </span>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-baseline justify-between gap-2">
                      <p className="truncate text-sm font-black text-night">{block.subject}</p>
                      <span className="shrink-0 rounded-full bg-emerald-50 px-2 py-0.5 text-xs font-black text-emerald-600">
                        {block.minutes} dk
                      </span>
                    </div>
                    <p className="mt-0.5 text-xs font-bold text-indigo-400">{block.timeLabel}</p>
                    <p className="mt-1 text-sm font-medium leading-relaxed text-slate-600">
                      {block.task}
                    </p>
                  </div>
                </div>
              ))}
            </div>

            <div className="rounded-2xl border border-amber-200 bg-amber-50 p-4">
              <p className="text-sm font-bold leading-relaxed text-amber-800">💡 {plan.motivation}</p>
            </div>

            <div className="grid grid-cols-2 gap-2">
              {plan.blocks.some((b) => b.subject === "Tekrar") ? (
                <Link
                  href="/reviews"
                  className="tap-scale rounded-2xl bg-slate-900 py-3 text-center text-sm font-black text-white transition hover:bg-slate-800"
                >
                  🧠 Tekrarlara Başla
                </Link>
              ) : (
                <Link
                  href="/quizzes"
                  className="tap-scale rounded-2xl bg-slate-900 py-3 text-center text-sm font-black text-white transition hover:bg-slate-800"
                >
                  🏆 Quiz Arena
                </Link>
              )}
              <Link
                href="/rooms"
                className="tap-scale rounded-2xl border border-slate-200 py-3 text-center text-sm font-black text-slate-600 transition hover:bg-slate-50"
              >
                🎯 Odak Odası
              </Link>
            </div>

            <button
              type="button"
              onClick={generate}
              className="tap-scale w-full rounded-2xl border border-dashed border-slate-300 py-3 text-xs font-black uppercase tracking-widest text-slate-400 transition hover:border-violet-300 hover:text-violet-500"
            >
              ↺ Planı Yenile
            </button>
          </>
        ) : null}
      </main>
    </div>
  );
}
