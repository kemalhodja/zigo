"use client";

import { useEffect, useMemo, useState } from "react";

import { useMessages } from "@/lib/i18n/locale-context";

type Status = "idle" | "saving" | "saved" | "error";
type AnswerableQuestion = {
  id: string;
  title: string;
  area_id: number | null;
};
const answerDraftKey = "zigo:teacher-answer-draft";

export function AnswerForm({ questions }: { questions: AnswerableQuestion[] }) {
  const m = useMessages();
  const f = m.forms;
  const a = m.answerForm;
  const c = m.common;

  const answerTemplates = useMemo(
    () => [a.template1, a.template2, a.template3],
    [a.template1, a.template2, a.template3],
  );

  const [content, setContent] = useState("");
  const [questionId, setQuestionId] = useState("");
  const [status, setStatus] = useState<Status>("idle");
  const [message, setMessage] = useState("");

  useEffect(() => {
    try {
      const rawDraft = window.localStorage.getItem(answerDraftKey);
      if (!rawDraft) return;
      const draft = JSON.parse(rawDraft) as { content?: string; questionId?: string };
      setContent(draft.content ?? "");
      setQuestionId(draft.questionId ?? "");
      setMessage(a.draftRestored);
    } catch {
      window.localStorage.removeItem(answerDraftKey);
    }
  }, [a.draftRestored]);

  useEffect(() => {
    try {
      window.localStorage.setItem(
        answerDraftKey,
        JSON.stringify({ content, questionId, savedAt: new Date().toISOString() }),
      );
    } catch {
      // Draft autosave is a convenience and should not block teacher answers.
    }
  }, [content, questionId]);

  async function submitAnswer(formData: FormData) {
    if (status === "saving") return;

    setStatus("saving");
    setMessage("");

    try {
      const response = await fetch("/api/answers", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          questionId: formData.get("questionId"),
          content: formData.get("content"),
        }),
      });

      if (response.ok) {
        setStatus("saved");
        setMessage(a.sent);
        window.localStorage.removeItem(answerDraftKey);
        setContent("");
        return;
      }

      const payload = (await response.json().catch(() => null)) as { error?: string } | null;
      setStatus("error");
      setMessage(payload?.error ?? a.sendFailed);
    } catch {
      setStatus("error");
      setMessage(c.connectionFailed);
    }
  }

  return (
    <form action={submitAnswer} className="-mx-4 space-y-4 bg-white px-4 py-4">
      <div>
        <p className="text-xs font-black uppercase tracking-[0.2em] text-slate-500">{f.teacherAnswer}</p>
        <h3 className="mt-1 text-lg font-black text-night">{f.answerMatched}</h3>
      </div>
      <div className="rounded-lg border border-violet-100 bg-violet-50 p-3">
        <div className="flex items-center justify-between gap-3">
          <p className="text-xs font-black uppercase tracking-[0.14em] text-crystal">{a.templatesTitle}</p>
          <span className="rounded-lg bg-white px-2 py-1 text-[0.62rem] font-black text-night">{f.draftAutosaved}</span>
        </div>
        <div className="no-scrollbar mt-3 flex gap-2 overflow-x-auto">
          {answerTemplates.map((template) => (
            <button
              className="tap-scale min-w-44 shrink-0 rounded-lg bg-white px-3 py-2 text-left text-[0.68rem] font-black leading-4 text-slate-700"
              key={template}
              onClick={() => setContent(template)}
              type="button"
            >
              {template}
            </button>
          ))}
        </div>
      </div>
      <select
        className="w-full rounded-lg border border-slate-200 bg-white px-4 py-3 text-sm font-bold text-slate-700 outline-none transition focus:border-night"
        name="questionId"
        onChange={(event) => setQuestionId(event.target.value)}
        required
        value={questionId}
      >
        <option value="">{f.chooseQuestion}</option>
        {questions.map((question) => (
          <option key={question.id} value={question.id}>
            {question.title}
            {question.area_id ? a.matchedAreaSuffix : ""}
          </option>
        ))}
      </select>
      <textarea
        className="min-h-28 w-full rounded-lg border border-slate-200 bg-white px-4 py-3 text-sm outline-none transition placeholder:text-slate-400 focus:border-night"
        name="content"
        onChange={(event) => setContent(event.target.value)}
        placeholder={f.answerPlaceholder}
        required
        value={content}
      />
      <button
        className="zigo-cta w-full rounded-lg px-4 py-3 text-sm font-black text-white disabled:opacity-60"
        disabled={status === "saving"}
        type="submit"
      >
        {status === "saving" ? f.sending : f.sendAnswer}
      </button>
      {message ? (
        <p className={`text-sm font-bold ${status === "error" ? "text-red-600" : "text-emerald-600"}`}>{message}</p>
      ) : null}
    </form>
  );
}
