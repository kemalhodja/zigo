"use client";

import { useParams, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import Link from "next/link";
import {
  Check,
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  HelpCircle,
  Keyboard,
  Monitor,
  RotateCcw,
  Sparkles,
  UserPlus,
  XCircle,
} from "lucide-react";

import { KeyboardShortcutsModal } from "@/components/ui/keyboard-shortcuts-modal";
import { SmartBoardPresenter } from "@/components/classroom/smart-board-presenter";
import { WhatsAppChallengeCard } from "@/components/share/whatsapp-challenge-card";

type QuestionItem = {
  text: string;
  options: string[];
  type?: "multiple_choice" | "true_false";
  difficulty?: "easy" | "medium" | "hard";
  imageUrl?: string | null;
};

type SolvePayload = {
  id: string;
  title: string;
  description: string | null;
  difficulty?: "easy" | "medium" | "hard" | "mixed";
  totalQuestions: number;
  questions: QuestionItem[];
};

type ResultItem = {
  correctIndex: number;
  explanation: string | null;
};

type Phase =
  | { kind: "loading" }
  | { kind: "error"; message: string }
  | { kind: "playing" }
  | { kind: "grading" }
  | {
      kind: "done";
      correct: number;
      total: number;
      score: number;
      isGuest?: boolean;
      results: ResultItem[];
      givenAnswers: number[];
    };

export default function SolveQuizPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const quizId = params.id;

  const [phase, setPhase] = useState<Phase>({ kind: "loading" });
  const [quiz, setQuiz] = useState<SolvePayload | null>(null);
  const [index, setIndex] = useState(0);
  const [selected, setSelected] = useState<number | null>(null);
  const [answers, setAnswers] = useState<number[]>([]);
  const [isGuest, setIsGuest] = useState(false);
  const [expandedReviews, setExpandedReviews] = useState<Record<number, boolean>>({});

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

  function restartQuiz() {
    setIndex(0);
    setSelected(null);
    setAnswers([]);
    setExpandedReviews({});
    setPhase({ kind: "playing" });
  }

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
        results: body.data.results || [],
        givenAnswers: allAnswers,
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

      const currentQuestion = quiz?.questions[index];
      const optCount = currentQuestion?.options.length || 0;
      const isTF = currentQuestion?.type === "true_false";

      let chosenIndex: number | null = null;
      if (key === "A" || num === 1 || (isTF && key === "D")) chosenIndex = 0;
      else if (key === "B" || num === 2 || (isTF && key === "Y")) chosenIndex = 1;
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
      <div className="grid min-h-screen place-items-center bg-slate-50 text-sm font-bold text-slate-500">
        <div className="text-center space-y-3">
          <div className="mx-auto size-10 animate-spin rounded-full border-3 border-indigo-600 border-t-transparent" />
          <p>{phase.kind === "grading" ? "Sonuçlar ve çözümler hesaplanıyor..." : "Sınav yükleniyor..."}</p>
        </div>
      </div>
    );
  }

  if (phase.kind === "error") {
    return (
      <div className="grid min-h-screen place-items-center bg-slate-50 p-6">
        <div className="max-w-md rounded-3xl border border-slate-100 bg-white p-6 text-center shadow-sm">
          <p className="text-4xl">😕</p>
          <h2 className="mt-2 text-base font-black text-night">Bir Sorun Oluştu</h2>
          <p className="mt-1 text-sm font-semibold text-slate-500">{phase.message}</p>
          <button
            type="button"
            onClick={() => router.push("/quizzes")}
            className="tap-scale mt-5 rounded-2xl bg-slate-900 px-6 py-3 text-xs font-black text-white hover:bg-slate-800"
          >
            Quiz Arena&apos;ya Dön
          </button>
        </div>
      </div>
    );
  }

  // Sınav Tamamlama & Çözüm İnceleme Ekranı
  if (phase.kind === "done") {
    const emoji =
      phase.correct === phase.total ? "🏆" : phase.correct >= phase.total / 2 ? "👏" : "💪";

    return (
      <div className="min-h-screen bg-slate-50 px-4 pb-24 pt-8">
        <div className="mx-auto max-w-xl space-y-5">
          {/* Sonuç Kartı */}
          <div className="rounded-3xl border border-slate-100 bg-white p-6 text-center shadow-sm">
            <p className="text-5xl">{emoji}</p>
            <h1 className="mt-3 text-2xl font-black text-night">
              {phase.correct} / {phase.total} Doğru!
            </h1>
            <p className="mt-1 text-3xl font-black text-indigo-600">{phase.score} Puan</p>

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

            {/* Viral WhatsApp Challenge Card */}
            <div className="mt-5">
              <WhatsAppChallengeCard
                title={quiz?.title || "Zigo MEB Quiz"}
                score={phase.score}
                type="quiz"
                detailText={`${phase.correct}/${phase.total} Doğru`}
                rewardPoints={50}
              />
            </div>

            {/* Aksiyon Butonları */}
            <div className="mt-5 grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={restartQuiz}
                className="tap-scale flex items-center justify-center gap-1.5 rounded-2xl border border-slate-200 py-3 text-xs font-black text-slate-700 hover:bg-slate-50 transition"
              >
                <RotateCcw className="size-3.5" />
                <span>Tekrar Çöz</span>
              </button>
              <button
                type="button"
                onClick={() => router.push("/quizzes")}
                className="tap-scale flex items-center justify-center rounded-2xl bg-slate-900 py-3 text-xs font-black text-white hover:bg-slate-800 transition"
              >
                Quiz Arena&apos;ya Dön
              </button>
            </div>
          </div>

          {/* Soru Çözümleri & Açıklamalar İnceleme Paneli */}
          {quiz && quiz.questions.length > 0 ? (
            <div className="space-y-3">
              <div className="flex items-center justify-between px-2">
                <h3 className="text-sm font-black uppercase tracking-wider text-slate-500">
                  📝 Detaylı Soru & Çözüm Analizi
                </h3>
                <span className="text-xs font-bold text-slate-400">
                  {phase.correct} Doğru · {phase.total - phase.correct} Yanlış
                </span>
              </div>

              <div className="space-y-3">
                {quiz.questions.map((q, qIdx) => {
                  const studentAnsIdx = phase.givenAnswers[qIdx] ?? -1;
                  const res = phase.results[qIdx];
                  const correctIdx = res ? res.correctIndex : -1;
                  const isCorrect = studentAnsIdx === correctIdx;
                  const explanation = res?.explanation;
                  const isExpanded = expandedReviews[qIdx] ?? true;

                  return (
                    <div
                      key={qIdx}
                      className={`overflow-hidden rounded-3xl border bg-white shadow-2xs transition ${
                        isCorrect ? "border-emerald-200" : "border-rose-200"
                      }`}
                    >
                      {/* Kart Başlığı */}
                      <div
                        onClick={() =>
                          setExpandedReviews((prev) => ({ ...prev, [qIdx]: !prev[qIdx] }))
                        }
                        className="flex cursor-pointer items-center justify-between p-4 bg-slate-50/50 hover:bg-slate-50"
                      >
                        <div className="flex items-center gap-3">
                          <span
                            className={`flex size-7 items-center justify-center rounded-full text-xs font-black text-white ${
                              isCorrect ? "bg-emerald-500" : "bg-rose-500"
                            }`}
                          >
                            {isCorrect ? "✓" : "✗"}
                          </span>
                          <div>
                            <span className="text-xs font-black text-night">
                              {qIdx + 1}. Soru:
                            </span>
                            <span className="ml-2 text-xs font-semibold text-slate-600 line-clamp-1">
                              {q.text}
                            </span>
                          </div>
                        </div>

                        <div className="flex items-center gap-2">
                          <span
                            className={`rounded-full px-2.5 py-0.5 text-[0.65rem] font-black ${
                              isCorrect
                                ? "bg-emerald-100 text-emerald-800"
                                : "bg-rose-100 text-rose-800"
                            }`}
                          >
                            {isCorrect ? "Doğru" : "Yanlış"}
                          </span>
                          {isExpanded ? (
                            <ChevronUp className="size-4 text-slate-400" />
                          ) : (
                            <ChevronDown className="size-4 text-slate-400" />
                          )}
                        </div>
                      </div>

                      {/* Açılır Ayrıntı */}
                      {isExpanded && (
                        <div className="border-t border-slate-100 p-4 space-y-3">
                          {q.imageUrl && (
                            <div className="relative overflow-hidden rounded-xl border border-slate-100 bg-slate-50">
                              {/* eslint-disable-next-line @next/next/no-img-element */}
                              <img
                                src={q.imageUrl}
                                alt="Soru Görseli"
                                className="max-h-48 w-full object-contain p-2"
                              />
                            </div>
                          )}

                          <p className="text-sm font-bold leading-relaxed text-night">{q.text}</p>

                          {/* Şıkların Dağılımı */}
                          <div className="space-y-1.5 pt-1">
                            {q.options.map((opt, oi) => {
                              const isGiven = studentAnsIdx === oi;
                              const isCorrectOpt = correctIdx === oi;

                              let bgClass = "border-slate-200 bg-white";
                              if (isCorrectOpt) {
                                bgClass = "border-emerald-400 bg-emerald-50/80 text-emerald-950 font-bold";
                              } else if (isGiven && !isCorrectOpt) {
                                bgClass = "border-rose-300 bg-rose-50 text-rose-950";
                              }

                              return (
                                <div
                                  key={oi}
                                  className={`flex items-center justify-between rounded-xl border px-3 py-2 text-xs transition ${bgClass}`}
                                >
                                  <div className="flex items-center gap-2">
                                    <span className="flex size-5 items-center justify-center rounded-full bg-slate-100 text-[0.65rem] font-black text-slate-600">
                                      {String.fromCharCode(65 + oi)}
                                    </span>
                                    <span>{opt}</span>
                                  </div>

                                  <div className="flex items-center gap-1.5 text-[0.65rem] font-black">
                                    {isGiven && (
                                      <span className="rounded-md bg-slate-200/80 px-1.5 py-0.5 text-slate-700">
                                        Senin Cevabın
                                      </span>
                                    )}
                                    {isCorrectOpt && (
                                      <span className="rounded-md bg-emerald-600 px-1.5 py-0.5 text-white">
                                        Doğru Cevap ✅
                                      </span>
                                    )}
                                  </div>
                                </div>
                              );
                            })}
                          </div>

                          {/* Öğretmenin Çözüm Açıklaması */}
                          {explanation && (
                            <div className="rounded-2xl border border-amber-200 bg-amber-50/80 p-3.5">
                              <div className="flex items-center gap-1.5 text-amber-900 font-black text-xs">
                                <Sparkles className="size-3.5 text-amber-600" />
                                <span>Öğretmenin Çözüm Notu & Formülü</span>
                              </div>
                              <p className="mt-1 text-xs font-semibold leading-relaxed text-amber-950">
                                {explanation}
                              </p>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          ) : null}
        </div>
      </div>
    );
  }

  // Phase: Playing (Soru Çözme Aşaması)
  const question = quiz!.questions[index];
  const isTF = question.type === "true_false";

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
    <div className="min-h-screen bg-slate-50 pb-24">
      {/* Schema.org JSON-LD Script for Google SEO Crawler */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />

      <header className="sticky top-0 z-20 flex items-center justify-between border-b border-slate-100 bg-white/85 px-4 py-3 backdrop-blur-md">
        <div className="flex items-center gap-2">
          <span className="rounded-full bg-indigo-50 px-3 py-1 text-xs font-black text-indigo-600">
            {index + 1} / {quiz!.totalQuestions}
          </span>
          <h1 className="truncate px-2 text-sm font-bold text-night max-w-[180px] sm:max-w-xs">
            {quiz!.title}
          </h1>
        </div>

        {/* Desktop Presentation & Shortcuts Actions */}
        <div className="flex items-center gap-2">
          {question.difficulty && (
            <span className="hidden sm:inline-block rounded-full bg-slate-100 px-2.5 py-1 text-[0.65rem] font-black text-slate-600">
              {question.difficulty === "easy"
                ? "🟢 Kolay"
                : question.difficulty === "hard"
                  ? "🟣 Yeni Nesil"
                  : "🔵 Orta"}
            </span>
          )}

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
        {/* İlerleme Çubuğu */}
        <div className="h-2 overflow-hidden rounded-full bg-slate-200">
          <div
            className="h-full rounded-full bg-gradient-to-r from-indigo-500 to-purple-600 transition-all duration-300"
            style={{
              width: `${((index + (selected !== null ? 1 : 0)) / quiz!.totalQuestions) * 100}%`,
            }}
          />
        </div>

        {/* Soru Görseli (Varsa) */}
        {question.imageUrl ? (
          <div className="relative mt-4 overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-2xs">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={question.imageUrl}
              alt="Soru Görseli"
              className="max-h-72 w-full object-contain p-3"
            />
          </div>
        ) : null}

        {/* Soru Metni */}
        <p className="mt-5 mb-5 text-lg font-black leading-relaxed text-night">{question.text}</p>

        {/* Seçenekler (2 şıklı Doğru/Yanlış veya 3/4/5 şıklı A, B, C, D, E) */}
        <div className={`space-y-2.5 ${isTF ? "grid grid-cols-1 sm:grid-cols-2 gap-3 space-y-0" : ""}`}>
          {question.options.map((opt, oi) => {
            const isSelected = selected === oi;
            const letter = String.fromCharCode(65 + oi);

            return (
              <button
                key={oi}
                type="button"
                onClick={() => setSelected(oi)}
                className={`tap-scale w-full rounded-2xl border p-4 text-left text-sm font-bold transition flex items-center justify-between ${
                  isSelected
                    ? "!border-indigo-500 !bg-indigo-50/90 ring-2 ring-indigo-200 shadow-xs"
                    : "border-slate-200 bg-white hover:border-indigo-300 hover:bg-indigo-50/40"
                }`}
              >
                <div className="flex items-center gap-3">
                  <span
                    className={`inline-flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-xs font-black ${
                      isSelected
                        ? "bg-indigo-600 text-white"
                        : "bg-slate-100 text-slate-600"
                    }`}
                  >
                    {isTF ? (oi === 0 ? "D" : "Y") : letter}
                  </span>
                  <span className="leading-snug">{opt}</span>
                </div>

                {/* Desktop key hint [A], [B], [C] */}
                <kbd className="hidden sm:inline-block rounded-md border border-slate-200 bg-slate-50 px-1.5 py-0.5 text-[0.65rem] font-mono font-bold text-slate-400">
                  {isTF ? (oi === 0 ? "D / 1" : "Y / 2") : `${letter} / ${oi + 1}`}
                </kbd>
              </button>
            );
          })}
        </div>

        {selected !== null ? (
          <button
            type="button"
            onClick={next}
            className="tap-scale mt-6 w-full rounded-2xl bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 py-4 text-sm font-black text-white shadow-lg transition hover:brightness-105"
          >
            {index + 1 >= quiz!.totalQuestions ? "Bitir ve Sonuçları İncele 🏁" : "Sonraki Soru (Enter) →"}
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
