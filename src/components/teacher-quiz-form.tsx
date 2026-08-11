"use client";

import { useMemo, useState } from "react";

import { TeacherCreatorPlusLock } from "@/components/teacher-creator-plus-lock";
import { displayEducationAreaName } from "@/lib/domain/education-catalog";
import { INDIVIDUAL_GRADE_LEVEL_OPTIONS } from "@/lib/domain/grade-level";
import {
  TEACHER_QUIZ_OPTION_COUNT,
  TEACHER_QUIZ_QUESTION_COUNT,
} from "@/lib/domain/learning";
import { useMessages } from "@/lib/i18n/locale-context";
import { createClient } from "@/lib/supabase/client";

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

type QuizDraftQuestion = {
  questionText: string;
  options: string[];
  correctOption: number;
  imageUrl?: string; // Optional image URL for the question
};

const OPTION_LABELS = ["A", "B", "C", "D"] as const;

function emptyQuestion(): QuizDraftQuestion {
  return {
    questionText: "",
    options: Array.from({ length: TEACHER_QUIZ_OPTION_COUNT }, () => ""),
    correctOption: 0,
  };
}

function _createEmptyQuiz(): QuizDraftQuestion[] {
  return Array.from({ length: TEACHER_QUIZ_QUESTION_COUNT }, () => emptyQuestion());
}

function isQuestionComplete(question: QuizDraftQuestion) {
  if (question.questionText.trim().length < 10) return false;
  if (question.options.some((option) => option.trim().length === 0)) return false;
  if (question.correctOption < 0 || question.correctOption >= TEACHER_QUIZ_OPTION_COUNT) return false;
  const unique = new Set(question.options.map((option) => option.trim().toLocaleLowerCase("tr-TR")));
  return unique.size === TEACHER_QUIZ_OPTION_COUNT;
}

