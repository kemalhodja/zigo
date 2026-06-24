"use client";

import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";

import { SocialMediaFrame } from "@/components/social-media-frame";
import { cleanupUploadedMedia } from "@/lib/client/media-cleanup";
import { useMessages } from "@/lib/i18n/locale-context";
import type { Messages } from "@/lib/i18n/types";

type Status = "idle" | "saving" | "saved" | "error";
type PublishStep = "idle" | "uploading" | "publishing" | "done";
const allowedMediaTypes = new Set(["image/jpeg", "image/png", "image/webp", "image/gif", "video/mp4", "video/webm"]);
const maxFileSizeBytes = 50 * 1024 * 1024;
const draftKey = "zigo:story-draft";

type StoryArea = {
  age_group: string | null;
  area_name: string;
  id: number;
};

export function StoryCreateForm({ areas }: { areas: StoryArea[] }) {
  const { storyUi: s, common: c } = useMessages();
  const router = useRouter();
  const formRef = useRef<HTMLFormElement>(null);
  const [status, setStatus] = useState<Status>("idle");
  const [step, setStep] = useState<PublishStep>("idle");
  const [caption, setCaption] = useState("");
  const [selectedAreaId, setSelectedAreaId] = useState(() => areas[0]?.id.toString() ?? "");
  const [message, setMessage] = useState(s.expiresNote);
  const [preview, setPreview] = useState<{ url: string; type: "image" | "video" } | null>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);

  useEffect(() => {
    try {
      const rawDraft = window.localStorage.getItem(draftKey);
      if (!rawDraft) return;
      const draft = JSON.parse(rawDraft) as { areaId?: string; caption?: string };
      setSelectedAreaId(draft.areaId ?? areas[0]?.id.toString() ?? "");
      setCaption(draft.caption ?? "");
      setMessage("Story draft restored. Media files are not stored in draft.");
    } catch {
      window.localStorage.removeItem(draftKey);
    }
  }, []);

  useEffect(() => {
    try {
      window.localStorage.setItem(draftKey, JSON.stringify({ areaId: selectedAreaId, caption, savedAt: new Date().toISOString() }));
    } catch {
      // Story draft autosave is optional and should never block publishing.
    }
  }, [caption, selectedAreaId]);

  function setFilePreview(file?: File) {
    if (preview?.url.startsWith("blob:")) {
      URL.revokeObjectURL(preview.url);
    }

    if (!file) {
      setPreview(null);
      setSelectedFile(null);
      return;
    }

    if (!allowedMediaTypes.has(file.type)) {
      setStatus("error");
      setMessage("Use JPG, PNG, WEBP, GIF, MP4 or WEBM media.");
      setPreview(null);
      setSelectedFile(null);
      return;
    }

    if (file.size > maxFileSizeBytes) {
      setStatus("error");
      setMessage("Story media must be 50 MB or smaller.");
      setPreview(null);
      setSelectedFile(null);
      return;
    }

    setSelectedFile(file);
    setStatus("idle");
    setMessage("Sparks expire after 24 hours.");
    setPreview({
      url: URL.createObjectURL(file),
      type: file.type.startsWith("video/") ? "video" : "image",
    });
  }

  async function publishStory(formData: FormData) {
    if (status === "saving") return;

    setStatus("saving");
    setStep("uploading");
    setMessage("Creating story...");

    let mediaUrl = "";
    let uploadedObjectPath = "";
    if (selectedFile) {
      const uploadData = new FormData();
      uploadData.set("file", selectedFile);

      let uploadResponse: Response;
      try {
        uploadResponse = await fetch("/api/social/upload", {
          method: "POST",
          body: uploadData,
        });
      } catch {
        setStatus("error");
        setStep("idle");
        setMessage("Upload connection failed. Try again.");
        return;
      }

      if (!uploadResponse.ok) {
        const payload = (await uploadResponse.json().catch(() => null)) as { error?: string } | null;
        setStatus("error");
        setStep("idle");
        setMessage(payload?.error ?? "Story media upload failed.");
        return;
      }

      const payload = (await uploadResponse.json()) as { data: { mediaUrl: string; objectPath: string } };
      mediaUrl = payload.data.mediaUrl;
      uploadedObjectPath = payload.data.objectPath;
    }

    setStep("publishing");
    let response: Response;
    try {
      response = await fetch("/api/social/stories", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          areaId: formData.get("areaId"),
          caption: formData.get("caption"),
          mediaUrl,
        }),
      });
    } catch {
      await cleanupUploadedMedia(uploadedObjectPath);
      setStatus("error");
      setStep("idle");
      setMessage("Story connection failed. Try again.");
      return;
    }

    if (!response.ok) {
      const payload = (await response.json().catch(() => null)) as { error?: string } | null;
      await cleanupUploadedMedia(uploadedObjectPath);
      setStatus("error");
      setStep("idle");
      setMessage(payload?.error ?? "Story could not be created.");
      return;
    }

    setStatus("saved");
    setStep("done");
    setMessage("Story created.");
    window.localStorage.removeItem(draftKey);
    setCaption("");
    setSelectedAreaId(areas[0]?.id.toString() ?? "");
    formRef.current?.reset();
    setFilePreview();
    router.refresh();
    router.push("/sparks");
  }

  const submitLabel = status === "saving"
    ? step === "uploading"
      ? s.uploading
      : s.creating
    : s.createStory;

  return (
    <form action={publishStory} className="-mx-4 space-y-0 bg-white" ref={formRef}>
      <div className="sr-only">
        <p className="px-4 text-xs font-black uppercase tracking-[0.2em] text-slate-500">Spark</p>
        <h3 className="mt-2 px-4 text-xl font-black text-night">{s.addToStory}</h3>
      </div>
      {preview ? (
        <SocialMediaFrame
          className="mt-4 aspect-[9/16] media-polish"
          controls
          mediaType={preview.type}
          mediaUrl={preview.url}
        >
          <div className="flex items-start justify-between">
            <span className="rounded-lg bg-white/20 px-3 py-1 text-xs font-black text-white backdrop-blur">
              {s.storyPreview}
            </span>
          </div>
          <div />
        </SocialMediaFrame>
      ) : (
        <label className="mt-4 flex aspect-[9/16] cursor-pointer items-center justify-center bg-[linear-gradient(135deg,#111827,#334155)] text-center text-white">
          <span>
            <span className="mx-auto flex size-16 items-center justify-center rounded-lg border border-white/30 bg-white/10 text-3xl font-black backdrop-blur">
              <svg aria-hidden="true" className="size-8" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                <path d="M4 8h3l2-3h6l2 3h3v11H4z" />
                <circle cx="12" cy="13" r="4" />
              </svg>
            </span>
            <span className="mt-3 block text-sm font-black">{s.chooseMedia}</span>
            <span className="mt-1 block text-xs font-bold text-white/70">{s.aspectHint}</span>
          </span>
          <input
            accept="image/jpeg,image/png,image/webp,image/gif,video/mp4,video/webm"
            className="sr-only"
            name="file"
            onChange={(event) => {
              const file = event.target.files?.[0];
              setFilePreview(file);
            }}
            type="file"
          />
        </label>
      )}
      <div className="space-y-4 px-4 py-4">
        {preview ? (
          <label className="inline-flex cursor-pointer rounded-lg bg-slate-100 px-3 py-2 text-xs font-black text-night">
            {s.changeMedia}
            <input
              accept="image/jpeg,image/png,image/webp,image/gif,video/mp4,video/webm"
              className="sr-only"
              name="file"
              onChange={(event) => {
                const file = event.target.files?.[0];
                setFilePreview(file);
              }}
              type="file"
            />
          </label>
        ) : null}
        <input
          className="w-full rounded-lg bg-slate-50 px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-slate-200"
          name="caption"
          onChange={(event) => setCaption(event.target.value)}
          placeholder={s.captionPlaceholder}
          value={caption}
        />
        <select
          className="w-full rounded-lg bg-slate-50 px-4 py-3 text-sm font-bold text-slate-700 outline-none focus:ring-2 focus:ring-slate-200"
          name="areaId"
          onChange={(event) => setSelectedAreaId(event.target.value)}
          required
          value={selectedAreaId}
        >
          <option value="">{s.chooseArea}</option>
          {areas.map((area) => (
            <option key={area.id} value={area.id}>
              {area.area_name}{area.age_group ? ` · ${area.age_group}` : ""}
            </option>
          ))}
        </select>
        <StoryReadiness hasArea={Boolean(selectedAreaId)} hasCaption={caption.trim().length > 0} hasMedia={Boolean(preview || selectedFile)} labels={s} />
        <button
          className="tap-scale sticky bottom-20 z-10 w-full zigo-cta tap-scale rounded-lg px-4 py-3 text-sm font-black text-white disabled:opacity-60"
          disabled={status === "saving" || !selectedAreaId}
          type="submit"
        >
          {submitLabel}
        </button>
        <PublishSteps currentStep={step} labels={s} doneLabel={c.done} />
        <p className={`rounded-lg px-4 py-3 text-sm font-bold ${status === "error" ? "bg-red-50 text-red-600" : "bg-slate-50 text-slate-600"}`}>
          {message}
        </p>
      </div>
    </form>
  );
}

