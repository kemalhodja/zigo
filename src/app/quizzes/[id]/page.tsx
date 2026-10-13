"use client";

import { useParams, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import Link from "next/link";
import { Keyboard, Monitor, Sparkles, UserPlus } from "lucide-react";

import { KeyboardShortcutsModal } from "@/components/ui/keyboard-shortcuts-modal";
import { SmartBoardPresenter } from "@/components/classroom/smart-board-presenter";
import { WhatsAppChallengeCard } from "@/components/share/whatsapp-challenge-card";

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
  | { kind: "done"; correct: number; total: number; score: number; isGuest?: boolean };

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
  const [isGuest, setIsGuest] = useState(false);

  // Modal states
  const [isKeyboardHelpOpen, setIsKeyboardHelpOpen] = useState(false);
  const [isSmartBoardOpen, setIsSmartBoardOpen] = useState(false);

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
      if (body.data?.isGuest) {
        setIsGuest(true);
      }
      setPhase({
        kind: "done",
        correct: body.data.correct,
        total: body.data.total,
        score: body.data.score,
        isGuest: body.data?.isGuest,
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

  // Keyboard navigation shortcuts
  useEffect(() => {
    if (phase.kind !== "playing" || !quiz) return;

    function handleKeyDown(e: KeyboardEvent) {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) {
        return;
      }

      const key = e.key.toUpperCase();
      const num = parseInt(e.key, 10);

      // Option selection via A, B, C, D, E or 1, 2, 3, 4, 5
      const currentQuestion = quiz?.questions[index];
      const optCount = currentQuestion?.options.length || 0;

      let chosenIndex: number | null = null;
      if (key === "A" || num === 1) chosenIndex = 0;
      else if (key === "B" || num === 2) chosenIndex = 1;
      else if (key === "C" || num === 3) chosenIndex = 2;
      else if (key === "D" || num === 4) chosenIndex = 3;
      else if (key === "E" || num === 5) chosenIndex = 4;

      if (chosenIndex !== null && chosenIndex < optCount) {
        e.preventDefault();
        setSelected(chosenIndex);
        if (typeof navigator !== "undefined" && navigator.vibrate) {
          navigator.vibrate(10);
        }
      } else if (e.key === "Enter" || e.key === " ") {
        if (selected !== null) {
          e.preventDefault();
          next();
        }
      } else if (e.key === "?") {
        e.preventDefault();
        setIsKeyboardHelpOpen((o) => !o);
      }
    }

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [phase.kind, quiz, index, selected, answers]);

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

          {/* Guest PLG Conversion Callout */}
          {phase.isGuest && (
            <div className="mt-5 rounded-2xl border border-purple-200 bg-gradient-to-br from-purple-50 to-pink-50 p-4 text-left shadow-xs">
              <div className="flex items-center gap-2 text-purple-900 font-black text-xs mb-1">
                <Sparkles className="size-4 text-purple-600" />
                <span>Lig Puanını Kaydet!</span>
              </div>
              <p className="text-xs font-semibold text-purple-950 leading-relaxed">
                Tebrikler! Misafir olarak çözdün. Kazandığın <strong>{phase.score} puanı</strong> Zigo Lig sıralamasına eklemek ve rozet kazanmak için ücretsiz hesap açabilirsin.
              </p>
              <Link
                href="/auth"
                className="tap-scale mt-3 flex items-center justify-center gap-2 rounded-xl bg-purple-700 py-2.5 text-xs font-black text-white hover:bg-purple-800 shadow-xs"
              >
                <UserPlus className="size-3.5" />
                <span>Ücretsiz Hesap Aç & Puanı Kaydet</span>
              </Link>
            </div>
          )}

          {/* Viral WhatsApp Challenge Component */}
          <div className="mt-5">
            <WhatsAppChallengeCard
              title={quiz?.title || "Zigo MEB Quiz"}
              score={phase.score}
              type="quiz"
              detailText={`${phase.correct}/${phase.total} Doğru`}
              rewardPoints={50}
            />
          </div>

          <div className="mt-4">
            <button
              type="button"
              onClick={() => router.push("/quizzes")}
              className="tap-scale w-full rounded-2xl border border-slate-200 py-3 text-xs font-black text-slate-600 transition hover:bg-slate-50"
            >
              Quiz Arena&apos;ya Dön
            </button>
          </div>
        </div>
      </div>
    );
  }

  const question = quiz!.questions[index];

  // Schema.org Structured Data for Google SEO Rich Snippets
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Quiz",
    name: quiz!.title,
    description: quiz!.description || "Zigo MEB müfredatı interaktif quiz ve test soruları",
    educationalAlignment: {
      "@type": "AlignmentObject",
      alignmentType: "educationalSubject",
      educationalFramework: "MEB",
      targetName: "MEB Kazanım Testleri",
    },
    hasPart: quiz!.questions.map((q, qIdx) => ({
      "@type": "Question",
      name: `Soru ${qIdx + 1}`,
      text: q.text,
      suggestedAnswer: q.options.map((opt) => ({
        "@type": "Answer",
        text: opt,
      })),
    })),
  };

  return (
    <div className="min-h-screen bg-slate-50 pb-20">
      {/* Schema.org JSON-LD Script for Google SEO Crawler */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />

      <header className="sticky top-0 z-20 flex items-center justify-between border-b border-slate-100 bg-white/80 px-4 py-3 backdrop-blur-md">
        <div className="flex items-center gap-2">
          <span className="rounded-full bg-indigo-50 px-3 py-1 text-xs font-black text-indigo-600">
            {index + 1} / {quiz!.totalQuestions}
          </span>
          <h1 className="truncate px-2 text-sm font-bold text-night max-w-[180px] sm:max-w-xs">{quiz!.title}</h1>
        </div>

        {/* Desktop Presentation & Shortcuts Actions */}
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setIsSmartBoardOpen(true)}
            className="hidden sm:flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3 py-1.5 text-xs font-black text-slate-700 hover:bg-slate-100 shadow-2xs"
            title="Sınıf & Akıllı Tahta Modu (Projeksiyon)"
          >
            <Monitor className="size-3.5 text-amber-500" />
            <span>Akıllı Tahta</span>
          </button>

          <button
            type="button"
            onClick={() => setIsKeyboardHelpOpen(true)}
            className="hidden sm:flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-2.5 py-1.5 text-xs font-bold text-slate-500 hover:text-slate-800 shadow-2xs"
            title="Klavye Kısayolları (?)"
          >
            <Keyboard className="size-3.5" />
            <kbd className="font-mono text-[0.65rem] font-black">?</kbd>
          </button>
        </div>
      </header>

      <main className="mx-auto max-w-xl lg:max-w-2xl p-4">
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
              className={`tap-scale w-full rounded-2xl border p-4 text-left text-sm font-bold transition flex items-center justify-between ${
                selected === oi
                  ? "!border-indigo-500 !bg-indigo-50 ring-2 ring-indigo-200"
                  : "border-slate-200 bg-white hover:border-indigo-300 hover:bg-indigo-50/50 disabled:opacity-60"
              }`}
            >
              <div className="flex items-center gap-3">
                <span className="inline-flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-slate-100 text-xs font-black text-slate-500">
                  {String.fromCharCode(65 + oi)}
                </span>
                <span>{opt}</span>
              </div>

              {/* Desktop key hint [A], [B], [C] */}
              <kbd className="hidden sm:inline-block rounded-md border border-slate-200 bg-slate-50 px-1.5 py-0.5 text-[0.65rem] font-mono font-bold text-slate-400">
                {String.fromCharCode(65 + oi)}
              </kbd>
            </button>
          ))}
        </div>

        {selected !== null ? (
          <button
            type="button"
            onClick={next}
            className="tap-scale mt-6 w-full rounded-2xl bg-gradient-to-r from-indigo-500 to-blue-600 py-4 text-sm font-black text-white shadow-lg transition hover:brightness-110"
          >
            {index + 1 >= quiz!.totalQuestions ? "Bitir ve Sonucu Gör" : "Sonraki Soru (Enter) →"}
          </button>
        ) : null}
      </main>

      {/* Keyboard Shortcuts Modal */}
      <KeyboardShortcutsModal
        isOpen={isKeyboardHelpOpen}
        onClose={() => setIsKeyboardHelpOpen(false)}
      />

      {/* Classroom Smart Board Presenter Fullscreen Mode */}
      <SmartBoardPresenter
        isOpen={isSmartBoardOpen}
        onClose={() => setIsSmartBoardOpen(false)}
        title={quiz!.title}
        questions={quiz!.questions}
        initialIndex={index}
      />
    </div>
  );
}
