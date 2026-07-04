"use client";

import { useState } from "react";

import { useMessages } from "@/lib/i18n/locale-context";

type AreaOption = {
  id: number;
  area_name: string;
};

type TeacherPostFormProps = {
  areas: AreaOption[];
};

type Status = "idle" | "saving" | "saved" | "error";

export function TeacherPostForm({ areas }: TeacherPostFormProps) {
  const { teacherForms: t, actions: a } = useMessages();
  const [status, setStatus] = useState<Status>("idle");
  const [message, setMessage] = useState("");

  async function submitPost(formData: FormData) {
    setStatus("saving");
    setMessage("");

    try {
      const title = String(formData.get("title") ?? "").trim();
      const content = String(formData.get("content") ?? "").trim();
      const caption = [title, content].filter(Boolean).join("\n\n") || title || content;

      const response = await fetch("/api/social/posts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          areaId: formData.get("areaId"),
          caption,
          title,
          content,
          mediaUrl: formData.get("mediaUrl"),
          mediaType: formData.get("mediaUrl") ? "video" : "image",
          postType: "normal",
        }),
      });

      if (response.ok) {
        setStatus("saved");
        setMessage(t.postCreated);
        return;
      }

      const payload = (await response.json().catch(() => null)) as { error?: string } | null;
      setStatus("error");
      setMessage(payload?.error ?? t.postCreateFailed);
    } catch {
      setStatus("error");
      setMessage(a.connectionFailedTryAgain);
    }
  }

  return (
    <form action={submitPost} className="-mx-4 space-y-4 border-b border-slate-100 bg-white px-4 py-4">
      <div>
        <label className="text-xs font-black uppercase tracking-[0.2em] text-slate-500">{t.educationArea}</label>
        <select
          className="mt-2 w-full rounded-lg border border-slate-200 px-4 py-3 text-sm outline-none focus:border-night"
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
      </div>

      <div>
        <label className="text-xs font-black uppercase tracking-[0.2em] text-slate-500">{t.postTitle}</label>
        <input
          className="mt-2 w-full rounded-lg border border-slate-200 px-4 py-3 text-sm outline-none focus:border-night"
          name="title"
          placeholder={t.titlePlaceholder}
          required
        />
      </div>

      <div>
        <label className="text-xs font-black uppercase tracking-[0.2em] text-slate-500">{t.postContent}</label>
        <textarea
          className="mt-2 min-h-28 w-full rounded-lg border border-slate-200 px-4 py-3 text-sm outline-none focus:border-night"
          name="content"
          placeholder={t.contentPlaceholder}
          required
        />
      </div>

      <div>
        <label className="text-xs font-black uppercase tracking-[0.2em] text-slate-500">{t.mediaUrlLabel}</label>
        <input
          className="mt-2 w-full rounded-lg border border-slate-200 px-4 py-3 text-sm outline-none focus:border-night"
          name="mediaUrl"
          placeholder="https://..."
          type="url"
        />
      </div>

      <button
        className="w-full zigo-cta tap-scale rounded-lg px-4 py-3 text-sm font-black text-white disabled:opacity-60"
        disabled={status === "saving" || areas.length === 0}
        type="submit"
      >
        {status === "saving" ? t.publishing : t.publishPost}
      </button>

      {status === "saved" ? <p className="text-sm font-bold text-emerald-600">{message}</p> : null}
      {status === "error" ? <p className="text-sm font-bold text-red-600">{message}</p> : null}
    </form>
  );
}
