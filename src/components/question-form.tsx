"use client";

import { useEffect, useState } from "react";

import { useMessages } from "@/lib/i18n/locale-context";
import type { Database } from "@/lib/supabase/database.types";

type Status = "idle" | "saving" | "saved" | "error";
type EducationArea = Database["public"]["Tables"]["education_areas"]["Row"];
const questionDraftKey = "zigo:question-draft";
const questionTemplates = [
  {
    description: "My child understands the basics, but needs a short daily practice routine.",
    title: "How can we practice this at home?",
  },
  {
    description: "I watched the lesson, but one step is still confusing. Can a teacher explain it another way?",
    title: "Can you explain this step again?",
  },
  {
    description: "I want safe resources matched to this education area and age group.",
    title: "What should we learn next?",
  },
];

export function QuestionForm({ areas }: { areas: EducationArea[] }) {
  const m = useMessages();
  const f = m.forms;
  const [status, setStatus] = useState<Status>("idle");
  const [areaId, setAreaId] = useState("");
  const [description, setDescription] = useState("");
  const [message, setMessage] = useState("");
  const [title, setTitle] = useState("");

  useEffect(() => {
    try {
      const rawDraft = window.localStorage.getItem(questionDraftKey);
      if (!rawDraft) return;
      const draft = JSON.parse(rawDraft) as { areaId?: string; description?: string; title?: string };
      setAreaId(draft.areaId ?? "");
      setDescription(draft.description ?? "");
      setTitle(draft.title ?? "");
      setMessage(f.draftRestored);
    } catch {
      window.localStorage.removeItem(questionDraftKey);
    }
  }, []);

  useEffect(() => {
    try {
      window.localStorage.setItem(
        questionDraftKey,
        JSON.stringify({ areaId, description, savedAt: new Date().toISOString(), title }),
      );
    } catch {
      // Draft autosave is optional and should not block the question flow.
    }
  }, [areaId, description, title]);

  async function submitQuestion(formData: FormData) {
    if (status === "saving") return;

    setStatus("saving");
    setMessage("");

    try {
      const response = await fetch("/api/questions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          areaId: formData.get("areaId"),
          title: formData.get("title"),
          description: formData.get("description"),
        }),
      });

      if (response.ok) {
        setStatus("saved");
        setMessage(f.questionSent);
        window.localStorage.removeItem(questionDraftKey);
        setDescription("");
        setTitle("");
        return;
      }

      const payload = (await response.json().catch(() => null)) as { error?: string } | null;
      setStatus("error");
      setMessage(payload?.error ?? "Question could not be sent. Check role and area access.");
    } catch {
      setStatus("error");
      setMessage(m.actions.connectionFailedTryAgain);
    }
  }

  return (
    <form action={submitQuestion} className="-mx-4 space-y-4 bg-white px-4 py-4">
      <div className="rounded-lg border border-violet-100 bg-violet-50 p-3">
        <div className="flex items-center justify-between gap-3">
          <p className="text-xs font-black uppercase tracking-[0.14em] text-crystal">{f.safeTemplates}</p>
          <span className="rounded-lg bg-white px-2 py-1 text-[0.62rem] font-black text-night">{f.draftAutosaved}</span>
        </div>
        <div className="no-scrollbar mt-3 flex gap-2 overflow-x-auto">
          {questionTemplates.map((template) => (
            <button
              className="tap-scale shrink-0 rounded-lg bg-white px-3 py-2 text-left text-[0.68rem] font-black text-slate-700"
              key={template.title}
              onClick={() => {
                setTitle(template.title);
                setDescription(template.description);
              }}
              type="button"
            >
              {template.title}
            </button>
          ))}
        </div>
      </div>

      <div>
        <label className="text-xs font-black uppercase tracking-[0.2em] text-slate-500">
          {f.educationArea}
        </label>
        <select
          className="mt-2 w-full rounded-lg border border-slate-200 px-4 py-3 text-sm font-bold text-slate-700 outline-none transition focus:border-night"
          name="areaId"
          onChange={(event) => setAreaId(event.target.value)}
          required
          value={areaId}
        >
          <option value="">{f.educationArea}</option>
          {areas.map((area) => (
            <option key={area.id} value={area.id}>
              {area.area_name}{area.age_group ? ` · ${area.age_group}` : ""}
            </option>
          ))}
        </select>
      </div>

      <div>
        <label className="text-xs font-black uppercase tracking-[0.2em] text-slate-500">
          {f.questionTitle}
        </label>
        <input
          className="mt-2 w-full rounded-lg border border-slate-200 px-4 py-3 text-sm outline-none transition focus:border-night"
          name="title"
          onChange={(event) => setTitle(event.target.value)}
          placeholder={f.titlePlaceholder}
          required
          value={title}
        />
      </div>

      <div>
        <label className="text-xs font-black uppercase tracking-[0.2em] text-slate-500">
          {f.details}
        </label>
        <textarea
          className="mt-2 min-h-28 w-full rounded-lg border border-slate-200 px-4 py-3 text-sm outline-none transition focus:border-night"
          name="description"
          onChange={(event) => setDescription(event.target.value)}
          placeholder={f.contextPlaceholder}
          required
          value={description}
        />
      </div>

      <div className="grid grid-cols-3 gap-2">
        {[
          { done: Boolean(areaId), label: f.educationArea },
          { done: title.trim().length >= 5, label: f.questionTitle },
          { done: description.trim().length >= 10, label: f.details },
        ].map((item) => (
          <span
            className={`rounded-lg px-3 py-2 text-center text-[0.68rem] font-black ${
              item.done ? "bg-crystal text-white" : "bg-slate-100 text-slate-500"
            }`}
            key={item.label}
          >
            {item.label}
          </span>
        ))}
      </div>

      <button
        className="tap-scale w-full zigo-cta tap-scale rounded-lg px-4 py-3 text-sm font-black text-white disabled:opacity-60"
        disabled={status === "saving" || areas.length === 0}
        type="submit"
      >
        {status === "saving" ? f.sending : areas.length === 0 ? f.selectAreasFirst : f.askTeachers}
      </button>

      {areas.length === 0 ? (
        <p className="rounded-lg bg-amber-50 px-4 py-3 text-sm font-bold text-amber-700">
          Choose at least one Match-Feed area before asking a question.
        </p>
      ) : null}
      {status === "saved" ? <p className="rounded-lg bg-emerald-50 px-4 py-3 text-sm font-bold text-emerald-600">{message}</p> : null}
      {status === "error" ? (
        <p className="rounded-lg bg-red-50 px-4 py-3 text-sm font-bold text-red-600">{message}</p>
      ) : null}
    </form>
  );
}
