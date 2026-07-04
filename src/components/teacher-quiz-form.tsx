"use client";

import { useState } from "react";

import { TeacherCreatorPlusLock } from "@/components/teacher-creator-plus-lock";
import { useMessages } from "@/lib/i18n/locale-context";

type AreaOption = {
  id: number;
  area_name: string;
};

type TeacherQuizFormProps = {
  areas: AreaOption[];
  canCreateQuizzes?: boolean;
  allowDevActivate?: boolean;
};

type Status = "idle" | "saving" | "saved" | "error";

export function TeacherQuizForm({
  areas,
  canCreateQuizzes = false,
  allowDevActivate = false,
}: TeacherQuizFormProps) {
  const { teacherForms: t, actions: a } = useMessages();
  const [status, setStatus] = useState<Status>("idle");
  const [message, setMessage] = useState("");

  async function submitQuiz(formData: FormData) {
    if (!canCreateQuizzes) {
      setStatus("error");
      setMessage("Mini quiz oluşturmak için Zigo Plus aboneliği gerekir.");
      return;
    }

    setStatus("saving");
    setMessage("");

    const options = String(formData.get("options") ?? "")
      .split("\n")
      .map((option) => option.trim())
      .filter(Boolean);

    try {
      const response = await fetch("/api/quizzes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          areaId: formData.get("areaId"),
          title: formData.get("title"),
          questionText: formData.get("questionText"),
          options,
          correctOption: formData.get("correctOption"),
          pointsReward: formData.get("pointsReward"),
        }),
      });

      if (response.ok) {
        setStatus("saved");
        setMessage(t.quizCreated);
        return;
      }

      const payload = (await response.json().catch(() => null)) as { error?: string } | null;
      setStatus("error");
      setMessage(payload?.error ?? t.quizCreateFailed);
    } catch {
      setStatus("error");
      setMessage(a.connectionFailedTryAgain);
    }
  }

  return (
    <form action={submitQuiz} className="-mx-4 space-y-4 border-b border-slate-100 bg-white px-4 py-4">
      <div>
        <p className="text-xs font-black uppercase tracking-[0.2em] text-slate-500">{t.miniQuiz}</p>
        <h3 className="text-xl font-black text-night">{t.createVerifiedQuiz}</h3>
      </div>

      <TeacherCreatorPlusLock
        allowDevActivate={allowDevActivate}
        description="Mini quiz oluşturup Match-Feed'e yayınlamak için Zigo Plus gerekir."
        isUnlocked={canCreateQuizzes}
        title="Mini quiz (Zigo Plus)"
      >
        <>
      <select
        className="w-full rounded-lg border border-slate-200 px-4 py-3 text-sm outline-none focus:border-night"
        defaultValue={areas[0]?.id ?? ""}
        name="areaId"
        required
      >
        {areas.length === 0 ? (
          <option value="">{t.assignAreasFirst}</option>
        ) : (
          areas.map((area) => (
            <option key={area.id} value={area.id}>
              {area.area_name}
            </option>
          ))
        )}
      </select>
      <input
        className="w-full rounded-lg border border-slate-200 px-4 py-3 text-sm outline-none focus:border-night"
        name="title"
        placeholder={t.quizTitlePlaceholder}
        required
      />
      <textarea
        className="min-h-24 w-full rounded-lg border border-slate-200 px-4 py-3 text-sm outline-none focus:border-night"
        name="questionText"
        placeholder={t.questionTextPlaceholder}
        required
      />
      <textarea
        className="min-h-28 w-full rounded-lg border border-slate-200 px-4 py-3 text-sm outline-none focus:border-night"
        name="options"
        placeholder={t.optionsPlaceholder}
        required
      />
      <div className="grid grid-cols-2 gap-3">
        <input
          className="rounded-lg border border-slate-200 px-4 py-3 text-sm outline-none focus:border-night"
          min={0}
          name="correctOption"
          placeholder={t.correctIndexPlaceholder}
          required
          type="number"
        />
        <input
          className="rounded-lg border border-slate-200 px-4 py-3 text-sm outline-none focus:border-night"
          defaultValue={10}
          min={1}
          name="pointsReward"
          placeholder={t.pointsRewardPlaceholder}
          type="number"
        />
      </div>

      <button
        className="w-full zigo-cta tap-scale rounded-lg px-4 py-3 text-sm font-black text-white disabled:opacity-60"
        disabled={status === "saving"}
        type="submit"
      >
        {status === "saving" ? t.creating : t.createQuiz}
      </button>

      {status === "saved" ? <p className="text-sm font-bold text-emerald-600">{message}</p> : null}
      {status === "error" ? (
        <p className="text-sm font-bold text-red-600">{message}</p>
      ) : null}
        </>
      </TeacherCreatorPlusLock>
    </form>
  );
}
