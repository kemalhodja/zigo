"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

type DraftQuestion = {
  text: string;
  options: string[];
  correctIndex: number;
};

const EMPTY_QUESTION: DraftQuestion = { text: "", options: ["", "", "", ""], correctIndex: 0 };

export default function CreateQuizPage() {
  const router = useRouter();
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [questions, setQuestions] = useState<DraftQuestion[]>([{ ...EMPTY_QUESTION }]);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<{ id: string; status: string } | null>(null);

  function updateQuestion(index: number, patch: Partial<DraftQuestion>) {
    setQuestions((prev) => prev.map((q, i) => (i === index ? { ...q, ...patch } : q)));
  }

  async function submit() {
    setSubmitting(true);
    setError(null);
    try {
      const response = await fetch("/api/quizzes/user", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title, description: description || undefined, questions }),
      });
      const body = await response.json().catch(() => null);
      if (!response.ok) {
        setError(body?.error ?? "Quiz oluşturulamadı.");
        return;
      }
      setResult(body.data);
    } catch {
      setError("Bağlantı hatası. Tekrar deneyin.");
    } finally {
      setSubmitting(false);
    }
  }

  if (result) {
    return (
      <div className="min-h-screen bg-slate-50 px-4 pb-20 pt-10">
        <div className="mx-auto max-w-md rounded-3xl border border-slate-100 bg-white p-8 text-center shadow-sm">
          <p className="text-4xl">{result.status === "approved" ? "🎉" : "⏳"}</p>
          <h1 className="mt-3 text-xl font-black text-night">
            {result.status === "approved" ? "Quiz'in yayında!" : "Quiz'in onay bekliyor"}
          </h1>
          <p className="mt-2 text-sm font-medium text-slate-500">
            {result.status === "approved"
              ? "Linki paylaş, arkadaşların çözsün."
              : "Moderasyon ekibimiz kontrol ettikten sonra yayına alınacak."}
          </p>
          <div className="mt-6 space-y-2">
            <button
              type="button"
              onClick={() => {
                void navigator.clipboard?.writeText(
                  `${window.location.origin}/quizzes/${result.id}`,
                );
              }}
              className="tap-scale w-full rounded-xl bg-slate-900 py-3 text-sm font-black text-white transition hover:bg-slate-800"
            >
              🔗 Linki Kopyala
            </button>
            <button
              type="button"
              onClick={() => router.push("/quizzes")}
              className="tap-scale w-full rounded-xl border border-slate-200 py-3 text-sm font-black text-slate-600 transition hover:bg-slate-50"
            >
              Quiz Arena'ya Dön
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 pb-32">
      <header className="sticky top-0 z-20 flex items-center justify-between border-b border-slate-100 bg-white/80 px-4 py-3 backdrop-blur-md">
        <button
          type="button"
          onClick={() => router.push("/quizzes")}
          className="flex h-10 w-10 items-center justify-center rounded-full bg-slate-50 text-slate-500 hover:bg-slate-100"
        >
          ←
        </button>
        <h1 className="text-lg font-bold text-night">Quiz Oluştur</h1>
        <div className="w-10" />
      </header>

      <main className="mx-auto max-w-xl space-y-5 p-4">
        <div className="rounded-2xl border border-slate-100 bg-white p-4 shadow-sm">
          <label className="text-xs font-black uppercase tracking-wider text-slate-400">
            Başlık
          </label>
          <input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="örn: 8. Sınıf Üslü Sayılar Challenge"
            maxLength={80}
            className="mt-1 w-full rounded-xl border border-slate-200 p-3 text-sm font-bold outline-none focus:border-indigo-400"
          />
          <label className="mt-3 block text-xs font-black uppercase tracking-wider text-slate-400">
            Açıklama (isteğe bağlı)
          </label>
          <input
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            maxLength={200}
            className="mt-1 w-full rounded-xl border border-slate-200 p-3 text-sm outline-none focus:border-indigo-400"
          />
        </div>

        {questions.map((q, qi) => (
          <div key={qi} className="rounded-2xl border border-slate-100 bg-white p-4 shadow-sm">
            <div className="mb-2 flex items-center justify-between">
              <span className="text-xs font-black uppercase tracking-wider text-indigo-500">
                Soru {qi + 1}
              </span>
              {questions.length > 3 ? (
                <button
                  type="button"
                  onClick={() => setQuestions((prev) => prev.filter((_, i) => i !== qi))}
                  className="text-xs font-bold text-rose-500"
                >
                  Sil
                </button>
              ) : null}
            </div>
            <input
              value={q.text}
              onChange={(e) => updateQuestion(qi, { text: e.target.value })}
              placeholder="Soru metni"
              maxLength={240}
              className="w-full rounded-xl border border-slate-200 p-3 text-sm font-bold outline-none focus:border-indigo-400"
            />
            <div className="mt-3 grid grid-cols-2 gap-2">
              {q.options.map((opt, oi) => (
                <label
                  key={oi}
                  className={`flex items-center gap-2 rounded-xl border p-2 ${
                    q.correctIndex === oi ? "border-emerald-400 bg-emerald-50" : "border-slate-200"
                  }`}
                >
                  <input
                    type="radio"
                    name={`correct-${qi}`}
                    checked={q.correctIndex === oi}
                    onChange={() => updateQuestion(qi, { correctIndex: oi })}
                    className="accent-emerald-600"
                  />
                  <input
                    value={opt}
                    onChange={(e) =>
                      updateQuestion(qi, {
                        options: q.options.map((o, i) => (i === oi ? e.target.value : o)),
                      })
                    }
                    placeholder={`Seçenek ${oi + 1}`}
                    maxLength={80}
                    className="w-full bg-transparent text-sm font-semibold outline-none"
                  />
                </label>
              ))}
            </div>
            <p className="mt-2 text-[0.65rem] font-bold text-slate-400">
              Yeşil işaretli seçenek doğru cevaptır.
            </p>
          </div>
        ))}

        {questions.length < 10 ? (
          <button
            type="button"
            onClick={() => setQuestions((prev) => [...prev, { ...EMPTY_QUESTION }])}
            className="tap-scale w-full rounded-2xl border-2 border-dashed border-slate-200 py-3 text-sm font-black text-slate-500 transition hover:border-indigo-300 hover:text-indigo-600"
          >
            + Soru Ekle
          </button>
        ) : null}

        {error ? (
          <p className="rounded-xl bg-rose-50 p-3 text-sm font-bold text-rose-600">{error}</p>
        ) : null}
      </main>

      <div className="fixed inset-x-0 bottom-0 border-t border-slate-100 bg-white/95 p-4 backdrop-blur">
        <div className="mx-auto max-w-xl">
          <button
            type="button"
            disabled={submitting}
            onClick={submit}
            className="tap-scale w-full rounded-2xl bg-gradient-to-r from-fuchsia-500 to-purple-600 py-4 text-sm font-black text-white shadow-lg transition hover:brightness-110 disabled:opacity-50"
          >
            {submitting ? "Gönderiliyor..." : `Quiz'i Yayınla (${questions.length} soru)`}
          </button>
        </div>
      </div>
    </div>
  );
}