function PublishSteps({
  currentStep,
  labels: s,
  doneLabel,
}: {
  currentStep: PublishStep;
  labels: Messages["storyUi"];
  doneLabel: string;
}) {
  if (currentStep === "idle") return null;

  const steps: { id: PublishStep; label: string }[] = [
    { id: "uploading", label: s.upload },
    { id: "publishing", label: s.publish },
    { id: "done", label: doneLabel },
  ];
  const activeIndex = steps.findIndex((step) => step.id === currentStep);

  return (
    <div className="grid grid-cols-3 gap-2">
      {steps.map((step, index) => (
        <span
          className={`rounded-lg px-3 py-2 text-center text-[0.68rem] font-black ${
            activeIndex >= index ? "bg-crystal text-white" : "bg-slate-100 text-slate-500"
          }`}
          key={step.id}
        >
          {step.label}
        </span>
      ))}
    </div>
  );
}

function StoryReadiness({
  hasArea,
  hasCaption,
  hasMedia,
  labels: s,
}: {
  hasArea: boolean;
  hasCaption: boolean;
  hasMedia: boolean;
  labels: Messages["storyUi"];
}) {
  const checks = [
    { done: hasMedia, label: s.storyMedia },
    { done: hasArea, label: s.area },
    { done: hasCaption, label: s.captionOptional },
    { done: true, label: s.expiry24h },
  ];

  return (
    <details className="rounded-lg bg-slate-50 px-3 py-3 text-xs">
      <summary className="cursor-pointer font-black text-slate-500">
        {s.details} <span className="sr-only">Story checklist · Draft autosaved</span>
      </summary>
      <div className="mt-3 grid grid-cols-4 gap-2">
        {checks.map((check) => (
          <span
            className={`rounded-lg px-2 py-2 text-center text-[0.62rem] font-black ${
              check.done ? "bg-crystal text-white" : "bg-white text-slate-500"
            }`}
            key={check.label}
          >
            {check.label}
          </span>
        ))}
      </div>
    </details>
  );
}
