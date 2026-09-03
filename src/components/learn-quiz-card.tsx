"use client";

import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";

import { InteractiveWhiteboard } from "@/components/interactive-whiteboard";
import { triggerConfetti } from "@/lib/client/confetti";
import { useMessages } from "@/lib/i18n/locale-context";
import type { Messages } from "@/lib/i18n/types";
import type { PublicQuizRow, QuizQuestionForPlay } from "@/lib/supabase/database.types";

type LearnQuizCardProps = {
  quiz: PublicQuizRow;
  childProfileId?: string;
};

type QuizPlayQuestion = {
  id: string;
  question_text: string;
  options: string[];
  sort_order: number;
};

export function LearnQuizCard({ quiz, childProfileId }: LearnQuizCardProps) {
  const { learnUi: l, actions: a } = useMessages();
  const router = useRouter();
  const [questions, setQuestions] = useState<QuizPlayQuestion[]>([]);
  const [loadingQuestions, setLoadingQuestions] = useState(true);
  const [questionsError, setQuestionsError] = useState(false);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<string, number>>({});
  const [selectedOption, setSelectedOption] = useState<number | null>(null);
  const [message, setMessage] = useState(l.solveToEarn.replace("{points}", String(quiz.points_reward)));
  const [result, setResult] = useState<{ scorePercent: number; pointsAwarded: number } | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isWhiteboardOpen, setIsWhiteboardOpen] = useState(false);

  const legacyOptions = Array.isArray(quiz.options) ? quiz.options : [];
  const activeQuestion = questions[currentIndex] ?? null;
  const isMultiQuestion = questions.length > 1;
  const displayOptions = activeQuestion?.options ?? legacyOptions;
  const displayPrompt = activeQuestion?.question_text ?? quiz.question_text;

  useEffect(() => {
    let cancelled = false;
    const expectsMulti = (quiz.question_count ?? 1) > 1;

    async function loadQuestions() {
      setLoadingQuestions(true);
      setQuestionsError(false);
      try {
        const response = await fetch(`/api/learn/quiz/${quiz.id}/questions`);
        const payload = (await response.json().catch(() => null)) as {
          data?: QuizQuestionForPlay[];
        } | null;

        if (cancelled) return;

        const rows = (payload?.data ?? []).map((row) => ({
          id: row.id,
          question_text: row.question_text,
          options: Array.isArray(row.options) ? row.options.map(String) : [],
          sort_order: row.sort_order,
        }));

        if (rows.length > 0) {
          setQuestions(rows as unknown as QuizPlayQuestion[]);
          return;
        }

        if (expectsMulti) {
          setQuestions([]);
          setQuestionsError(true);
          return;
        }

        if (legacyOptions.length > 0) {
          setQuestions([
            {
              id: quiz.id,
              question_text: String((quiz as { question_text?: string }).question_text || quiz.title || ""),
              options: legacyOptions.map(String),
              sort_order: 0,
            },
          ]);
        }
      } catch {
        if (cancelled) return;
        if (expectsMulti) {
          setQuestions([]);
          setQuestionsError(true);
          return;
        }
        if (legacyOptions.length > 0) {
          setQuestions([
            {
              id: quiz.id,
              question_text: String((quiz as { question_text?: string }).question_text || quiz.title || ""),
              options: legacyOptions.map(String),
              sort_order: 0,
            },
          ]);
        }
      } finally {
        if (!cancelled) setLoadingQuestions(false);
      }
    }

    void loadQuestions();
    return () => {
      cancelled = true;
    };
  }, [legacyOptions, quiz.id, quiz.question_count, quiz.question_text]);

  useEffect(() => {
    if (!activeQuestion) {
      setSelectedOption(null);
      return;
    }
    setSelectedOption(answers[activeQuestion.id] ?? null);
  }, [activeQuestion, answers]);

  const progressLabel = useMemo(() => {
    if (!isMultiQuestion) return null;
    return l.quizProgress
      .replace("{current}", String(currentIndex + 1))
      .replace("{total}", String(questions.length));
  }, [currentIndex, isMultiQuestion, l.quizProgress, questions.length]);

  async function submitQuiz() {
    if (isSubmitting || result) return;

    if (isMultiQuestion) {
      if (selectedOption === null || !activeQuestion) return;

      const nextAnswers = { ...answers, [activeQuestion.id]: selectedOption };
      setAnswers(nextAnswers);

      if (currentIndex < questions.length - 1) {
        setCurrentIndex((value) => value + 1);
        setMessage(l.nextQuestion);
        return;
      }

      setIsSubmitting(true);
      setMessage(l.submitting);

      try {
        const response = await fetch("/api/learn/quiz", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            quizId: quiz.id,
            answers: questions.map((question) => ({
              questionId: question.id,
              selectedOption: nextAnswers[question.id] ?? 0,
            })),
            childProfileId,
          }),
        });

        const payload = (await response.json().catch(() => null)) as {
          data?: { score_percent?: number; points_awarded?: number };
          error?: string;
        } | null;

        if (!response.ok || !payload?.data) {
          setMessage(payload?.error ?? l.quizSubmitFailed);
          return;
        }

        setResult({
          scorePercent: payload.data.score_percent ?? 0,
          pointsAwarded: payload.data.points_awarded ?? 0,
        });
        triggerConfetti();
        setMessage(
          l.quizScoreSummary
            .replace("{score}", String(payload.data.score_percent ?? 0))
            .replace("{points}", String(payload.data.points_awarded ?? 0)),
        );
        router.refresh();
      } catch {
        setMessage(a.connectionFailedTryAgain);
      } finally {
        setIsSubmitting(false);
      }

      return;
    }

    if (selectedOption === null) return;

    setIsSubmitting(true);
    setMessage(l.submitting);

    try {
      const response = await fetch("/api/learn/quiz", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          quizId: quiz.id,
          selectedOption,
          childProfileId,
        }),
      });

      const payload = (await response.json().catch(() => null)) as {
        data?: { is_correct: boolean; points_awarded: number };
        error?: string;
      } | null;

      if (!response.ok || !payload?.data) {
        setMessage(payload?.error ?? l.quizSubmitFailed);
        return;
      }

      setResult({
        scorePercent: payload.data.is_correct ? 100 : 0,
        pointsAwarded: payload.data.points_awarded,
      });
      setMessage(
        payload.data.is_correct
          ? l.correctEarn.replace("{points}", String(payload.data.points_awarded))
          : l.attemptSaved,
      );
      router.refresh();
    } catch {
      setMessage(a.connectionFailedTryAgain);
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <article className="-mx-4 space-y-4 border-b border-slate-100 bg-white px-4 py-4" data-testid="learn-quiz-card">
      <div>
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <span className="rounded-lg bg-slate-100 px-3 py-1 text-xs font-black text-night">
              {l.matchedQuiz}
            </span>
            {isMultiQuestion ? (
              <span className="rounded-lg bg-violet-50 px-3 py-1 text-xs font-black text-crystal">
                {questions.length} {l.questionsLabel}
              </span>
            ) : null}
          </div>

          <button
            type="button"
            onClick={() => setIsWhiteboardOpen(true)}
            className="tap-scale flex items-center gap-1.5 rounded-xl border border-violet-200 bg-violet-50/80 px-2.5 py-1 text-xs font-black text-violet-700 hover:bg-violet-100 transition shadow-2xs"
            title="İşlem yapmak veya soru üzerinde çizim yapmak için tahtayı aç"
          >
            <span>✏️</span>
            <span>Karalama Tahtası</span>
          </button>
        </div>
        <h3 className="mt-4 text-xl font-black text-night">{quiz.title}</h3>
        {progressLabel ? (
          <p className="mt-2 text-xs font-black uppercase tracking-[0.16em] text-crystal">{progressLabel}</p>
        ) : null}
        <p className="mt-2 text-sm leading-6 text-slate-600">{displayPrompt}</p>
      </div>

      <InteractiveWhiteboard
        isOpen={isWhiteboardOpen}
        onClose={() => setIsWhiteboardOpen(false)}
        title={`${quiz.title} · Karalama Alanı`}
      />

      {loadingQuestions ? (
        <p className="rounded-lg bg-slate-50 px-4 py-3 text-sm font-bold text-slate-500">{l.loadingQuestions}</p>
      ) : questionsError ? (
        <p className="rounded-lg bg-rose-50 px-4 py-3 text-sm font-bold text-rose-700">{l.questionsLoadFailed}</p>
      ) : (
        <div className="space-y-2" role="radiogroup" aria-label={l.matchedQuiz}>
          {displayOptions.map((option, index) => (
            <button
              aria-checked={selectedOption === index}
              className={`w-full rounded-lg border px-4 py-3 text-left text-sm font-bold ${
                result && selectedOption === index
                  ? result.scorePercent >= 50
                    ? "border-emerald-200 bg-emerald-50 text-emerald-700"
                    : "border-amber-200 bg-amber-50 text-amber-700"
                  : selectedOption === index
                    ? "border-crystal bg-violet-50 text-crystal"
                    : "border-slate-200 text-slate-700"
              }`}
              disabled={Boolean(result)}
              key={`${quiz.id}-${currentIndex}-${index}`}
              onClick={() => setSelectedOption(index)}
              role="radio"
              type="button"
            >
              <span className="flex items-center justify-between gap-3">
                <span>{String(option)}</span>
                {result && selectedOption === index ? (
                  <span className="rounded-lg bg-white px-2 py-1 text-[0.62rem] font-black">
                    {result.scorePercent >= 50 ? l.correct : l.review}
                  </span>
                ) : null}
              </span>
            </button>
          ))}
        </div>
      )}

      {result ? (
        <div
          className={`rounded-lg px-4 py-3 ${
            result.scorePercent >= 50 ? "bg-emerald-50 text-emerald-700" : "bg-amber-50 text-amber-700"
          }`}
        >
          <p className="text-sm font-black">
            {result.scorePercent >= 50 ? l.greatAnswer : l.learningMoment}
          </p>
          <p className="mt-1 text-sm font-bold leading-6">
            {getResultExplanation(result.scorePercent, result.pointsAwarded, l, a)}
          </p>
        </div>
      ) : null}

      <button
        className="w-full zigo-cta tap-scale rounded-lg px-4 py-3 text-sm font-black text-white disabled:opacity-60"
        disabled={
          selectedOption === null || isSubmitting || Boolean(result) || loadingQuestions || questionsError
        }
        onClick={submitQuiz}
        type="button"
      >
        {isSubmitting
          ? l.submitting
          : result
            ? l.resultSaved
            : isMultiQuestion && currentIndex < questions.length - 1
              ? l.nextQuestion
              : l.submitAnswer}
      </button>

      {result ? (
        <div className="flex flex-col gap-2 mt-1">
          <button
            className="w-full tap-scale rounded-lg bg-night px-4 py-3 text-sm font-black text-white shadow-md shadow-night/20 transition-transform active:scale-95 flex items-center justify-center gap-2"
            onClick={() => {
              const url = `${window.location.origin}/micro?q=${encodeURIComponent(quiz.title || "Quiz")}`;
              const text = `Zigo'da bu quizi çözdüm, sen de yapabilir misin? 🎯\n\n${quiz.title}`;
              if (navigator.share) {
                navigator.share({ title: 'Zigo Quiz Düellosu', text, url }).catch(() => {});
              } else {
                navigator.clipboard.writeText(`${text}\n${url}`);
                alert("Meydan okuma bağlantısı kopyalandı!");
              }
            }}
            type="button"
          >
            Arkadaşıma Meydan Oku ⚔️
          </button>
          
          {result.scorePercent < 50 && (
            <button
              className="w-full tap-scale rounded-lg bg-violet-600 px-4 py-3 text-sm font-black text-white shadow-md shadow-violet-600/20 transition-transform active:scale-95 flex items-center justify-center gap-2"
              onClick={() => {
                router.push("/questions");
              }}
              type="button"
            >
              🧑‍🏫 Anlamadım, Öğretmene Sor (Soru Havuzu)
            </button>
          )}
        </div>
      ) : null}

      <p className="rounded-lg bg-slate-50 px-4 py-3 text-sm font-bold text-slate-600">{message}</p>
    </article>
  );
}

function getResultExplanation(
  scorePercent: number,
  pointsAwarded: number,
  l: Messages["learnUi"],
  a: Messages["actions"],
) {
  if (scorePercent >= 50) {
    return pointsAwarded > 0
      ? l.earnedVerified.replace("{points}", String(pointsAwarded))
      : l.correctAlreadyRewarded;
  }

  return a.noQuizPoints;
}
