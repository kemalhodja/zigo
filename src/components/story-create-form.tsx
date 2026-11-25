"use client";

import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";

import { SocialMediaFrame } from "@/components/social-media-frame";
import { compressImage, isSupportedImageFile, prepareImageForUpload } from "@/lib/client/compress-image";
import { isSupportedVideoFile, validateVideoLimits } from "@/lib/client/compress-video";
import { cleanupUploadedMedia } from "@/lib/client/media-cleanup";
import { uploadSocialMedia } from "@/lib/client/upload-media";
import { displayEducationAreaName } from "@/lib/domain/education-catalog";
import { useMessages } from "@/lib/i18n/locale-context";
import type { Messages } from "@/lib/i18n/types";

type Status = "idle" | "saving" | "saved" | "error";
type PublishStep = "idle" | "uploading" | "publishing" | "done";
const STORY_MEDIA_ACCEPT = "image/jpeg,image/png,image/webp,image/gif,image/avif,image/heic,image/heif,video/mp4,video/webm,video/quicktime,video/x-m4v,.avif,.heic,.heif,.mov,.m4v";
const STORY_VIDEO_ACCEPT = "video/mp4,video/webm,video/quicktime,video/x-m4v,.mp4,.webm,.mov,.m4v";
const draftKey = "zigo:story-draft";

type StoryArea = {
  age_group: string | null;
  area_name: string;
  id: number;
};

