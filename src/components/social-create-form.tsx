"use client";

import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";

import type { ComposerArea } from "@/components/create-mode-composer";
import { SocialMediaFrame, type MediaFilterPreset } from "@/components/social-media-frame";
import { TeacherCreatorPlusLock } from "@/components/teacher-creator-plus-lock";
import { compressVideo, VIDEO_MAX_SIZE_BYTES } from "@/lib/client/compress-video";
import { cleanupUploadedMedia } from "@/lib/client/media-cleanup";
import { displayEducationAreaName } from "@/lib/domain/education-catalog";
import { INDIVIDUAL_GRADE_LEVEL_OPTIONS } from "@/lib/domain/grade-level";
import { useMessages } from "@/lib/i18n/locale-context";
import type { Messages } from "@/lib/i18n/server";

type Status = "idle" | "saving" | "saved" | "error";
type PublishStep = "idle" | "compressing" | "uploading" | "publishing" | "done";
const allowedMediaTypes = new Set(["image/jpeg", "image/png", "image/webp", "image/gif", "video/mp4", "video/webm"]);
const maxFileSizeBytes = 100 * 1024 * 1024;
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
  const compressAbortRef = useRef<AbortController | null>(null);
  const [message, setMessage] = useState("");
  const [caption, setCaption] = useState("");
  const [mediaTypeValue, setMediaTypeValue] = useState(forceReel ? "video" : "image");
  const [preview, setPreview] = useState<{ url: string; type: "image" | "video" } | null>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [selectedAreaId, setSelectedAreaId] = useState("");
  const [targetAudience, setTargetAudience] = useState<"all" | "parent_only" | "grade">("grade");
  const [targetGrade, setTargetGrade] = useState("Hepsi (Tüm Sınıflar)");
  const [shareAsReel, setShareAsReel] = useState(forceReel);
  const [premiumPrepLabel, setPremiumPrepLabel] = useState("");
  const [premiumPrepUrl, setPremiumPrepUrl] = useState("");
  const [sponsoredLabel, setSponsoredLabel] = useState("");
  const [sponsoredTargetUrl, setSponsoredTargetUrl] = useState("");
  const [externalUrl, setExternalUrl] = useState("");
  const [coAuthorId, setCoAuthorId] = useState("");
  const [objectFit, setObjectFit] = useState<"contain" | "cover">("contain");
  const [scale, setScale] = useState<number>(1);
  const [filterPreset, setFilterPreset] = useState<MediaFilterPreset>("normal");

  useEffect(() => {
    try {
      const rawDraft = window.localStorage.getItem(forceReel ? `${draftKey}:reel` : `${draftKey}:post`);
      if (!rawDraft) return;
      const draft = JSON.parse(rawDraft) as {
        areaId?: string;
        caption?: string;
        isReel?: boolean;
        mediaType?: string;
        targetAudience?: "all" | "parent_only" | "grade";
        targetGrade?: string;
      };
      setCaption(draft.caption ?? "");
      setMediaTypeValue(draft.mediaType ?? (forceReel ? "video" : "image"));
      setSelectedAreaId(draft.areaId ?? "");
      if (draft.targetAudience) setTargetAudience(draft.targetAudience);
      if (draft.targetGrade) setTargetGrade(draft.targetGrade);
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
          targetAudience,
          targetGrade,
          savedAt: new Date().toISOString(),
        }),
      );
    } catch {
      // Draft autosave is a convenience; publishing should still work if storage is blocked.
    }
  }, [caption, forceReel, mediaTypeValue, selectedAreaId, shareAsReel, targetAudience, targetGrade]);

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
      setMessage(`Dosya 100 MB\'dan büyük olamaz. (${sc.mediaSizeError})`);
      setPreview(null);
      setSelectedFile(null);
      return;
    }

    if (file.type.startsWith("video/")) {
      const blobUrl = URL.createObjectURL(file);
      setSelectedFile(file);
      setMediaTypeValue("video");
      setStatus("idle");
      setMessage("");
      setPreview({
        url: blobUrl,
        type: "video",
      });

      const video = document.createElement("video");
      video.preload = "metadata";
      video.onloadedmetadata = () => {
        if (video.duration > 90) {
          setStatus("error");
          setMessage("Video süresi 90 saniyeden uzun olamaz.");
          setSelectedFile(null);
          setPreview(null);
        }
      };
      video.src = blobUrl;
      return;
    }

    setSelectedFile(file);
    setMediaTypeValue("image");
    setStatus("idle");
    setMessage("");
    setPreview({
      url: URL.createObjectURL(file),
      type: "image",
    });
  }

  async function publish(formData: FormData) {
    if (status === "saving") return;

    if (!targetGrade || !targetGrade.trim()) {
      setStatus("error");
      setStep("idle");
      setMessage("Paylaşım yapabilmek için lütfen hedef sınıf seviyesini (ör. Hepsi - Tüm Sınıflar) seçin.");
      return;
    }

    setStatus("saving");
    setMessage(sc.publishing);

    let mediaUrl = String(formData.get("mediaUrl") ?? "");
    let mediaType = String(formData.get("mediaType") ?? "image");
    let uploadedObjectPath = "";

    if (selectedFile) {
      // ── Video compression (client-side, before upload) ─────────────────────
      let fileToUpload = selectedFile;
      if (selectedFile.type.startsWith("video/") && selectedFile.size > VIDEO_MAX_SIZE_BYTES) {
        setStep("compressing");
        setMessage("Video sıkıştırılıyor… 0%");
        const abortCtrl = new AbortController();
        compressAbortRef.current = abortCtrl;
        try {
          fileToUpload = await compressVideo(selectedFile, {
            signal: abortCtrl.signal,
            onProgress: (ratio) => {
              setMessage(`Video sıkıştırılıyor… ${Math.round(ratio * 100)}%`);
            },
          });
          // After compression if still too large, block and show error.
          if (fileToUpload.size > VIDEO_MAX_SIZE_BYTES) {
            setStatus("error");
            setStep("idle");
            setMessage(
              `Video sıkıştırıldıktan sonra hâlâ ${Math.round(fileToUpload.size / 1024 / 1024)} MB. Lütfen daha kısa veya düşük çözünürlüklü bir video seçin.`,
            );
            return;
          }
        } catch (err) {
          if (err instanceof DOMException && err.name === "AbortError") {
            setStatus("idle");
            setStep("idle");
            setMessage("");
            return;
          }
          // Non-fatal: fall back to original file (server will reject if > 100 MB).
          fileToUpload = selectedFile;
        } finally {
          compressAbortRef.current = null;
        }
      }
      // ───────────────────────────────────────────────────────────────────────

      setStep("uploading");
      setMessage(sc.publishing);
      const uploadData = new FormData();
      uploadData.set("file", fileToUpload);

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
          targetAudience,
          targetGrade: targetAudience === "grade" ? targetGrade : null,
          isReel: forceReel || formData.get("isReel") === "on",
          externalUrl: externalUrl.trim() ? externalUrl.trim() : undefined,
          coAuthorId: coAuthorId.trim() ? coAuthorId.trim() : undefined,
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
    setTargetAudience("all");
    setTargetGrade("");
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
    ? step === "compressing"
      ? "Sıkıştırılıyor…"
      : step === "uploading"
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
          filterPreset={filterPreset}
          mediaType={preview.type}
          mediaUrl={preview.url}
          objectFit={objectFit}
          scale={scale}
        >

...

            {/* ── Renk Filtresi & Görsel Tonlama ── */}
            <div className="flex flex-wrap items-center justify-between gap-2 border-t border-slate-200/80 pt-2 text-xs">
              <span className="font-black text-slate-500">Renk Filtresi:</span>
              <div className="flex flex-wrap items-center gap-1">
                {[
                  { key: "normal", label: "Orijinal" },
                  { key: "vivid", label: "✨ Canlı" },
                  { key: "contrast", label: "🎯 Netleş" },
                  { key: "warm", label: "☀️ Sıcak" },
                  { key: "bw", label: "🖤 S/B" },
                ].map((f) => (
                  <button
                    key={f.key}
                    type="button"
                    onClick={() => setFilterPreset(f.key as MediaFilterPreset)}
                    className={`rounded-lg px-2 py-1 text-[11px] font-bold transition ${
                      filterPreset === f.key
                        ? "bg-indigo-600 text-white shadow-sm font-black"
                        : "bg-white text-slate-600 border border-slate-200 hover:bg-slate-100"
                    }`}
                  >
                    {f.label}
                  </button>
                ))}
              </div>
            </div>
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
          <div className="space-y-2.5 rounded-xl border border-slate-200 bg-slate-50 p-3">
            <div className="flex items-center justify-between gap-3">
              <p className="min-w-0 truncate text-xs font-bold text-slate-600">
                {selectedFile?.name ?? sc.mediaReady}
              </p>
              <label className="shrink-0 cursor-pointer rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-black text-night shadow-sm hover:bg-slate-100">
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

            {/* ── Izgaraya Sığdırma & Zoom / Ölçeklendirme Kontrolleri ── */}
            <div className="flex flex-wrap items-center justify-between gap-2 border-t border-slate-200/80 pt-2 text-xs">
              <div className="flex items-center gap-1.5">
                <span className="font-black text-slate-500">Izgara Ayarı:</span>
                <button
                  type="button"
                  onClick={() => setObjectFit("contain")}
                  className={`rounded-lg px-2.5 py-1 font-bold transition ${
                    objectFit === "contain"
                      ? "bg-night text-white shadow-sm"
                      : "bg-white text-slate-600 border border-slate-200 hover:bg-slate-100"
                  }`}
                >
                  🔍 Tam Görsel (Sığdır)
                </button>
                <button
                  type="button"
                  onClick={() => setObjectFit("cover")}
                  className={`rounded-lg px-2.5 py-1 font-bold transition ${
                    objectFit === "cover"
                      ? "bg-night text-white shadow-sm"
                      : "bg-white text-slate-600 border border-slate-200 hover:bg-slate-100"
                  }`}
                >
                  🖼️ Kırp (Doldur)
                </button>
              </div>

              <div className="flex items-center gap-1.5">
                <span className="font-black text-slate-500">Ölçek:</span>
                <button
                  type="button"
                  onClick={() => setScale((s) => Math.max(0.7, Number((s - 0.1).toFixed(2))))}
                  className="flex h-7 w-7 items-center justify-center rounded-lg border border-slate-200 bg-white font-black text-slate-700 hover:bg-slate-100"
                  title="Küçült"
                >
                  -
                </button>
                <span className="min-w-10 text-center font-bold text-slate-800">
                  {Math.round(scale * 100)}%
                </span>
                <button
                  type="button"
                  onClick={() => setScale((s) => Math.min(2.0, Number((s + 0.1).toFixed(2))))}
                  className="flex h-7 w-7 items-center justify-center rounded-lg border border-slate-200 bg-white font-black text-slate-700 hover:bg-slate-100"
                  title="Büyüt"
                >
                  +
                </button>
                {scale !== 1 ? (
                  <button
                    type="button"
                    onClick={() => setScale(1)}
                    className="rounded-lg bg-slate-200 px-2 py-1 text-[10px] font-bold text-slate-600 hover:bg-slate-300"
                  >
                    Sıfırla
                  </button>
                ) : null}
              </div>
            </div>
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
                {displayEducationAreaName(area.area_name)}
              </option>
            ))}
          </select>
        </div>

        <details className="rounded-lg bg-slate-50 px-3 py-3 text-sm">
          <summary className="cursor-pointer font-black text-slate-600">{sc.advanced}</summary>

          <div className="mt-3 space-y-2 rounded-xl border border-slate-200 bg-white p-3">
            <label className="block text-xs font-black uppercase tracking-wider text-slate-500">
              {sc.audienceHeading}
            </label>
            <div className="grid grid-cols-3 gap-2">
              <button
                type="button"
                onClick={() => {
                  setTargetAudience("all");
                  setTargetGrade("");
                }}
                className={`rounded-lg px-3 py-2 text-xs font-bold transition ${targetAudience === "all" ? "bg-night text-white shadow-sm" : "bg-white text-slate-600 hover:bg-slate-100 border border-slate-200"}`}
              >
                {sc.audienceAll}
              </button>
              <button
                type="button"
                onClick={() => {
                  setTargetAudience("parent_only");
                  setTargetGrade("");
                }}
                className={`rounded-lg px-3 py-2 text-xs font-bold transition ${targetAudience === "parent_only" ? "bg-pink-600 text-white shadow-sm" : "bg-white text-slate-600 hover:bg-slate-100 border border-slate-200"}`}
              >
                {sc.audienceParents}
              </button>
              <button
                type="button"
                onClick={() => setTargetAudience("grade")}
                className={`rounded-lg px-3 py-2 text-xs font-bold transition ${targetAudience === "grade" ? "bg-indigo-600 text-white shadow-sm" : "bg-white text-slate-600 hover:bg-slate-100 border border-slate-200"}`}
              >
                {sc.audienceGrade}
              </button>
            </div>
            <input type="hidden" name="targetAudience" value={targetAudience} />
            <div className="mt-2.5 border-t border-slate-200 pt-2.5">
              <div className="mb-1.5 flex items-center justify-between">
                <label className="text-xs font-black uppercase tracking-wider text-indigo-700">
                  Sınıf Seviyesi Seçimi <span className="text-rose-500 font-bold">* Zorunlu</span>
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
              <input type="hidden" name="targetGrade" value={targetGrade} />
            </div>
          </div>

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
        <div className="mt-3">
          <input
            className="w-full rounded-lg bg-white px-4 py-3.5 text-sm font-semibold text-night shadow-sm outline-none ring-1 ring-inset ring-slate-100 placeholder:text-slate-400 focus:bg-slate-50 focus:ring-2 focus:ring-crystal"
            onChange={(event) => setExternalUrl(event.target.value)}
            placeholder="Dış Bağlantı URL (İsteğe bağlı)"
            type="url"
            value={externalUrl}
          />
        </div>
        <div className="mt-3">
          <input
            className="w-full rounded-lg bg-white px-4 py-3.5 text-sm font-semibold text-night shadow-sm outline-none ring-1 ring-inset ring-slate-100 placeholder:text-slate-400 focus:bg-slate-50 focus:ring-2 focus:ring-crystal"
            onChange={(event) => setCoAuthorId(event.target.value)}
            placeholder="Ortak Yazar ID (Öğretmen - İsteğe Bağlı)"
            type="text"
            value={coAuthorId}
          />
        </div>
        {forceReel ? (
          <input name="isReel" type="hidden" value="on" />
        ) : (
          <label className="mt-3 flex items-center justify-between rounded-lg bg-white px-3 py-3 text-sm font-black text-night">
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
        </details>

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
    { id: "compressing", label: "Sıkıştırılıyor" },
    { id: "uploading", label: labels.uploadStep },
    { id: "publishing", label: labels.publishStep },
    { id: "done", label: labels.doneStep },
  ];
  // compressing is optional – skip it in the indicator if we jumped straight to uploading
  const visibleSteps = currentStep === "compressing"
    ? steps
    : steps.filter((s) => s.id !== "compressing");
  const activeIndex = visibleSteps.findIndex((s) => s.id === currentStep);

  return (
    <div className={`grid gap-2 ${visibleSteps.length === 4 ? "grid-cols-4" : "grid-cols-3"}`}>
      {visibleSteps.map((step, index) => (
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
    <div className="rounded-lg bg-slate-50 px-3 py-3 text-xs">
      <p className="mb-2 font-black text-slate-500">
        {labels.details} <span className="sr-only">{labels.checklistSr}</span>
      </p>
      <div className="grid grid-cols-3 gap-2">
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
    </div>
  );
}