export function TeacherQuizForm({
  areas,
  canCreateQuizzes = false,
  allowDevActivate = false,
}: TeacherQuizFormProps) {
  const { teacherForms: t, actions: a } = useMessages();
  const [status, setStatus] = useState<Status>("idle");
  const [message, setMessage] = useState("");
  const [areaId, setAreaId] = useState(String(areas[0]?.id ?? ""));
  const [title, setTitle] = useState("");
  const [targetGrade, setTargetGrade] = useState("Hepsi (Tüm Sınıflar)");
  const [pointsReward, setPointsReward] = useState(100);
  const [activeIndex, setActiveIndex] = useState(0);
  const [questions, setQuestions] = useState<QuizDraftQuestion[]>(() => [emptyQuestion(), emptyQuestion(), emptyQuestion()]);

  const targetQuestionCount = questions.length;
  const completedCount = useMemo(
    () => questions.filter((question) => isQuestionComplete(question)).length,
    [questions],
  );
  const activeQuestion = questions[activeIndex] ?? emptyQuestion();
  const allComplete = completedCount === targetQuestionCount && title.trim().length >= 3 && Boolean(areaId);

  function updateActiveQuestion(patch: Partial<QuizDraftQuestion>) {
    setQuestions((current) =>
      current.map((question, index) => (index === activeIndex ? { ...question, ...patch } : question)),
    );
    if (status !== "saving") {
      setStatus("idle");
      setMessage("");
    }
  }

  function addQuestion() {
    if (questions.length >= 20) return;
    setQuestions((current) => [...current, emptyQuestion()]);
    setActiveIndex(questions.length);
  }

  function removeQuestion(indexToRemove: number) {
    if (questions.length <= 1) return;
    setQuestions((current) => current.filter((_, idx) => idx !== indexToRemove));
    setActiveIndex((current) => Math.max(0, current - 1));
  }

  function setQuestionPresetCount(count: number) {
    if (count < 1 || count > 20) return;
    if (count > questions.length) {
      const extraNeeded = count - questions.length;
      const newQuestions = Array.from({ length: extraNeeded }, () => emptyQuestion());
      setQuestions((current) => [...current, ...newQuestions]);
    } else if (count < questions.length) {
      setQuestions((current) => current.slice(0, count));
      if (activeIndex >= count) setActiveIndex(count - 1);
    }
  }

  function updateOption(optionIndex: number, value: string) {
    updateActiveQuestion({
      options: activeQuestion.options.map((option, index) => (index === optionIndex ? value : option)),
    });
  }

  async function submitQuiz() {
    if (!canCreateQuizzes) {
      setStatus("error");
      setMessage(`${t.quizRequiresPlus} Abonelik paketlerine yönlendiriliyorsunuz...`);
      setTimeout(() => {
        window.location.href = "/profile#zigo-plus-plans";
      }, 1500);
      return;
    }

    if (!allComplete) {
      setStatus("error");
      setMessage(`Quiz hazır değil. Lütfen belirlediğiniz tüm (${targetQuestionCount}) soruları eksiksiz doldurun.`);
      const firstIncomplete = questions.findIndex((question) => !isQuestionComplete(question));
      if (firstIncomplete >= 0) setActiveIndex(firstIncomplete);
      return;
    }

    setStatus("saving");
    setMessage("");

    try {
      const response = await fetch("/api/quizzes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          areaId,
          title: title.trim(),
          pointsReward,
          targetGrade,
          questions: questions.map((question) => ({
            questionText: question.questionText.trim(),
            options: question.options.map((option) => option.trim()),
            correctOption: question.correctOption,
            imageUrl: question.imageUrl, // optional image URL
          })),
        }),
      });

      if (response.ok) {
        setStatus("saved");
        setMessage(`Tebrikler! ${targetQuestionCount} soruluk quiziniz başarıyla yayınlandı.`);
        setTitle("");
        setPointsReward(100);
        setQuestions([emptyQuestion(), emptyQuestion(), emptyQuestion()]);
        setActiveIndex(0);
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
    <div className="-mx-4 space-y-4 border-b border-slate-100 bg-white px-4 py-4">
      <div>
        <p className="text-xs font-black uppercase tracking-[0.2em] text-slate-500">{t.proQuizEyebrow}</p>
        <h3 className="text-xl font-black text-night">{t.createVerifiedQuiz}</h3>
        <p className="mt-1 text-sm font-semibold text-slate-500">{t.proQuizDesc}</p>
      </div>

      <TeacherCreatorPlusLock
        allowDevActivate={allowDevActivate}
        description={t.proQuizLockDesc}
        isUnlocked={canCreateQuizzes}
        title={t.proQuizLockTitle}
      >
        <>
          {/* Soru Sayısı Belirleme & İlerleme */}
          <div className="rounded-xl border border-violet-100 bg-violet-50/70 p-3 space-y-3">
            <div className="flex flex-wrap items-center justify-between gap-2 border-b border-violet-100 pb-2.5">
              <div>
                <span className="text-[0.65rem] font-black uppercase tracking-wider text-violet-700">🎯 Soru Sayısı Belirleyin</span>
                <p className="text-xs font-black text-night">Bu Quiz Kaç Sorudan Oluşsun?</p>
              </div>
              <div className="flex gap-1">
                {[3, 5, 10, 15, 20].map((cnt) => (
                  <button
                    key={cnt}
                    type="button"
                    onClick={() => setQuestionPresetCount(cnt)}
                    className={`rounded-lg px-2.5 py-1 text-xs font-black transition ${
                      questions.length === cnt
                        ? "bg-violet-600 text-white shadow-xs"
                        : "bg-white text-slate-700 hover:bg-slate-100 border border-slate-200"
                    }`}
                  >
                    {cnt} Soru
                  </button>
                ))}
              </div>
            </div>

            <div className="flex items-center justify-between gap-3">
              <p className="text-xs font-black text-night">
                İlerleme: {completedCount} / {targetQuestionCount} Soru Tamamlandı
              </p>
              <div className="flex items-center gap-1">
                <button
                  type="button"
                  onClick={addQuestion}
                  disabled={questions.length >= 20}
                  className="rounded-lg bg-indigo-600 px-2.5 py-1 text-[0.68rem] font-black text-white hover:bg-indigo-700 disabled:opacity-50"
                >
                  ➕ Soru Ekle
                </button>
                {questions.length > 1 ? (
                  <button
                    type="button"
                    onClick={() => removeQuestion(activeIndex)}
                    className="rounded-lg bg-rose-100 px-2 py-1 text-[0.68rem] font-black text-rose-700 hover:bg-rose-200"
                  >
                    🗑️ Bu Soruyu Sil
                  </button>
                ) : null}
              </div>
            </div>

            <div className="flex flex-wrap gap-1.5 pt-1">
              {questions.map((question, index) => {
                const complete = isQuestionComplete(question);
                const isActive = index === activeIndex;
                return (
                  <button
                    aria-label={`Soru ${index + 1}`}
                    className={`flex h-7 min-w-7 items-center justify-center rounded-lg px-2 text-xs font-black transition ${
                      isActive
                        ? "bg-violet-600 text-white ring-2 ring-violet-400"
                        : complete
                          ? "bg-emerald-500 text-white"
                          : "bg-white text-slate-600 border border-slate-200"
                    }`}
                    key={index}
                    onClick={() => setActiveIndex(index)}
                    type="button"
                  >
                    {index + 1}
                  </button>
                );
              })}
            </div>
          </div>

          <select
            className="w-full rounded-lg border border-slate-200 px-4 py-3 text-sm outline-none focus:border-night"
            onChange={(event) => setAreaId(event.target.value)}
            required
            value={areaId}
          >
            {areas.length === 0 ? (
              <option value="">{t.assignAreasFirst}</option>
            ) : (
              areas.map((area) => (
                <option key={area.id} value={area.id}>
                  {displayEducationAreaName(area.area_name)}
                </option>
              ))
            )}
          </select>

          <div className="rounded-xl border border-slate-200 bg-slate-50/50 p-3 space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-xs font-black uppercase tracking-wider text-indigo-700">
                Hedef Sınıf Seviyesi <span className="text-rose-500 font-bold">* Zorunlu</span>
              </label>
              <span className="text-[0.65rem] font-bold text-slate-500">Seçilen: {targetGrade || "Seçilmedi"}</span>
            </div>
            <div className="grid grid-cols-2 gap-1.5 sm:grid-cols-3 md:grid-cols-4">
              {INDIVIDUAL_GRADE_LEVEL_OPTIONS.map((lvl) => (
                <button
                  key={lvl}
                  type="button"
                  onClick={() => setTargetGrade(lvl)}
                  className={`rounded-lg px-2.5 py-1.5 text-xs font-bold transition ${
                    targetGrade === lvl
                      ? "bg-indigo-600 text-white ring-2 ring-indigo-400"
                      : "bg-white text-slate-700 hover:bg-slate-50 border border-slate-200"
                  }`}
                >
                  {lvl}
                </button>
              ))}
            </div>
          </div>

          <input
            className="w-full rounded-lg border border-slate-200 px-4 py-3 text-sm outline-none focus:border-night"
            onChange={(event) => setTitle(event.target.value)}
            placeholder={t.quizTitlePlaceholder}
            required
            value={title}
          />

          <label className="block space-y-1.5">
            <span className="text-xs font-black uppercase tracking-[0.14em] text-slate-500">
              {t.pointsRewardPlaceholder}
            </span>
            <input
              className="w-full rounded-lg border border-slate-200 px-4 py-3 text-sm outline-none focus:border-night"
              max={200}
              min={10}
              onChange={(event) => setPointsReward(Number(event.target.value) || 100)}
              type="number"
              value={pointsReward}
            />
            <span className="text-xs font-semibold text-slate-500">{t.quizPointsHint}</span>
          </label>

          <section className="space-y-3 rounded-xl border border-slate-200 bg-slate-50/60 p-3">
            <div className="flex items-center justify-between gap-2">
              <h4 className="text-sm font-black text-night">
                {t.quizQuestionHeading.replace("{n}", String(activeIndex + 1))}
              </h4>
              <span
                className={`rounded-lg px-2 py-1 text-[0.65rem] font-black uppercase tracking-[0.08em] ${
                  isQuestionComplete(activeQuestion)
                    ? "bg-emerald-100 text-emerald-700"
                    : "bg-amber-100 text-amber-700"
                }`}
              >
                {isQuestionComplete(activeQuestion) ? t.quizQuestionReady : t.quizQuestionDraft}
              </span>
            </div>

            <textarea
              className="min-h-24 w-full rounded-lg border border-slate-200 bg-white px-4 py-3 text-sm outline-none focus:border-night"
              onChange={(event) => updateActiveQuestion({ questionText: event.target.value })}
              placeholder={t.questionTextPlaceholder}
              value={activeQuestion.questionText}
            />
            {/* Image upload for the question */}
            <div className="mt-2">
              <input
                type="file"
                accept="image/jpeg,image/png,image/webp"
                onChange={async (e) => {
                  const file = e.target.files?.[0];
                  if (!file) return;
                  // Simple client‑side compression could be added here if needed
                  const supabase = createClient();
                  const ext = file.name.split('.').pop();
                  const path = `question-${Date.now()}-${activeIndex}.${ext}`;
                  const { error: uploadError } = await supabase.storage
                    .from("quiz-images")
                    .upload(path, file, { upsert: true });
                  if (uploadError) {
                    console.error('Image upload failed', uploadError);
                    return;
                  }
                  const { data } = supabase.storage.from("quiz-images").getPublicUrl(path);
                  const url = data?.publicUrl;
                  if (url) {
                    updateActiveQuestion({ imageUrl: url });
                  }
                }}
                className="block w-full text-sm text-slate-500 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-medium file:bg-violet-50 file:text-violet-700 hover:file:bg-violet-100"
              />
              {activeQuestion.imageUrl && (
                <img src={activeQuestion.imageUrl} alt="Question image" className="mt-2 max-h-48 object-contain" />
              )}
            </div>
            <div className="space-y-2">
              <p className="text-xs font-black uppercase tracking-[0.14em] text-slate-500">{t.quizOptionsHeading}</p>
              {activeQuestion.options.map((option, optionIndex) => (
                <div className="flex items-center gap-2" key={OPTION_LABELS[optionIndex]}>
                  <button
                    aria-label={t.quizMarkCorrect.replace("{letter}", OPTION_LABELS[optionIndex]!)}
                    className={`flex size-10 shrink-0 items-center justify-center rounded-lg text-sm font-black transition ${
                      activeQuestion.correctOption === optionIndex
                        ? "bg-emerald-500 text-white"
                        : "bg-white text-slate-600 ring-1 ring-slate-200"
                    }`}
                    onClick={() => updateActiveQuestion({ correctOption: optionIndex })}
                    type="button"
                  >
                    {OPTION_LABELS[optionIndex]}
                  </button>
                  <input
                    className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2.5 text-sm outline-none focus:border-night"
                    onChange={(event) => updateOption(optionIndex, event.target.value)}
                    placeholder={t.quizOptionPlaceholder.replace("{letter}", OPTION_LABELS[optionIndex]!)}
                    value={option}
                  />
                </div>
              ))}
              <p className="text-xs font-semibold text-slate-500">{t.quizCorrectHint}</p>
            </div>
          </section>

          <div className="grid grid-cols-2 gap-2">
            <button
              className="rounded-lg border border-slate-200 px-4 py-3 text-sm font-black text-slate-600 disabled:opacity-40"
              disabled={activeIndex === 0}
              onClick={() => setActiveIndex((index) => Math.max(0, index - 1))}
              type="button"
            >
              {t.quizPrev}
            </button>
            <button
              className="rounded-lg border border-slate-200 px-4 py-3 text-sm font-black text-slate-600 disabled:opacity-40"
              disabled={activeIndex >= targetQuestionCount - 1}
              onClick={() => setActiveIndex((index) => Math.min(targetQuestionCount - 1, index + 1))}
              type="button"
            >
              {t.quizNext}
            </button>
          </div>

          <button
            className="w-full zigo-cta tap-scale rounded-lg px-4 py-3 text-sm font-black text-white disabled:opacity-60"
            disabled={status === "saving" || areas.length === 0}
            onClick={() => void submitQuiz()}
            type="button"
          >
            {status === "saving" ? t.creating : `🚀 ${targetQuestionCount} Soruluk Quizini Yayınla`}
          </button>

          {status === "saved" ? <p className="text-sm font-bold text-emerald-600">{message}</p> : null}
          {status === "error" ? <p className="text-sm font-bold text-red-600">{message}</p> : null}
        </>
      </TeacherCreatorPlusLock>
    </div>
  );
}
