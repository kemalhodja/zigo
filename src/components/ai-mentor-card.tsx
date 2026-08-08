"use client";

import { useEffect, useState } from "react";

export function AiMentorCard() {
  const [advice, setAdvice] = useState<string | null>(null);
  const [visible, setVisible] = useState(true);
  const [loading, setLoading] = useState(false);
  const [activeTopic, setActiveTopic] = useState<string | null>(null);

  async function fetchAdvice(topicKey?: string) {
    if (loading) return;
    setLoading(true);
    if (topicKey) setActiveTopic(topicKey);

    try {
      const endpoint = topicKey ? "/api/ai/mentor" : "/api/ai/mentor";
      const options = topicKey
        ? {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ topic: topicKey }),
          }
        : { method: "GET" };

      const res = await fetch(endpoint, options);
      if (res.ok) {
        const data = await res.json();
        setAdvice(data.advice);
      }
    } catch {
      // silently fail in UI if AI is down
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void fetchAdvice();
  }, []);

  if (!visible || !advice) return null;

  return (
    <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-indigo-800 via-purple-800 to-violet-950 p-4 text-white shadow-xl ring-1 ring-white/20 transition-all">
      <button
        onClick={() => setVisible(false)}
        className="absolute right-3 top-3 rounded-full bg-white/10 p-1.5 transition-colors hover:bg-white/20"
        aria-label="Kapat"
        type="button"
      >
        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-white/80" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
        </svg>
      </button>

      <div className="flex items-start gap-3">
        <div className="flex size-11 shrink-0 items-center justify-center rounded-2xl bg-white/15 shadow-inner backdrop-blur">
          <span className="text-2xl animate-bounce">🤖</span>
        </div>
        <div className="flex-1 space-y-2 pr-6">
          <div className="flex flex-wrap items-center gap-2">
            <h3 className="font-black text-xs uppercase tracking-wider text-amber-300">Zigo AI Eğitim Koçu</h3>
            <span className="rounded-full bg-amber-400/20 px-2 py-0.5 text-[0.65rem] font-bold text-amber-200 border border-amber-300/30">
              Canlı Tavsiye
            </span>
          </div>

          <p className="text-sm font-semibold leading-relaxed text-white/95 transition-all min-h-[2.75rem]">
            {loading ? "Zigo AI yeni tavsiye oluşturuyor…" : advice}
          </p>

          <div className="flex flex-wrap items-center gap-1.5 pt-1">
            {[
              { key: "pomodoro", label: "⏱️ Pomodoro" },
              { key: "stress", label: "🧠 Sınav Stresi" },
              { key: "schedule", label: "📊 Program" },
              { key: "motivation", label: "🎯 Motivasyon" },
              { key: "exam_speed", label: "⚡ Soru Hızı" },
            ].map((chip) => (
              <button
                key={chip.key}
                type="button"
                onClick={() => void fetchAdvice(chip.key)}
                className={`rounded-full px-2.5 py-1 text-[0.7rem] font-bold transition backdrop-blur tap-scale ${
                  activeTopic === chip.key
                    ? "bg-amber-400 text-slate-950 font-black shadow-md"
                    : "bg-white/10 text-white hover:bg-white/20 border border-white/10"
                }`}
              >
                {chip.label}
              </button>
            ))}

            <button
              type="button"
              onClick={() => {
                setActiveTopic(null);
                void fetchAdvice();
              }}
              className="ml-auto flex items-center gap-1 rounded-full bg-white/15 px-2.5 py-1 text-[0.7rem] font-black text-amber-200 hover:bg-white/25 transition tap-scale"
            >
              🔄 Yeni Tavsiye
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

