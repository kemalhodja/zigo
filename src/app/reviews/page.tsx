"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

type ReviewCard = {
  id: string;
  question_text: string;
  options: string[];
  due_at: string;
};

type CardState = {
  card: ReviewCard;
  revealed: boolean;
};

type Phase =
  | { kind: "loading" }
  | { kind: "error" }
  | { kind: "empty"; nextDueAt: string | null }
  | { kind: "playing" }
  | { kind: "done"; reviewed: number };

export default function ReviewsPage() {
  const router = useRouter();
  const [phase, setPhase] = useState<Phase>({ kind: "loading" });
  const [cards, setCards] = useState<ReviewCard[]>([]);
  const [cursor, setCursor] = useState(0);
  const [revealed, setRevealed] = useState(false);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    fetch("/api/reviews/today")
      .then(async (r) => {
        const body = await r.json().catch(() => null);
        if (!r.ok) throw new Error(body?.error ?? `HTTP ${r.status}`);
        return body.data as { cards: ReviewCard[]; nextDueAt: string | null };
      })
      .then((data) => {
        if (data.cards.length === 0) {
          setPhase({ kind: "empty", nextDueAt: data.nextDueAt });
          return;
        }
        setCards(data.cards);
        setPhase({ kind: "playing" });
      })
      .catch(() => setPhase({ kind: "error" }));
  }, [router]);

  if (phase.kind === "error") {
    return (
      <div className="grid min-h-screen place-items-center bg-slate-50 p-6">
        <div className="max-w-md rounded-2xl border border-slate-100 bg-white p-6 text-center shadow-sm">
          <p className="text-sm font-bold text-slate-600">Tekrarlar yüklenemedi.</p>
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

  async function answer(known: boolean) {
    const card = cards[cursor];
    if (!card || busy) return;
    setBusy(true);
    try {
      await fetch(`/api/reviews/${card.id}/answer`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ known }),
      });
    } catch {
      // keep flowing even if the write hiccups
    }

    if (cursor + 1 >= cards.length) {
      setPhase({ kind: "done", reviewed: cards.length });
      return;
    }
    setCursor((c) => c + 1);
    setRevealed(false);
    setBusy(false);
  }

  if (phase.kind === "loading") {
    return <div className="grid min-h-screen place-items-center bg-slate-50 text-sm font-bold text-slate-400">Yükleniyor...</div>;
  }

  if (phase.kind === "empty") {
    return (
      <div className="grid min-h-screen place-items-center bg-slate-50 p-6">
        <div className="max-w-md rounded-3xl border border-slate-100 bg-white p-8 text-center shadow-sm">
          <p className="text-5xl">🌿</p>
          <h1 className="mt-3 text-xl font-black text-night">Bugünün tekrarı bitti!</h1>
          <p className="mt-2 text-sm font-medium text-slate-500">
            {phase.nextDueAt
              ? `Sıradaki kartlar: ${new Date(phase.nextDueAt).toLocaleDateString("tr-TR", { day: "numeric", month: "long" })}`
              : "Quiz çözdükçe yanlışların burada kart olarak birikecek."}
          </p>
          <button
            type="button"
            onClick={() => router.push("/quizzes")}
            className="tap-scale mt-5 rounded-xl bg-gradient-to-r from-indigo-500 to-blue-600 px-8 py-3 text-sm font-black text-white shadow-lg"
          >
            Quiz Çöz
          </button>
        </div>
      </div>
    );
  }

  if (phase.kind === "done") {
    return (
      <div className="grid min-h-screen place-items-center bg-slate-50 p-6">
        <div className="max-w-md rounded-3xl border border-slate-100 bg-white p-8 text-center shadow-sm">
          <p className="text-5xl">🧠</p>
          <h1 className="mt-3 text-2xl font-black text-night">{phase.reviewed} kart tekrar edildi!</h1>
          <p className="mt-2 text-sm font-medium text-slate-500">
            Beynin bugün epey güçlendi. Yarın yeni kartlar hazır olacak.
          </p>
          <button
            type="button"
            onClick={() => router.push("/")}
            className="tap-scale mt-5 rounded-xl bg-slate-900 px-8 py-3 text-sm font-black text-white"
          >
            Ana Sayfaya Dön
          </button>
        </div>
      </div>
    );
  }

  const state: CardState | null = cards[cursor] ? { card: cards[cursor], revealed } : null;
  if (!state) return null;

  return (
    <div className="min-h-screen bg-slate-50 pb-20">
      <header className="sticky top-0 z-20 flex items-center justify-between border-b border-slate-100 bg-white/80 px-4 py-3 backdrop-blur-md">
        <span className="rounded-full bg-emerald-50 px-3 py-1 text-xs font-black text-emerald-600">
          🧠 Tekrar
        </span>
        <span className="text-xs font-black text-slate-500">
          {cursor + 1} / {cards.length}
        </span>
      </header>

      <main className="mx-auto max-w-xl p-4">
        <div className="mb-4 h-1.5 overflow-hidden rounded-full bg-slate-200">
          <div
            className="h-full rounded-full bg-emerald-500 transition-all"
            style={{ width: `${((cursor + (revealed ? 0.5 : 0)) / cards.length) * 100}%` }}
          />
        </div>

        <div className="rounded-3xl border border-slate-100 bg-white p-6 shadow-sm">
          <p className="text-xs font-black uppercase tracking-widest text-slate-400">Soru</p>
          <p className="mt-2 text-lg font-black leading-relaxed text-night">{state.card.question_text}</p>

          {revealed ? (
            <>
              <div className="mt-5 space-y-2">
                {state.card.options.map((opt, oi) => (
                  <div
                    key={oi}
                    className={`rounded-xl border p-3 text-sm font-bold ${
                      oi === 0
                        ? "border-emerald-300 bg-emerald-50 text-emerald-800"
                        : "border-slate-200 text-slate-600"
                    }`}
                  >
                    <span className="mr-2 inline-flex h-6 w-6 items-center justify-center rounded-full bg-white/70 text-xs font-black">
                      {String.fromCharCode(65 + oi)}
                    </span>
                    {opt}
                  </div>
                ))}
              </div>

              <div className="mt-6 grid grid-cols-2 gap-3">
                <button
                  type="button"
                  disabled={busy}
                  onClick={() => void answer(false)}
                  className="tap-scale rounded-2xl border-2 border-rose-200 bg-rose-50 py-3.5 text-sm font-black text-rose-600 transition hover:bg-rose-100 disabled:opacity-50"
                >
                  🔁 Tekrar Göreceğim
                </button>
                <button
                  type="button"
                  disabled={busy}
                  onClick={() => void answer(true)}
                  className="tap-scale rounded-2xl border-2 border-emerald-200 bg-emerald-50 py-3.5 text-sm font-black text-emerald-600 transition hover:bg-emerald-100 disabled:opacity-50"
                >
                  ✅ Biliyorum
                </button>
              </div>
            </>
          ) : (
            <button
              type="button"
              onClick={() => setRevealed(true)}
              className="tap-scale mt-6 w-full rounded-2xl bg-gradient-to-r from-emerald-500 to-teal-600 py-4 text-sm font-black text-white shadow-lg transition hover:brightness-110"
            >
              Cevabı Göster
            </button>
          )}
        </div>

        <p className="mt-4 text-center text-[0.65rem] font-bold uppercase tracking-widest text-slate-300">
          SM-2 algoritması · zorlandığın kartlar daha sık döner
        </p>
      </main>
    </div>
  );
}