export function StoryCreateForm({ areas }: { areas: StoryArea[] }) {
  const { storyUi: s, socialCreate: sc, common: c } = useMessages();
  const router = useRouter();
  const formRef = useRef<HTMLFormElement>(null);
  const [status, setStatus] = useState<Status>("idle");
  const [step, setStep] = useState<PublishStep>("idle");
  const [caption, setCaption] = useState("");
  const [selectedAreaId, setSelectedAreaId] = useState(() => areas[0]?.id.toString() ?? "");
  const [message, setMessage] = useState(s.expiresNote);
  const [preview, setPreview] = useState<{ url: string; type: "image" | "video" } | null>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [videoDurationSeconds, setVideoDurationSeconds] = useState<number | undefined>(undefined);

  useEffect(() => {
    try {
      const rawDraft = window.localStorage.getItem(draftKey);
      if (!rawDraft) return;
      const draft = JSON.parse(rawDraft) as { areaId?: string; caption?: string };
      setSelectedAreaId(draft.areaId ?? areas[0]?.id.toString() ?? "");
      setCaption(draft.caption ?? "");
      setMessage(sc.draftRestored);
    } catch {
      window.localStorage.removeItem(draftKey);
    }
  }, [areas, sc.draftRestored]);

  useEffect(() => {
    if (!selectedAreaId && areas.length > 0 && areas[0]?.id) {
      setSelectedAreaId(areas[0].id.toString());
    }
  }, [areas, selectedAreaId]);

  useEffect(() => {
    try {
      window.localStorage.setItem(draftKey, JSON.stringify({ areaId: selectedAreaId, caption, savedAt: new Date().toISOString() }));
    } catch {
      // Story draft autosave is optional and should never block publishing.
    }
  }, [caption, selectedAreaId]);

  async function setFilePreview(file?: File) {
    if (preview?.url.startsWith("blob:")) {
      URL.revokeObjectURL(preview.url);
    }

    if (!file) {
      setPreview(null);
      setSelectedFile(null);
      return;
    }

    const isVideo = file.type.startsWith("video/") || isSupportedVideoFile(file);
    const isImage = !isVideo && (file.type.startsWith("image/") || isSupportedImageFile(file));

    if (!isVideo && !isImage) {
      setStatus("error");
      setMessage("Desteklenmeyen dosya türü. Fotoğraf (JPG, PNG, WEBP, GIF, AVIF, HEIC) veya kısa video (MP4, WEBM, MOV · maks. 30 sn) seçebilirsiniz.");
      setPreview(null);
      setSelectedFile(null);
      return;
    }

    let finalFile = file;
    if (isVideo) {
      const videoVal = await validateVideoLimits(file, { isReel: true });
      if (!videoVal.valid) {
        setStatus("error");
        setMessage(videoVal.error ?? "Kısa tanıtım videosu en fazla 30 saniye ve 25 MB olabilir.");
        setPreview(null);
        setSelectedFile(null);
        setVideoDurationSeconds(undefined);
        return;
      }
      setVideoDurationSeconds(videoVal.duration);
    } else {
      setVideoDurationSeconds(undefined);
      const prepared = await prepareImageForUpload(file);
      if (!prepared.valid) {
        setStatus("error");
        setMessage(prepared.error);
        setPreview(null);
        setSelectedFile(null);
        return;
      }
      finalFile = prepared.file;
    }

    setSelectedFile(finalFile);
    setStatus("idle");
    setMessage(s.expiresNote);
    setPreview({
      url: URL.createObjectURL(finalFile),
      type: isVideo ? "video" : "image",
    });
  }

  async function publishStory(formData: FormData) {
    if (status === "saving") return;

    setStatus("saving");
    setStep("uploading");
    setMessage(s.creating);

    let mediaUrl = "";
    let uploadedObjectPath = "";
    if (selectedFile) {
        let fileToUpload = selectedFile;
        if (fileToUpload.type.startsWith("image/")) {
          fileToUpload = await compressImage(fileToUpload);
        }

        try {
          const uploaded = await uploadSocialMedia(fileToUpload, {
            durationSeconds: videoDurationSeconds,
          });
          mediaUrl = uploaded.mediaUrl;
          uploadedObjectPath = uploaded.objectPath;
        } catch (err) {
          setStatus("error");
          setStep("idle");
          setMessage(err instanceof Error && err.message ? err.message : sc.uploadFailed);
          return;
        }
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
      setMessage(sc.publishFailed);
      return;
    }

    if (!response.ok) {
      const payload = (await response.json().catch(() => null)) as { error?: string } | null;
      await cleanupUploadedMedia(uploadedObjectPath);
      setStatus("error");
      setStep("idle");
      setMessage(payload?.error ?? s.createFailed);
      return;
    }

    setStatus("saved");
    setStep("done");
    setMessage(s.created);
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
        <div className="mt-4 bg-[linear-gradient(135deg,#111827,#334155)] text-center text-white">
          <label className="flex aspect-[9/14] cursor-pointer items-center justify-center px-6">
            <span>
              <span className="mx-auto flex size-16 items-center justify-center rounded-lg border border-white/30 bg-white/10 text-3xl font-black backdrop-blur">
                <svg aria-hidden="true" className="size-8" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                  <path d="M4 8h3l2-3h6l2 3h3v11H4z" />
                  <circle cx="12" cy="13" r="4" />
                </svg>
              </span>
              <span className="mt-3 block text-sm font-black">{s.chooseMedia}</span>
              <span className="mt-1 block text-xs font-bold text-white/70">
                {s.aspectHint} · Fotoğraf (JPG/PNG/WEBP/HEIC) veya Kısa Video (MP4/MOV · maks. 30 sn)
              </span>
            </span>
            <input
              accept={STORY_MEDIA_ACCEPT}
              className="sr-only"
              name="file"
              onChange={(event) => {
                const file = event.target.files?.[0];
                void setFilePreview(file);
                event.target.value = "";
              }}
              type="file"
            />
          </label>
          <div className="flex items-center justify-center gap-2 border-t border-white/15 px-4 py-3">
            <label className="tap-scale inline-flex cursor-pointer items-center gap-1.5 rounded-xl bg-white/15 px-3 py-2 text-xs font-black text-white hover:bg-white/25">
              📷 Fotoğraf Çek
              <input
                accept="image/*"
                capture="environment"
                className="sr-only"
                onChange={(event) => {
                  const file = event.target.files?.[0];
                  void setFilePreview(file);
                  event.target.value = "";
                }}
                type="file"
              />
            </label>
            <label className="tap-scale inline-flex cursor-pointer items-center gap-1.5 rounded-xl bg-white/15 px-3 py-2 text-xs font-black text-white hover:bg-white/25">
              🎥 30 sn Video Çek
              <input
                accept={STORY_VIDEO_ACCEPT}
                capture="environment"
                className="sr-only"
                onChange={(event) => {
                  const file = event.target.files?.[0];
                  void setFilePreview(file);
                  event.target.value = "";
                }}
                type="file"
              />
            </label>
          </div>
        </div>
      )}
      <div className="space-y-4 px-4 py-4">
        {preview ? (
          <label className="inline-flex cursor-pointer rounded-lg bg-slate-100 px-3 py-2 text-xs font-black text-night">
            {s.changeMedia}
            <input
              accept={STORY_MEDIA_ACCEPT}
              className="sr-only"
              name="file"
              onChange={(event) => {
                const file = event.target.files?.[0];
                void setFilePreview(file);
                event.target.value = "";
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
              {displayEducationAreaName(area.area_name)}
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
