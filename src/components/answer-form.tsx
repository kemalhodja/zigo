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
  const [mediaFile, setMediaFile] = useState<File | null>(null);
  const [mediaPreview, setMediaPreview] = useState<string | null>(null);
  const [mediaType, setMediaType] = useState<"video" | "audio" | null>(null);
  const [uploadingMedia, setUploadingMedia] = useState(false);

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

  function handleMediaSelect(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setMediaFile(file);
    const isVideo = file.type.startsWith("video/");
    setMediaType(isVideo ? "video" : "audio");
    setMediaPreview(URL.createObjectURL(file));
  }

  async function submitAnswer(formData: FormData) {
    if (status === "saving" || uploadingMedia) return;

    setStatus("saving");
    setMessage("");

    try {
      let videoUrl: string | null = null;
      let audioUrl: string | null = null;

      if (mediaFile) {
        setUploadingMedia(true);
        const uploadData = new FormData();
        uploadData.append("file", mediaFile);

        const uploadRes = await fetch("/api/social/upload", {
          method: "POST",
          body: uploadData,
        });

        if (!uploadRes.ok) {
          const errData = await uploadRes.json().catch(() => null);
          setStatus("error");
          setMessage(errData?.error || "Medya yüklenemedi.");
          setUploadingMedia(false);
          return;
        }

        const uploadJson = await uploadRes.json();
        if (mediaType === "video") {
          videoUrl = uploadJson.url || null;
        } else {
          audioUrl = uploadJson.url || null;
        }
        setUploadingMedia(false);
      }

      const response = await fetch("/api/answers", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          questionId: formData.get("questionId"),
          content: formData.get("content"),
          videoUrl,
          audioUrl,
        }),
      });

      if (response.ok) {
        setStatus("saved");
        setMessage(a.sent);
        window.localStorage.removeItem(answerDraftKey);
        setContent("");
        setMediaFile(null);
        setMediaPreview(null);
        setMediaType(null);
        return;
      }

      const payload = (await response.json().catch(() => null)) as { error?: string } | null;
      setStatus("error");
      setMessage(payload?.error ?? a.sendFailed);
    } catch {
      setStatus("error");
      setMessage(c.connectionFailed);
    } finally {
      setUploadingMedia(false);
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
        className="min-h-24 w-full rounded-lg border border-slate-200 bg-white px-4 py-3 text-sm outline-none transition placeholder:text-slate-400 focus:border-night"
        name="content"
        onChange={(event) => setContent(event.target.value)}
        placeholder={f.answerPlaceholder}
        required
        value={content}
      />

      {/* Video / Audio Solution Attachment */}
      <div className="rounded-xl border border-dashed border-emerald-200 bg-emerald-50/50 p-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-xl">🎙️</span>
            <div>
              <p className="text-xs font-black text-emerald-950">Videolu / Sesli Çözüm Ekle</p>
              <p className="text-[0.7rem] font-medium text-slate-500">
                10 dakikalık hızlı video veya ses kaydı ekle
              </p>
            </div>
          </div>
          <label className="tap-scale cursor-pointer rounded-xl bg-emerald-600 px-3 py-1.5 text-xs font-black text-white hover:bg-emerald-700">
            Kayıt / Dosya Seç
            <input
              type="file"
              accept="video/*,audio/*"
              className="hidden"
              onChange={handleMediaSelect}
            />
          </label>
        </div>

        {mediaPreview && (
          <div className="relative mt-3 inline-block max-w-sm">
            {mediaType === "video" ? (
              <video
                src={mediaPreview}
                controls
                className="max-h-48 w-auto rounded-lg border border-emerald-200 object-contain shadow-sm"
              />
            ) : (
              <audio src={mediaPreview} controls className="w-full h-8" />
            )}
            <button
              type="button"
              onClick={() => {
                setMediaFile(null);
                setMediaPreview(null);
                setMediaType(null);
              }}
              className="absolute -right-2 -top-2 flex h-6 w-6 items-center justify-center rounded-full bg-rose-500 text-xs font-bold text-white shadow"
            >
              ✕
            </button>
          </div>
        )}
      </div>

      <button
        className="zigo-cta w-full rounded-lg px-4 py-3 text-sm font-black text-white disabled:opacity-60"
        disabled={status === "saving" || uploadingMedia}
        type="submit"
      >
        {status === "saving" || uploadingMedia ? f.sending : f.sendAnswer}
      </button>
      {message ? (
        <p className={`text-sm font-bold ${status === "error" ? "text-red-600" : "text-emerald-600"}`}>{message}</p>
      ) : null}
    </form>
  );
}
