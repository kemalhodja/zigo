"use client";

import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";

import { useMessages } from "@/lib/i18n/locale-context";

type SafeDuelCardProps = {
  accent: string;
  areaId?: number;
  duelId: string;
  reward: string;
  title: string;
  topic: string;
};

type DuelState = "idle" | "matched" | "completed";

export function SafeDuelCard({ accent, areaId, duelId, reward, title, topic }: SafeDuelCardProps) {
  const { actions: a, safeDuelCard: d } = useMessages();
  const duelQuestions = useMemo(
    () => [
      { answer: "A", prompt: d.q1, options: ["A", "B", "C"] },
      { answer: "B", prompt: d.q2, options: ["A", "B", "C"] },
      { answer: "C", prompt: d.q3, options: ["A", "B", "C"] },
    ],
    [d.q1, d.q2, d.q3],
  );
  const router = useRouter();
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [score, setScore] = useState(0);
  const [state, setState] = useState<DuelState>("idle");
  const [message, setMessage] = useState("");
  const [isAwarding, setIsAwarding] = useState(false);
  const currentQuestion = duelQuestions[currentQuestionIndex];
  const progress = state === "completed"
    ? 100
    : state === "matched"
      ? ((currentQuestionIndex + 1) / duelQuestions.length) * 100
      : 0;

  function startDuel() {
    setCurrentQuestionIndex(0);
    setScore(0);
    setMessage("");
    setState("matched");
  }

  function answerQuestion(option: string) {
    if (state !== "matched") return;
    const isCorrect = option === currentQuestion.answer;
    const nextScore = score + (isCorrect ? 1 : 0);
    setScore(nextScore);

    if (currentQuestionIndex >= duelQuestions.length - 1) {
      setState("completed");
      void awardDuelPoints(nextScore);
      return;
    }

    setCurrentQuestionIndex((index) => index + 1);
  }

  async function awardDuelPoints(finalScore: number) {
    const requiredScore = Math.max(1, Math.ceil(duelQuestions.length / 2));

    if (finalScore < requiredScore) {
      setMessage(
        d.scoreTooLow
          .replace("{score}", String(finalScore))
          .replace("{total}", String(duelQuestions.length))
          .replace("{required}", String(requiredScore))
          .replace("{reward}", reward),
      );
      return;
    }

    setIsAwarding(true);
    setMessage(d.savingReward);

    try {
      const response = await fetch("/api/learning/duels/complete", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          duelId,
          score: finalScore,
          totalQuestions: duelQuestions.length,
          areaId,
        }),
      });

      const payload = (await response.json().catch(() => null)) as {
        data?: {
          already_awarded: boolean;
          points_awarded: number;
          total_points: number;
        };
        error?: string;
      } | null;

      if (!response.ok || !payload?.data) {
        if (response.status === 401) {
          setMessage(a.signInStudentDuel);
          return;
        }
        setMessage(payload?.error ?? a.duelRewardFailed);
        return;
      }

      setMessage(
        payload.data.already_awarded
          ? d.alreadyRewarded.replace("{points}", String(payload.data.total_points))
          : d.pointsEarned
              .replace("{earned}", String(payload.data.points_awarded))
              .replace("{total}", String(payload.data.total_points)),
      );
      router.refresh();
    } catch {
      setMessage(a.connectionFailedTryAgain);
    } finally {
      setIsAwarding(false);
    }
  }

  return (
    <article className="-mx-4 overflow-hidden border-b border-pink-100 bg-white">
      <div className={`bg-gradient-to-br ${accent} px-4 py-5 text-white`}>
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-xs font-black uppercase tracking-[0.18em] text-white/70">{topic}</p>
            <h2 className="mt-2 text-2xl font-black leading-tight">{title}</h2>
            <p className="mt-2 text-sm font-bold leading-6 text-white/82">{d.topicDesc}</p>
          </div>
          <span className="zigo-stat-chip rounded-lg bg-black/20 px-3 py-2 text-center text-sm font-black text-white backdrop-blur">
            {reward}
            <span className="zigo-fit-text mt-0.5 block text-[0.65rem] text-white/80">{d.rewardLabel}</span>
          </span>
        </div>
      </div>

      <div className="space-y-3 px-4 py-4">
        <div className="rounded-lg bg-slate-100 p-1">
          <span
            className={`block h-2 rounded-lg bg-gradient-to-r ${accent} transition-all`}
            style={{ width: `${progress}%` }}
          />
        </div>
        <div className="grid grid-cols-3 gap-2 text-center text-xs font-black">
          <DuelRule label={d.threeQuestions} />
          <DuelRule label={d.safeRival} />
          <DuelRule label={d.parentVisible} />
        </div>

        {state === "matched" ? (
          <div className="rounded-lg bg-violet-50 px-4 py-3">
            <p className="text-sm font-black text-night">{d.matchedTitle}</p>
            <p className="mt-1 text-sm font-bold leading-6 text-slate-600">{d.matchedDesc}</p>
            <div className="mt-3 rounded-lg bg-white px-3 py-3">
              <div className="flex items-center justify-between gap-3">
                <p className="text-xs font-black uppercase tracking-[0.14em] text-crystal">
                  {d.questionLabel
                    .replace("{current}", String(currentQuestionIndex + 1))
                    .replace("{total}", String(duelQuestions.length))}
                </p>
                <span className="rounded-lg bg-violet-50 px-2 py-1 text-[0.62rem] font-black text-crystal">
                  {d.scoreLabel
                    .replace("{score}", String(score))
                    .replace("{total}", String(duelQuestions.length))}
                </span>
              </div>
              <p className="mt-2 text-sm font-black text-night">{currentQuestion.prompt}</p>
              <div className="mt-3 grid grid-cols-3 gap-2">
                {currentQuestion.options.map((option) => (
                  <button
                    className="tap-scale zigo-cta tap-scale rounded-lg px-3 py-2 text-sm font-black text-white"
                    key={option}
                    onClick={() => answerQuestion(option)}
                    type="button"
                  >
                    {option}
                  </button>
                ))}
              </div>
              <p className="mt-3 text-[0.68rem] font-bold text-slate-500">{d.presetOnly}</p>
            </div>
          </div>
        ) : null}

        {state === "completed" ? (
          <div className="rounded-lg bg-emerald-50 px-4 py-3">
            <p className="text-sm font-black text-emerald-700">{d.completedTitle}</p>
            <p className="mt-1 text-sm font-bold leading-6 text-emerald-700">
              {d.completedDesc
                .replace("{score}", String(score))
                .replace("{total}", String(duelQuestions.length))}
            </p>
            {message ? (
              <p className="mt-2 text-sm font-bold leading-6 text-emerald-800">{message}</p>
            ) : null}
            <div className="mt-3 grid grid-cols-3 gap-2 text-center text-[0.62rem] font-black text-emerald-700">
              <span className="rounded-lg bg-white px-2 py-2">{d.noDm}</span>
              <span className="rounded-lg bg-white px-2 py-2">{d.presetAnswers}</span>
              <span className="rounded-lg bg-white px-2 py-2">{d.parentVisible}</span>
            </div>
          </div>
        ) : null}

        <button
          className="tap-scale w-full zigo-cta tap-scale rounded-lg px-4 py-3 text-sm font-black text-white disabled:opacity-60"
          disabled={isAwarding}
          onClick={startDuel}
          type="button"
        >
          {state === "idle" ? d.startDuel : state === "matched" ? d.restartDuel : d.playAnother}
        </button>
      </div>
    </article>
  );
}

function DuelRule({ label }: { label: string }) {
  return <span className="zigo-stat-chip rounded-lg bg-slate-100 px-2 py-2 text-slate-600">{label}</span>;
}
