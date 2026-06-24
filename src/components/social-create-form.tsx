"use client";

import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";

import type { ComposerArea } from "@/components/create-mode-composer";
import { SocialMediaFrame } from "@/components/social-media-frame";
import { TeacherCreatorPlusLock } from "@/components/teacher-creator-plus-lock";
import { cleanupUploadedMedia } from "@/lib/client/media-cleanup";
import { useMessages } from "@/lib/i18n/locale-context";
import type { Messages } from "@/lib/i18n/server";

type Status = "idle" | "saving" | "saved" | "error";
type PublishStep = "idle" | "uploading" | "publishing" | "done";
const allowedMediaTypes = new Set(["image/jpeg", "image/png", "image/webp", "image/gif", "video/mp4", "video/webm"]);
const maxFileSizeBytes = 50 * 1024 * 1024;
const draftKey = "zigo:composer-draft";

type SocialCreateFormProps = {
  areas: ComposerArea[];
  forceReel?: boolean;
  teacherCreatorPlus?: boolean;
  allowDevActivate?: boolean;
};

export function SocialCreateForm({
  areas,
  forceReel = false,
  teacherCreatorPlus = false,
  allowDevActivate = false,
}: SocialCreateFormProps) {
  const { socialCreate: sc } = useMessages();
  const router = useRouter();
  const formRef = useRef<HTMLFormElement>(null);
  const [status, setStatus] = useState<Status>("idle");
  const [step, setStep] = useState<PublishStep>("idle");
  const [message, setMessage] = useState("");
  const [caption, setCaption] = useState("");
  const [mediaTypeValue, setMediaTypeValue] = useState(forceReel ? "video" : "image");
  const [preview, setPreview] = useState<{ url: string; type: "image" | "video" } | null>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [selectedAreaId, setSelectedAreaId] = useState("");
  const [shareAsReel, setShareAsReel] = useState(forceReel);
  const [premiumPrepLabel, setPremiumPrepLabel] = useState("");
  const [premiumPrepUrl, setPremiumPrepUrl] = useState("");
  const [sponsoredLabel, setSponsoredLabel] = useState("");
  const [sponsoredTargetUrl, setSponsoredTargetUrl] = useState("");

  useEffect(() => {
    try {
      const rawDraft = window.localStorage.getItem(forceReel ? `${draftKey}:reel` : `${draftKey}:post`);
      if (!rawDraft) return;
      const draft = JSON.parse(rawDraft) as {
        areaId?: string;
        caption?: string;
        isReel?: boolean;
        mediaType?: string;
      };
      setCaption(draft.caption ?? "");
      setMediaTypeValue(draft.mediaType ?? (forceReel ? "video" : "image"));
      setSelectedAreaId(draft.areaId ?? "");
      setShareAsReel(forceReel || Boolean(draft.isReel));
      setMessage(sc.draftRestored);
    } catch {
      window.localStorage.removeItem(forceReel ? `${draftKey}:reel` : `${draftKey}:post`);
    }
  }, [forceReel, sc.draftRestored]);

  useEffect(() => {
    try {
      window.localStorage.setItem(
        forceReel ? `${draftKey}:reel` : `${draftKey}:post`,
        JSON.stringify({
          areaId: selectedAreaId,
          caption,
          isReel: shareAsReel,
          mediaType: mediaTypeValue,
          savedAt: new Date().toISOString(),
        }),
      );
    } catch {
      // Draft autosave is a convenience; publishing should still work if storage is blocked.
    }
  }, [caption, forceReel, mediaTypeValue, selectedAreaId, shareAsReel]);

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
      setMessage(sc.mediaTypeError);
      setPreview(null);
      setSelectedFile(null);
      return;
    }

    if (file.size > maxFileSizeBytes) {
      setStatus("error");
      setMessage(sc.mediaSizeError);
      setPreview(null);
      setSelectedFile(null);
      return;
    }

    setSelectedFile(file);
    setStatus("idle");
    setMessage("");
    setPreview({
      url: URL.createObjectURL(file),
      type: file.type.startsWith("video/") ? "video" : "image",
    });
  }

  async function publish(formData: FormData) {
    if (status === "saving") return;

    setStatus("saving");
    setStep("uploading");
    setMessage(sc.publishing);

    let mediaUrl = String(formData.get("mediaUrl") ?? "");
    let mediaType = String(formData.get("mediaType") ?? "image");
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
        setMessage(sc.uploadFailed);
        return;
      }

      if (!uploadResponse.ok) {
        const payload = (await uploadResponse.json().catch(() => null)) as { error?: string } | null;
        setStatus("error");
        setStep("idle");
        setMessage(payload?.error ?? sc.uploadError);
        return;
      }

      const payload = (await uploadResponse.json()) as {
        data: { mediaUrl: string; mediaType: "image" | "video"; objectPath: string };
      };
      mediaUrl = payload.data.mediaUrl;
      mediaType = payload.data.mediaType;
      uploadedObjectPath = payload.data.objectPath;
    }

    setStep("publishing");
    let response: Response;
    try {
      response = await fetch("/api/social/posts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          caption: formData.get("caption"),
          mediaUrl,
          mediaType,
          areaId: formData.get("areaId"),
          isReel: forceReel || formData.get("isReel") === "on",
          ...(teacherCreatorPlus && premiumPrepLabel.trim() && premiumPrepUrl.trim()
            ? { premiumPrepLabel: premiumPrepLabel.trim(), premiumPrepUrl: premiumPrepUrl.trim() }
            : {}),
          ...(teacherCreatorPlus && sponsoredLabel.trim() && sponsoredTargetUrl.trim()
            ? { sponsoredLabel: sponsoredLabel.trim(), sponsoredTargetUrl: sponsoredTargetUrl.trim() }
            : {}),
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
      setMessage(payload?.error ?? sc.shareError);
      return;
    }

    const payload = (await response.json().catch(() => null)) as { data?: { id?: string } } | null;
    setStatus("saved");
    setStep("done");
    setMessage(sc.shared);
    window.localStorage.removeItem(forceReel ? `${draftKey}:reel` : `${draftKey}:post`);
    setCaption("");
    setMediaTypeValue(forceReel ? "video" : "image");
    setSelectedAreaId("");
    setShareAsReel(forceReel);
    setPremiumPrepLabel("");
    setPremiumPrepUrl("");
    setSponsoredLabel("");
    setSponsoredTargetUrl("");
    formRef.current?.reset();
    setFilePreview();
    router.refresh();
    router.push(forceReel ? "/micro" : payload?.data?.id ? `/post/${payload.data.id}` : "/");
  }

  const submitLabel = status === "saving"
    ? step === "uploading"
      ? sc.uploading
      : sc.publishing
    : forceReel
      ? sc.shareReel
      : sc.share;

  return (
    <form action={publish} className="-mx-4 space-y-0 bg-white" ref={formRef}>
      {preview ? (
        <SocialMediaFrame
          className={forceReel ? "aspect-[9/16] min-h-[34rem] media-polish" : "zigo-media"}
          controls
          mediaType={preview.type}
          mediaUrl={preview.url}
        >
          <div className="flex items-start justify-between">
            <span className="rounded-lg bg-black/30 px-3 py-1 text-xs font-black text-white">
              {forceReel ? sc.reelPreview : sc.postPreview}
            </span>
          </div>
          <div />
        </SocialMediaFrame>
      ) : (
        <label className="flex zigo-media cursor-pointer items-center justify-center bg-[linear-gradient(135deg,#111827,#334155)] text-center text-white">
          <span>
            <span className="mx-auto flex size-20 items-center justify-center rounded-lg border border-white/30 bg-white/10 text-4xl font-black backdrop-blur">
              <svg aria-hidden="true" className="size-9" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                <path d="M4 8h3l2-3h6l2 3h3v11H4z" />
                <circle cx="12" cy="13" r="4" />
              </svg>
            </span>
            <span className="mt-4 block text-sm font-black">{sc.chooseMedia}</span>
            <span className="mt-1 block text-xs font-bold text-white/70">{sc.chooseMediaHint}</span>
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
          <div className="flex items-center justify-between gap-3 rounded-lg bg-slate-50 px-3 py-3">
            <p className="min-w-0 truncate text-xs font-bold text-slate-500">
              {selectedFile?.name ?? sc.mediaReady}
            </p>
            <label className="shrink-0 cursor-pointer rounded-lg bg-slate-100 px-3 py-2 text-xs font-black text-night">
              {sc.change}
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
          </div>
        ) : null}

        <textarea
          className="min-h-24 w-full resize-none border-b border-slate-200 bg-white py-3 text-base outline-none placeholder:text-slate-400"
          name="caption"
          onChange={(event) => setCaption(event.target.value)}
          placeholder={sc.captionPlaceholder}
          required
          value={caption}
        />

        <div className="grid grid-cols-2 gap-2">
          <select
            className="rounded-lg bg-slate-100 px-3 py-3 text-sm font-bold text-slate-700 outline-none"
            name="mediaType"
            onChange={(event) => setMediaTypeValue(event.target.value)}
            value={mediaTypeValue}
          >
            <option value="image">{sc.image}</option>
            <option value="video">{sc.video}</option>
            <option value="carousel">{sc.carousel}</option>
          </select>
          <select
            className="rounded-lg bg-slate-100 px-3 py-3 text-sm font-bold text-slate-700 outline-none"
            name="areaId"
            onChange={(event) => setSelectedAreaId(event.target.value)}
            required
            value={selectedAreaId}
          >
            <option value="">{sc.subject}</option>
            {areas.map((area) => (
              <option key={area.id} value={area.id}>
                {area.area_name}{area.age_group ? ` · ${area.age_group}` : ""}
              </option>
            ))}
          </select>
        </div>

        <details className="rounded-lg bg-slate-50 px-3 py-3 text-sm">
          <summary className="cursor-pointer font-black text-slate-600">{sc.advanced}</summary>
          <input
            className="mt-3 w-full rounded-lg bg-white px-3 py-3 text-sm outline-none"
            name="mediaUrl"
            placeholder={sc.mediaUrlPlaceholder}
            type="url"
          />
          <div className="mt-3 space-y-3 border-t border-slate-200 pt-3">
            <TeacherCreatorPlusLock
              allowDevActivate={allowDevActivate}
              description="Öğrenci ve velilerin Zigo Plus ile açtığı yazılı hazırlık kaynağı ekleyin."
              isUnlocked={teacherCreatorPlus}
              title="Yazılı hazırlık (Zigo Plus)"
            >
              <input
                className="w-full rounded-lg bg-white px-3 py-3 text-sm outline-none"
                onChange={(event) => setPremiumPrepLabel(event.target.value)}
                placeholder="Görünen etiket (ör. Yazılı hazırlık örneği)"
                value={premiumPrepLabel}
              />
              <input
                className="w-full rounded-lg bg-white px-3 py-3 text-sm outline-none"
                onChange={(event) => setPremiumPrepUrl(event.target.value)}
                placeholder="Hazırlık linki (URL feed'de gösterilmez)"
                type="url"
                value={premiumPrepUrl}
              />
            </TeacherCreatorPlusLock>

            <TeacherCreatorPlusLock
              allowDevActivate={allowDevActivate}
              description="Sponsorlu içeriği etiketle paylaşın; hedef adres feed'de gizli kalır."
              isUnlocked={teacherCreatorPlus}
              title="Sponsorlu reklam (Zigo Plus)"
            >
              <input
                className="w-full rounded-lg bg-white px-3 py-3 text-sm outline-none"
                onChange={(event) => setSponsoredLabel(event.target.value)}
                placeholder="Görünen etiket (ör. Sponsor · Kitap seti)"
                value={sponsoredLabel}
              />
              <input
                className="w-full rounded-lg bg-white px-3 py-3 text-sm outline-none"
                onChange={(event) => setSponsoredTargetUrl(event.target.value)}
                placeholder="Hedef link (URL feed'de gösterilmez)"
                type="url"
                value={sponsoredTargetUrl}
              />
            </TeacherCreatorPlusLock>
          </div>
        </details>

        {forceReel ? (
          <input name="isReel" type="hidden" value="on" />
        ) : (
          <label className="flex items-center justify-between rounded-lg bg-slate-100 px-3 py-3 text-sm font-black text-night">
            {sc.shareAsReel}
            <input
              checked={shareAsReel}
              className="size-5 accent-violet-600"
              name="isReel"
              onChange={(event) => setShareAsReel(event.target.checked)}
              type="checkbox"
            />
          </label>
        )}

        <PublishReadiness
          hasArea={Boolean(selectedAreaId)}
          hasCaption={caption.trim().length > 0}
          hasMedia={Boolean(preview || selectedFile)}
          labels={sc}
        />

        <button
          className="tap-scale sticky bottom-20 z-10 w-full zigo-cta tap-scale rounded-lg px-4 py-3.5 text-sm font-black text-white disabled:opacity-60"
          disabled={status === "saving" || areas.length === 0}
          type="submit"
        >
          {submitLabel}
        </button>

        <PublishSteps currentStep={step} labels={sc} />

        {message ? (
          <p className={`rounded-lg px-4 py-3 text-sm font-bold ${status === "error" ? "bg-red-50 text-red-600" : "bg-violet-50 text-crystal"}`}>
            {message}
          </p>
        ) : null}
      </div>
    </form>
  );
}

function PublishSteps({
  currentStep,
  labels,
}: {
  currentStep: PublishStep;
  labels: Messages["socialCreate"];
}) {
  if (currentStep === "idle") return null;

  const steps: { id: PublishStep; label: string }[] = [
    { id: "uploading", label: labels.uploadStep },
    { id: "publishing", label: labels.publishStep },
    { id: "done", label: labels.doneStep },
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

function PublishReadiness({
  hasArea,
  hasCaption,
  hasMedia,
  labels,
}: {
  hasArea: boolean;
  hasCaption: boolean;
  hasMedia: boolean;
  labels: Messages["socialCreate"];
}) {
  const checks = [
    { done: hasCaption, label: labels.captionReady },
    { done: hasArea, label: labels.subjectSelected },
    { done: hasMedia, label: labels.mediaAttached },
  ];

  return (
    <details className="rounded-lg bg-slate-50 px-3 py-3 text-xs">
      <summary className="cursor-pointer font-black text-slate-500">
        {labels.details} <span className="sr-only">{labels.checklistSr}</span>
      </summary>
      <div className="mt-3 grid grid-cols-3 gap-2">
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
