"use client";

import { useEffect, useState } from "react";

import { displayEducationAreaName } from "@/lib/domain/education-catalog";
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
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [uploadingImage, setUploadingImage] = useState(false);

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

  function handleImageSelect(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setImageFile(file);
    const url = URL.createObjectURL(file);
    setImagePreview(url);
  }

  async function submitQuestion(formData: FormData) {
    if (status === "saving" || uploadingImage) return;

    setStatus("saving");
    setMessage("");

    try {
      let uploadedImageUrl: string | null = null;

      // 1. Upload photo if selected
      if (imageFile) {
        setUploadingImage(true);
        const uploadData = new FormData();
        uploadData.append("file", imageFile);

        const uploadRes = await fetch("/api/social/upload", {
          method: "POST",
          body: uploadData,
        });

        if (!uploadRes.ok) {
          const errData = await uploadRes.json().catch(() => null);
          setStatus("error");
          setMessage(errData?.error || "Fotoğraf yüklenemedi. Lütfen tekrar deneyin.");
          setUploadingImage(false);
          return;
        }

        const uploadJson = await uploadRes.json();
        uploadedImageUrl = uploadJson.url || null;
        setUploadingImage(false);
      }

      // 2. Submit Question
      const response = await fetch("/api/questions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          areaId: formData.get("areaId"),
          title: formData.get("title"),
          description: formData.get("description"),
          imageUrl: uploadedImageUrl,
        }),
      });

      if (response.ok) {
        setStatus("saved");
        setMessage("Sorun başarıyla yüklendi! Öğretmenler en kısa sürede çözümü paylaşacak 🚀");
        window.localStorage.removeItem(questionDraftKey);
        setDescription("");
        setTitle("");
        setImageFile(null);
        setImagePreview(null);
        return;
      }

      const payload = (await response.json().catch(() => null)) as { error?: string } | null;
      setStatus("error");
      setMessage(payload?.error ?? "Question could not be sent. Check role and area access.");
    } catch {
      setStatus("error");
      setMessage(m.actions.connectionFailedTryAgain);
    } finally {
      setUploadingImage(false);
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
              {displayEducationAreaName(area.area_name)}
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

      {/* Snap & Solve Photo Upload */}
      <div className="rounded-xl border border-dashed border-indigo-200 bg-indigo-50/50 p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-xl">📸</span>
            <div>
              <p className="text-xs font-black text-indigo-950">Sorunun Fotoğrafı (Snap & Solve)</p>
              <p className="text-[0.7rem] font-medium text-slate-500">
                Test kitabındaki soruyu çek ve anında yükle
              </p>
            </div>
          </div>
          <label className="tap-scale cursor-pointer rounded-xl bg-indigo-600 px-3 py-2 text-xs font-black text-white hover:bg-indigo-700">
            Fotoğraf Çek / Seç
            <input
              type="file"
              accept="image/*"
              capture="environment"
              className="hidden"
              onChange={handleImageSelect}
            />
          </label>
        </div>

        {imagePreview && (
          <div className="relative mt-3 inline-block">
            <img
              src={imagePreview}
              alt="Soru önizleme"
              className="h-32 w-auto max-w-full rounded-lg border border-indigo-200 object-contain shadow-sm"
            />
            <button
              type="button"
              onClick={() => {
                setImageFile(null);
                setImagePreview(null);
              }}
              className="absolute -right-2 -top-2 flex h-6 w-6 items-center justify-center rounded-full bg-rose-500 text-xs font-bold text-white shadow"
            >
              ✕
            </button>
          </div>
        )}
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
