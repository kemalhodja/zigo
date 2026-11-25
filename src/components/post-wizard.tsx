"use client";

/**
 * post-wizard.tsx
 *
 * Clean 2-step publish wizard replacing the complex social-create-form.
 *
 * Step 1 — Media Picker : select / preview photo or video
 * Step 2 — Caption      : write caption, pick subject & grade level
 *
 * While publishing: a full-screen UI-lock overlay with animated progress bar
 * prevents any interaction until the operation completes or fails.
 */

import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";

import type { ComposerArea } from "@/components/create-mode-composer";
import { ExternalLinkCard } from "@/components/external-link-card";
import {
  isSupportedImageFile,
  prepareImageForUpload,
  rotateImage90,
} from "@/lib/client/compress-image";
import {
  extractVideoFrameFile,
  isSupportedVideoFile,
  validateVideoLimits,
} from "@/lib/client/compress-video";
import { type UploadPhase,useUploadPipeline } from "@/lib/client/use-upload-pipeline";
import { displayEducationAreaName } from "@/lib/domain/education-catalog";
import { INDIVIDUAL_GRADE_LEVEL_OPTIONS } from "@/lib/domain/grade-level";
import { classifyExternalLink } from "@/lib/domain/social/link-helper";

// ── Constants ─────────────────────────────────────────────────────────────────

// Kullanıcılar fotoğraf ve en fazla 30 saniyelik kısa tanıtım videosu paylaşabilir.
// Uzun ders videoları Zigo'da barındırılmaz; YouTube, Vimeo veya benzeri platform bağlantısı ile yönlendirilir.
export const ENABLE_DIRECT_VIDEO_UPLOAD = true;
const POST_WIZARD_DRAFT_KEY = "zigo:post-wizard-draft";

const IMAGE_ACCEPT = "image/jpeg,image/png,image/webp,image/gif,image/avif,image/heic,image/heif,.avif,.heic,.heif";
const VIDEO_ACCEPT = "video/mp4,video/webm,video/quicktime,video/x-m4v,.mp4,.webm,.mov,.m4v";
const MEDIA_ACCEPT = `${IMAGE_ACCEPT},${VIDEO_ACCEPT}`;

type MediaPreviewItem = {
  id: string;
  file: File;
  url: string;
  type: "image" | "video";
  durationSeconds?: number;
};

type VideoPosterItem = {
  file: File;
  url: string;
  isAuto?: boolean;
};
const OVERLAY_STEPS: { id: UploadPhase; label: string }[] = [
  { id: "validating", label: "Doğrulanıyor" },
  { id: "compressing", label: "Medya Optimize Ediliyor" },
  { id: "uploading", label: "Medya Yükleniyor" },
  { id: "publishing", label: "Paylaşılıyor" },
  { id: "done", label: "Tamamlandı" },
];

// ── Main component ────────────────────────────────────────────────────────────

type PostWizardProps = {
  areas: ComposerArea[];
  forceReel?: boolean;
  teacherCreatorPlus?: boolean;
};

export function PostWizard({
  areas,
  forceReel = false,
  teacherCreatorPlus = false,
}: PostWizardProps) {
  const router = useRouter();
  const pipeline = useUploadPipeline();

  const [step, setStep] = useState<1 | 2>(1);

  // ── Media state ──────────────────────────────────────────────────────
  const [mediaItems, setMediaItems] = useState<MediaPreviewItem[]>([]);
  const [videoPoster, setVideoPoster] = useState<VideoPosterItem | null>(null);
  const [undoRemoved, setUndoRemoved] = useState<{ item: MediaPreviewItem; index: number } | null>(null);
  const [isValidatingMedia, setIsValidatingMedia] = useState(false);
  const [mediaError, setMediaError] = useState<string | null>(null);

  // ── Form state ───────────────────────────────────────────────────────
  const [caption, setCaption] = useState("");
  const [externalUrl, setExternalUrl] = useState("");
  const [selectedAreaId, setSelectedAreaId] = useState<number>(areas[0]?.id ?? 0);
  const [targetGrade, setTargetGrade] = useState("Hepsi (Tüm Sınıflar)");
  const [followersOnly, setFollowersOnly] = useState(false);
  const [followersOnlyComments, setFollowersOnlyComments] = useState(false);
  const [teaserText, setTeaserText] = useState("");

  useEffect(() => {
    try {
      const raw = window.localStorage.getItem(POST_WIZARD_DRAFT_KEY);
      if (!raw) return;
      const draft = JSON.parse(raw) as { caption?: string; externalUrl?: string };
      if (draft.caption) setCaption(draft.caption);
      if (draft.externalUrl) setExternalUrl(draft.externalUrl);
    } catch {
      window.localStorage.removeItem(POST_WIZARD_DRAFT_KEY);
    }
  }, []);

  useEffect(() => {
    try {
      if (!caption && !externalUrl) {
        window.localStorage.removeItem(POST_WIZARD_DRAFT_KEY);
        return;
      }
      window.localStorage.setItem(
        POST_WIZARD_DRAFT_KEY,
        JSON.stringify({ caption, externalUrl }),
      );
    } catch {
      // Optional draft persistence
    }
  }, [caption, externalUrl]);

  useEffect(() => {
    if ((!selectedAreaId || selectedAreaId === 0) && areas.length > 0 && areas[0]?.id) {
      setSelectedAreaId(areas[0].id);
    }
  }, [areas, selectedAreaId]);

  // Navigate to the new post / reel after success animation
  useEffect(() => {
    if (pipeline.phase !== "done") return;
    try {
      window.localStorage.removeItem(POST_WIZARD_DRAFT_KEY);
    } catch {
      // ignore storage errors
    }
    const timer = setTimeout(() => {
      router.refresh();
      router.push(
        forceReel
          ? "/micro"
          : pipeline.publishedPostId
          ? `/post/${pipeline.publishedPostId}`
          : "/",
      );
    }, 2000);
    return () => clearTimeout(timer);
  }, [pipeline.phase, pipeline.publishedPostId, forceReel, router]);

  // ── Media helpers ────────────────────────────────────────────────────

  function clearVideoPoster() {
    if (videoPoster?.url.startsWith("blob:")) {
      URL.revokeObjectURL(videoPoster.url);
    }
    setVideoPoster(null);
  }

  function clearPreview() {
    mediaItems.forEach((p) => {
      if (p.url.startsWith("blob:")) URL.revokeObjectURL(p.url);
    });
    clearVideoPoster();
    setMediaItems([]);
    setUndoRemoved(null);
    setMediaError(null);
  }

  function vibrate(pattern: number | number[]) {
    if (typeof navigator !== "undefined" && "vibrate" in navigator) {
      try {
        navigator.vibrate(pattern);
      } catch {
        // non-critical haptic feedback
      }
    }
  }

  async function handleFilesSelect(files: FileList | null, options?: { append?: boolean }) {
    if (!files || files.length === 0) return;

    const append = Boolean(options?.append) && mediaItems.length > 0 && mediaItems[0]?.type === "image";
    const incomingArray = Array.from(files);

    const hasVideo = incomingArray.some((f) => f.type.startsWith("video/") || isSupportedVideoFile(f));
    if (append && hasVideo) {
      setMediaError("Çoklu fotoğraf (carousel) içine video eklenemez. Video için önce mevcut fotoğrafları kaldırın.");
      vibrate([25, 35, 25]);
      return;
    }

    if (incomingArray.length > 1 && hasVideo) {
      setMediaError("Çoklu seçim (carousel) sadece fotoğraflar için desteklenmektedir. Lütfen sadece fotoğraf seçin veya tek bir kısa video yükleyin.");
      vibrate([25, 35, 25]);
      return;
    }

    const totalCount = append ? mediaItems.length + incomingArray.length : incomingArray.length;
    if (totalCount > 10) {
      setMediaError(`En fazla 10 fotoğraf seçebilirsiniz (şu an ${mediaItems.length} seçili).`);
      vibrate([25, 35, 25]);
      return;
    }

    setMediaError(null);
    setUndoRemoved(null);

    const nextItems: MediaPreviewItem[] = [];

    for (let i = 0; i < incomingArray.length; i++) {
      const rawFile = incomingArray[i];
      const isVideo = rawFile.type.startsWith("video/") || isSupportedVideoFile(rawFile);
      const isImage = !isVideo && (rawFile.type.startsWith("image/") || isSupportedImageFile(rawFile));

      if (!ENABLE_DIRECT_VIDEO_UPLOAD && isVideo) {
        setMediaError(
          "Doğrudan video yükleme kapalıdır. Uzun ders videolarınız için aşağıdan YouTube, Vimeo veya benzeri platform bağlantısı ekleyebilirsiniz."
        );
        return;
      }

      if (!isVideo && !isImage) {
        setMediaError(
          "Desteklenmeyen dosya türü. Fotoğraf (JPG, PNG, WEBP, GIF, AVIF, HEIC) veya kısa tanıtım videosu (MP4, WEBM, MOV, M4V) seçin."
        );
        vibrate([25, 35, 25]);
        return;
      }

      let processedFile = rawFile;
      let durationSeconds: number | undefined;

      if (isVideo) {
        setIsValidatingMedia(true);
        const result = await validateVideoLimits(rawFile, { isReel: true });
        setIsValidatingMedia(false);
        if (!result.valid) {
          vibrate([30, 40, 30]);
          setMediaError(result.error ?? "Kısa tanıtım videosu en fazla 30 saniye ve 25 MB olabilir.");
          return;
        }
        durationSeconds = result.duration;
      } else {
        setIsValidatingMedia(true);
        const prepared = await prepareImageForUpload(rawFile);
        setIsValidatingMedia(false);
        if (!prepared.valid) {
          vibrate([30, 40, 30]);
          setMediaError(prepared.error);
          return;
        }
        processedFile = prepared.file;
      }

      nextItems.push({
        id: `${Date.now()}-${i}-${Math.random().toString(36).slice(2, 7)}`,
        file: processedFile,
        url: URL.createObjectURL(processedFile),
        type: isVideo ? "video" : "image",
        durationSeconds,
      });
    }

    vibrate(15);
    if (append) {
      setMediaItems((prev) => [...prev, ...nextItems]);
    } else {
      mediaItems.forEach((p) => {
        if (p.url.startsWith("blob:")) URL.revokeObjectURL(p.url);
      });
      clearVideoPoster();
      setMediaItems(nextItems);

      // Automatically extract a lightweight WebP poster frame for short promo videos
      // so feed videos render an instant cover without pre-downloading video bytes.
      if (nextItems.length === 1 && nextItems[0]?.type === "video") {
        const videoFile = nextItems[0].file;
        void extractVideoFrameFile(videoFile).then((autoPosterFile) => {
          if (!autoPosterFile) return;
          setVideoPoster((prev) => {
            if (prev) return prev; // Keep user's custom cover if already chosen
            return {
              file: autoPosterFile,
              url: URL.createObjectURL(autoPosterFile),
              isAuto: true,
            };
          });
        });
      }
    }
  }

  async function handleRotateImageAt(index: number) {
    const target = mediaItems[index];
    if (!target || target.type !== "image") return;
    vibrate(15);
    setIsValidatingMedia(true);
    const rotatedFile = await rotateImage90(target.file);
    setIsValidatingMedia(false);
    const nextUrl = URL.createObjectURL(rotatedFile);
    setMediaItems((prev) =>
      prev.map((item, idx) => {
        if (idx !== index) return item;
        if (item.url.startsWith("blob:")) URL.revokeObjectURL(item.url);
        return { ...item, file: rotatedFile, url: nextUrl };
      }),
    );
  }

  function handleRemoveMediaAt(index: number) {
    const target = mediaItems[index];
    if (!target) return;
    vibrate(15);
    // Revoke any previous un-restored undo item before replacing
    if (undoRemoved?.item.url.startsWith("blob:")) {
      URL.revokeObjectURL(undoRemoved.item.url);
    }
    setUndoRemoved({ item: target, index });
    setMediaItems((prev) => prev.filter((_, idx) => idx !== index));
    setMediaError(null);
  }

  function handleUndoRemove() {
    if (!undoRemoved) return;
    vibrate(10);
    setMediaItems((prev) => {
      const next = [...prev];
      const safeIndex = Math.min(undoRemoved.index, next.length);
      next.splice(safeIndex, 0, undoRemoved.item);
      return next;
    });
    setUndoRemoved(null);
  }

  function handleMoveMedia(index: number, direction: -1 | 1) {
    const targetIndex = index + direction;
    if (targetIndex < 0 || targetIndex >= mediaItems.length) return;
    vibrate(10);
    setMediaItems((prev) => {
      const next = [...prev];
      const [moved] = next.splice(index, 1);
      next.splice(targetIndex, 0, moved);
      return next;
    });
  }

  async function handleSelectVideoPoster(file: File | null) {
    if (!file) return;
    setMediaError(null);
    setIsValidatingMedia(true);
    const prepared = await prepareImageForUpload(file);
    setIsValidatingMedia(false);
    if (!prepared.valid) {
      vibrate([30, 40, 30]);
      setMediaError(prepared.error);
      return;
    }
    clearVideoPoster();
    vibrate(15);
    setVideoPoster({
      file: prepared.file,
      url: URL.createObjectURL(prepared.file),
    });
  }

  function handleCaptureVideoPosterFromFile(posterFile: File) {
    clearVideoPoster();
    vibrate(15);
    setVideoPoster({
      file: posterFile,
      url: URL.createObjectURL(posterFile),
    });
  }

  // ── Publish ──────────────────────────────────────────────────────────

  async function handlePublish() {
    if (!caption.trim() || !selectedAreaId || pipeline.isLocked) return;
    await pipeline.run({
      caption: caption.trim(),
      externalUrl: externalUrl.trim() || undefined,
      areaId: selectedAreaId,
      targetGrade,
      isReel: forceReel || (mediaItems.length === 1 && mediaItems[0].type === "video"),
      files: mediaItems.map((item) => item.file),
      videoPosterFile: videoPoster?.file ?? null,
      teacherCreatorPlus,
      followersOnly,
      followersOnlyComments,
      teaserText,
    });
  }

  // ── Render ───────────────────────────────────────────────────────────

  return (
    <>
      {/* Full-screen upload overlay — active during any in-progress phase */}
      {(pipeline.isLocked || pipeline.phase === "done") && (
        <UploadOverlay
          phase={pipeline.phase}
          progress={pipeline.progress}
          message={pipeline.message}
          onCancel={
            pipeline.phase === "compressing" || pipeline.phase === "uploading"
              ? pipeline.abort
              : undefined
          }
        />
      )}

      <div className="bg-white">
        {/* ── Step indicator ── */}
        <div className="flex items-center gap-3 border-b border-slate-100 px-4 py-3">
          <WizardDot active={step === 1} done={step > 1} label="1" />
          <div
            className={`h-0.5 flex-1 rounded-full transition-all duration-500 ${
              step > 1 ? "bg-violet-600" : "bg-slate-200"
            }`}
          />
          <WizardDot active={step === 2} done={false} label="2" />
        </div>

        {step === 1 ? (
          <MediaPickerStep
            forceReel={forceReel}
            mediaItems={mediaItems}
            videoPoster={videoPoster}
            undoRemovedAvailable={Boolean(undoRemoved)}
            isValidating={isValidatingMedia}
            mediaError={mediaError}
            externalUrl={externalUrl}
            onExternalUrlChange={setExternalUrl}
            onFilesSelect={handleFilesSelect}
            onRemoveMediaAt={handleRemoveMediaAt}
            onUndoRemove={handleUndoRemove}
            onMoveMedia={handleMoveMedia}
            onRotateMediaAt={handleRotateImageAt}
            onSelectVideoPoster={handleSelectVideoPoster}
            onCaptureVideoPoster={handleCaptureVideoPosterFromFile}
            onClearVideoPoster={clearVideoPoster}
            onClearMedia={clearPreview}
            onNext={() => setStep(2)}
          />
        ) : (
          <CaptionStep
            areas={areas}
            caption={caption}
            externalUrl={externalUrl}
            selectedAreaId={selectedAreaId}
            targetGrade={targetGrade}
            followersOnly={followersOnly}
            followersOnlyComments={followersOnlyComments}
            teaserText={teaserText}
            forceReel={forceReel}
            pipelineError={pipeline.error}
            canPublish={caption.trim().length > 0 && selectedAreaId > 0 && !pipeline.isLocked}
            onCaptionChange={setCaption}
            onExternalUrlChange={setExternalUrl}
            onAreaChange={setSelectedAreaId}
            onGradeChange={setTargetGrade}
            onFollowersOnlyChange={setFollowersOnly}
            onFollowersOnlyCommentsChange={setFollowersOnlyComments}
            onTeaserTextChange={setTeaserText}
            onBack={() => { setStep(1); pipeline.reset(); }}
            onPublish={handlePublish}
            onRetry={pipeline.reset}
          />
        )}
      </div>
    </>
  );
}

// ── Step 1: Media Picker ──────────────────────────────────────────────────────

type MediaPickerStepProps = {
  forceReel: boolean;
  mediaItems: MediaPreviewItem[];
  videoPoster: VideoPosterItem | null;
  undoRemovedAvailable: boolean;
  isValidating: boolean;
  mediaError: string | null;
  externalUrl: string;
  onExternalUrlChange: (v: string) => void;
  onFilesSelect: (files: FileList | null, options?: { append?: boolean }) => void;
  onRemoveMediaAt: (index: number) => void;
  onUndoRemove: () => void;
  onMoveMedia: (index: number, direction: -1 | 1) => void;
  onRotateMediaAt: (index: number) => void;
  onSelectVideoPoster: (file: File | null) => void;
  onCaptureVideoPoster: (file: File) => void;
  onClearVideoPoster: () => void;
  onClearMedia: () => void;
  onNext: () => void;
};

function MediaPickerStep({
  forceReel,
  mediaItems,
  videoPoster,
  undoRemovedAvailable,
  isValidating,
  mediaError,
  externalUrl,
  onExternalUrlChange,
  onFilesSelect,
  onRemoveMediaAt,
  onUndoRemove,
  onMoveMedia,
  onRotateMediaAt,
  onSelectVideoPoster,
  onCaptureVideoPoster,
  onClearVideoPoster,
  onClearMedia,
  onNext,
}: MediaPickerStepProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const videoPreviewRef = useRef<HTMLVideoElement>(null);
  const [activeSlideIndex, setActiveSlideIndex] = useState(0);
  const [captureError, setCaptureError] = useState<string | null>(null);

  const accept = ENABLE_DIRECT_VIDEO_UPLOAD
    ? (forceReel ? VIDEO_ACCEPT : MEDIA_ACCEPT)
    : IMAGE_ACCEPT;

  const hasMedia = mediaItems.length > 0;
  const isVideo = hasMedia && mediaItems[0].type === "video";
  const safeSlideIndex = Math.min(activeSlideIndex, Math.max(0, mediaItems.length - 1));
  const parsedLink = classifyExternalLink(externalUrl);

  function captureCurrentVideoFrame() {
    setCaptureError(null);
    const video = videoPreviewRef.current;
    if (!video || !video.videoWidth || !video.videoHeight) {
      setCaptureError("Video karesi henüz yüklenmedi. Videoyu oynatıp istediğiniz anda tekrar dokunun.");
      return;
    }
    try {
      const maxSide = 1280;
      let width = video.videoWidth;
      let height = video.videoHeight;
      if (width > maxSide || height > maxSide) {
        if (width > height) {
          height = Math.round((height * maxSide) / width);
          width = maxSide;
        } else {
          width = Math.round((width * maxSide) / height);
          height = maxSide;
        }
      }
      const canvas = document.createElement("canvas");
      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext("2d");
      if (!ctx) return;
      ctx.drawImage(video, 0, 0, width, height);
      canvas.toBlob(
        (blob) => {
          if (!blob) {
            setCaptureError("Video karesi kapak olarak kaydedilemedi. Galeriden kapak görseli seçebilirsiniz.");
            return;
          }
          const posterFile = new File([blob], `video-kapak-${Date.now()}.webp`, {
            type: "image/webp",
            lastModified: Date.now(),
          });
          onCaptureVideoPoster(posterFile);
        },
        "image/webp",
        0.85,
      );
    } catch {
      setCaptureError("Video karesi alınamadı. Galeriden özel kapak fotoğrafı seçebilirsiniz.");
    }
  }

  return (
    <div className="flex flex-col">
      {/* Media area */}
      {hasMedia ? (
        <div className="bg-slate-950">
          <div className="relative bg-black">
            {isVideo ? (
              <div className="relative">
                <video
                  ref={videoPreviewRef}
                  className="max-h-[22rem] w-full object-contain"
                  src={mediaItems[0].url}
                  poster={videoPoster?.url}
                  controls
                  playsInline
                />
                {typeof mediaItems[0].durationSeconds === "number" && (
                  <div className="absolute top-3 left-3 rounded-lg bg-black/70 px-2.5 py-1 text-xs font-black text-white backdrop-blur-sm">
                    🎬 Kısa Tanıtım · {Math.round(mediaItems[0].durationSeconds)} sn / 30 sn
                  </div>
                )}
              </div>
            ) : (
              <div className="relative">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  className="max-h-[22rem] w-full object-contain"
                  src={mediaItems[safeSlideIndex]?.url}
                  alt={`Medya önizlemesi ${safeSlideIndex + 1}`}
                />
                {mediaItems.length > 1 && (
                  <div className="absolute top-3 left-3 bg-black/70 text-white text-xs px-2.5 py-1 rounded-lg font-black backdrop-blur-sm">
                    {safeSlideIndex + 1} / {mediaItems.length}
                  </div>
                )}
              </div>
            )}

            {/* Overlay buttons */}
            <div className="absolute right-3 top-3 flex flex-wrap justify-end gap-1.5">
              {!isVideo && (
                <button
                  type="button"
                  disabled={isValidating}
                  onClick={() => onRotateMediaAt(safeSlideIndex)}
                  className="tap-scale flex items-center gap-1 rounded-xl bg-black/65 px-3 py-1.5 text-xs font-black text-white backdrop-blur-sm transition hover:bg-black/85 disabled:opacity-50"
                  title="Fotoğrafı 90° sağa döndür"
                >
                  ↻ Döndür
                </button>
              )}
              <button
                type="button"
                onClick={onClearMedia}
                className="flex items-center gap-1 rounded-xl bg-black/65 px-3 py-1.5 text-xs font-black text-white backdrop-blur-sm transition hover:bg-black/85"
              >
                ✕ Kaldır
              </button>
              <label className="flex cursor-pointer items-center gap-1 rounded-xl bg-black/65 px-3 py-1.5 text-xs font-black text-white backdrop-blur-sm transition hover:bg-black/85">
                🔄 Değiştir
                <input
                  type="file"
                  className="sr-only"
                  accept={accept}
                  multiple={!forceReel}
                  onChange={(e) => {
                    onFilesSelect(e.target.files, { append: false });
                    e.target.value = "";
                  }}
                />
              </label>
            </div>
          </div>

          {/* ── Carousel Management Filmstrip (Append, Single Delete, Reorder) ── */}
          {!isVideo && (
            <div className="border-t border-slate-800 bg-slate-900 px-3 py-3 text-white">
              <div className="mb-2 flex items-center justify-between gap-2">
                <span className="text-[11px] font-black text-white/80">
                  📸 Slaytlar ({mediaItems.length}/10) · Sırala veya düzenle
                </span>
                {mediaItems.length < 10 && (
                  <div className="flex items-center gap-1.5">
                    <label className="tap-scale inline-flex cursor-pointer items-center gap-1 rounded-lg bg-violet-600 px-2.5 py-1 text-[11px] font-black text-white hover:bg-violet-500">
                      ➕ Fotoğraf Ekle
                      <input
                        type="file"
                        className="sr-only"
                        accept={IMAGE_ACCEPT}
                        multiple
                        onChange={(e) => {
                          onFilesSelect(e.target.files, { append: true });
                          e.target.value = "";
                        }}
                      />
                    </label>
                    <label className="tap-scale inline-flex cursor-pointer items-center gap-1 rounded-lg bg-white/15 px-2.5 py-1 text-[11px] font-black text-white hover:bg-white/25">
                      📷 Çek
                      <input
                        type="file"
                        className="sr-only"
                        accept="image/*"
                        capture="environment"
                        onChange={(e) => {
                          onFilesSelect(e.target.files, { append: true });
                          e.target.value = "";
                        }}
                      />
                    </label>
                  </div>
                )}
              </div>

              <div className="flex gap-2 overflow-x-auto pb-1 hide-scrollbar">
                {mediaItems.map((item, idx) => {
                  const isActive = idx === safeSlideIndex;
                  return (
                    <div
                      key={item.id}
                      className={`relative shrink-0 rounded-xl border-2 p-1 transition ${
                        isActive ? "border-violet-400 bg-violet-500/20" : "border-white/15 bg-white/5"
                      }`}
                    >
                      <button
                        type="button"
                        onClick={() => setActiveSlideIndex(idx)}
                        className="relative block size-16 overflow-hidden rounded-lg bg-black"
                        aria-label={`Slayt ${idx + 1} önizle`}
                      >
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                          src={item.url}
                          alt={`Slayt ${idx + 1}`}
                          className="size-full object-cover"
                        />
                        <span className="absolute bottom-0.5 left-0.5 rounded bg-black/70 px-1 text-[10px] font-black text-white">
                          {idx + 1}
                        </span>
                      </button>

                      {/* Delete single slide */}
                      <button
                        type="button"
                        onClick={() => {
                          onRemoveMediaAt(idx);
                          setActiveSlideIndex((prev) => Math.max(0, prev >= mediaItems.length - 1 ? prev - 1 : prev));
                        }}
                        aria-label={`Slayt ${idx + 1} sil`}
                        className="absolute -right-1.5 -top-1.5 flex size-5 items-center justify-center rounded-full bg-rose-600 text-[10px] font-black text-white shadow hover:bg-rose-500"
                      >
                        ✕
                      </button>

                      {/* Reorder controls */}
                      {mediaItems.length > 1 && (
                        <div className="mt-1 flex items-center justify-center gap-1">
                          <button
                            type="button"
                            disabled={idx === 0}
                            onClick={() => {
                              onMoveMedia(idx, -1);
                              setActiveSlideIndex(idx - 1);
                            }}
                            aria-label="Sola taşı"
                            className="rounded bg-white/15 px-1.5 py-0.5 text-[10px] font-black text-white disabled:opacity-30 hover:bg-white/25"
                          >
                            ←
                          </button>
                          <button
                            type="button"
                            disabled={idx === mediaItems.length - 1}
                            onClick={() => {
                              onMoveMedia(idx, 1);
                              setActiveSlideIndex(idx + 1);
                            }}
                            aria-label="Sağa taşı"
                            className="rounded bg-white/15 px-1.5 py-0.5 text-[10px] font-black text-white disabled:opacity-30 hover:bg-white/25"
                          >
                            →
                          </button>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* ── Short Promo Video Cover Photo (Thumbnail) Picker ── */}
          {isVideo && (
            <div className="border-t border-slate-800 bg-slate-900 px-3.5 py-3 text-white">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div className="flex items-center gap-2.5 min-w-0">
                  {videoPoster ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={videoPoster.url}
                      alt="Video kapak önizlemesi"
                      className="size-11 shrink-0 rounded-lg border border-violet-400 object-cover"
                    />
                  ) : (
                    <div className="flex size-11 shrink-0 items-center justify-center rounded-lg border border-white/15 bg-white/10 text-lg">
                      🖼️
                    </div>
                  )}
                  <div className="min-w-0">
                    <p className="text-xs font-black text-white">
                      {videoPoster
                        ? videoPoster.isAuto
                          ? "Otomatik Kapak Oluşturuldu ✓"
                          : "Özel Kapak Fotoğrafı Seçildi ✓"
                        : "Video Kapağı (İsteğe Bağlı)"}
                    </p>
                    <p className="text-[11px] font-medium text-white/65">
                      Akış ve Keşfet&apos;te videonuzun kapak görseli olarak görünür.
                    </p>
                  </div>
                </div>

                <div className="flex flex-wrap items-center gap-1.5">
                  <button
                    type="button"
                    onClick={captureCurrentVideoFrame}
                    className="tap-scale rounded-lg bg-violet-600 px-2.5 py-1.5 text-[11px] font-black text-white hover:bg-violet-500"
                  >
                    🎞️ Bu Kareyi Kapak Yap
                  </button>
                  <label className="tap-scale cursor-pointer rounded-lg bg-white/15 px-2.5 py-1.5 text-[11px] font-black text-white hover:bg-white/25">
                    🖼️ Galeriden Seç
                    <input
                      type="file"
                      className="sr-only"
                      accept={IMAGE_ACCEPT}
                      onChange={(e) => {
                        void onSelectVideoPoster(e.target.files?.[0] ?? null);
                        e.target.value = "";
                      }}
                    />
                  </label>
                  {videoPoster && (
                    <button
                      type="button"
                      onClick={onClearVideoPoster}
                      className="tap-scale rounded-lg bg-rose-600/80 px-2 py-1.5 text-[11px] font-black text-white hover:bg-rose-500"
                    >
                      ✕
                    </button>
                  )}
                </div>
              </div>
              {captureError && (
                <p className="mt-2 rounded-lg bg-amber-500/20 px-2.5 py-1.5 text-[11px] font-bold text-amber-200">
                  ⚠️ {captureError}
                </p>
              )}
            </div>
          )}
        </div>
      ) : (
        /* Empty picker with gallery + direct camera capture shortcuts */
        <div className="bg-gradient-to-br from-night via-violet-900 to-crystal p-6 text-white">
          <label
            className="flex min-h-48 cursor-pointer flex-col items-center justify-center gap-3.5 transition-opacity hover:opacity-95"
            aria-label="Galeriden fotoğraf veya kısa tanıtım videosu seç"
          >
            {isValidating ? (
              <>
                <div className="size-16 animate-spin rounded-full border-4 border-white/30 border-t-white" />
                <p className="text-sm font-black">Kontrol ve optimizasyon yapılıyor…</p>
              </>
            ) : (
              <>
                <span className="flex size-16 items-center justify-center rounded-2xl border-2 border-white/30 bg-white/10 text-3xl backdrop-blur">
                  {forceReel ? "🎬" : "📸"}
                </span>
                <div className="text-center">
                  <p className="text-base font-black">
                    {forceReel
                      ? "Kısa Tanıtım Videosu Seç (Maks. 30 sn)"
                      : "Fotoğraf veya Kısa Tanıtım Videosu Seç"}
                  </p>
                  <p className="mt-1 text-xs font-bold text-white/75">
                    {forceReel
                      ? "MP4 · WEBM · MOV (iPhone) · M4V · Maks. 30 sn, 25 MB"
                      : "JPG, PNG, WEBP, GIF, AVIF, HEIC · Kısa Video (MP4, WEBM, MOV · Maks. 30 sn)"}
                  </p>
                  <div className="mt-2.5 inline-flex items-center gap-1.5 rounded-full bg-white/15 px-3 py-1 text-[11px] font-bold text-white/90 backdrop-blur-xs">
                    <span>🔗</span>
                    <span>30 sn üzeri uzun ders videoları için aşağıdan YouTube, Vimeo vb. link ekleyebilirsiniz.</span>
                  </div>
                </div>
              </>
            )}
            <input
              ref={inputRef}
              type="file"
              className="sr-only"
              accept={accept}
              multiple={!forceReel}
              onChange={(e) => {
                onFilesSelect(e.target.files, { append: false });
                e.target.value = "";
              }}
            />
          </label>

          {/* Direct Camera Capture Shortcuts */}
          {!isValidating && (
            <div className="mt-4 flex flex-wrap items-center justify-center gap-2 border-t border-white/15 pt-4">
              {!forceReel && (
                <label className="tap-scale inline-flex cursor-pointer items-center gap-1.5 rounded-xl border border-white/25 bg-white/15 px-3.5 py-2 text-xs font-black text-white backdrop-blur-xs transition hover:bg-white/25">
                  <span>📷</span>
                  <span>Fotoğraf Çek</span>
                  <input
                    type="file"
                    className="sr-only"
                    accept="image/*"
                    capture="environment"
                    onChange={(e) => {
                      onFilesSelect(e.target.files, { append: false });
                      e.target.value = "";
                    }}
                  />
                </label>
              )}
              {ENABLE_DIRECT_VIDEO_UPLOAD && (
                <label className="tap-scale inline-flex cursor-pointer items-center gap-1.5 rounded-xl border border-white/25 bg-white/15 px-3.5 py-2 text-xs font-black text-white backdrop-blur-xs transition hover:bg-white/25">
                  <span>🎥</span>
                  <span>30 sn Video Çek</span>
                  <input
                    type="file"
                    className="sr-only"
                    accept={VIDEO_ACCEPT}
                    capture="environment"
                    onChange={(e) => {
                      onFilesSelect(e.target.files, { append: false });
                      e.target.value = "";
                    }}
                  />
                </label>
              )}
            </div>
          )}
        </div>
      )}

      {/* Undo removed photo banner */}
      {undoRemovedAvailable && (
        <div className="mx-4 mt-3 flex items-center justify-between rounded-xl border border-violet-200 bg-violet-50 px-3.5 py-2.5 text-xs font-bold text-violet-900">
          <span>Fotoğraf slayttan kaldırıldı.</span>
          <button
            type="button"
            onClick={onUndoRemove}
            className="tap-scale rounded-lg bg-violet-600 px-3 py-1 text-xs font-black text-white hover:bg-violet-700"
          >
            ↩️ Geri Al
          </button>
        </div>
      )}

      {/* Media error */}
      {mediaError && (
        <div className="mx-4 mt-3 rounded-xl bg-red-50 px-4 py-3 text-sm font-bold text-red-600">
          ⚠️ {mediaError}
        </div>
      )}

      {/* ── Quick Link Attachment in Step 1 ── */}
      <div className="mx-4 mt-4 rounded-2xl border border-slate-200/80 bg-slate-50/70 p-3.5">
        <div className="flex items-center justify-between gap-2 mb-2">
          <label className="text-xs font-black text-slate-700 flex items-center gap-1.5">
            <span>🔗</span>
            <span>Uzun Video veya Web Linki Ekle (YouTube, Vimeo vb.)</span>
          </label>
          {externalUrl.trim() ? (
            <button
              type="button"
              onClick={() => onExternalUrlChange("")}
              className="text-[10px] font-black text-rose-600 hover:underline"
            >
              Temizle
            </button>
          ) : (
            <span className="text-[10px] font-bold text-slate-400">İsteğe Bağlı</span>
          )}
        </div>

        <input
          type="url"
          value={externalUrl}
          onChange={(e) => onExternalUrlChange(e.target.value)}
          placeholder="https://youtube.com/watch?v=..., vimeo.com/... veya site linkiniz"
          className="w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-xs font-medium text-night placeholder:text-slate-400 outline-none transition focus:border-violet-500 focus:ring-2 focus:ring-violet-100"
        />

        {parsedLink && (
          <div className="mt-2.5">
            <ExternalLinkCard url={externalUrl} allowInlineEmbed={false} />
          </div>
        )}
      </div>

      {/* Next button */}
      <div className="px-4 py-4">
        <button
          type="button"
          id="wizard-step1-next"
          onClick={onNext}
          disabled={isValidating}
          className="w-full rounded-xl bg-night py-4 text-sm font-black text-white shadow-sm transition-all active:scale-[0.98] disabled:opacity-40"
        >
          {hasMedia
            ? "Devam Et →"
            : externalUrl.trim()
            ? "Bağlantı ile Devam Et →"
            : "Medya olmadan devam et →"}
        </button>

        {!hasMedia && !externalUrl.trim() && (
          <p className="mt-2 text-center text-xs font-semibold text-slate-400">
            Medya veya bağlantı seçimi zorunlu değildir, sadece yazı ile de paylaşabilirsiniz.
          </p>
        )}
      </div>
    </div>
  );
}

// ── Step 2: Caption ───────────────────────────────────────────────────────────

type CaptionStepProps = {
  areas: ComposerArea[];
  caption: string;
  externalUrl: string;
  selectedAreaId: number;
  targetGrade: string;
  followersOnly: boolean;
  followersOnlyComments: boolean;
  teaserText: string;
  forceReel: boolean;
  pipelineError: string | null;
  canPublish: boolean;
  onCaptionChange: (v: string) => void;
  onExternalUrlChange: (v: string) => void;
  onAreaChange: (id: number) => void;
  onGradeChange: (g: string) => void;
  onFollowersOnlyChange: (v: boolean) => void;
  onFollowersOnlyCommentsChange: (v: boolean) => void;
  onTeaserTextChange: (v: string) => void;
  onBack: () => void;
  onPublish: () => void;
  onRetry: () => void;
};

function CaptionStep({
  areas,
  caption,
  externalUrl,
  selectedAreaId,
  targetGrade,
  followersOnly,
  followersOnlyComments,
  teaserText,
  forceReel,
  pipelineError,
  canPublish,
  onCaptionChange,
  onExternalUrlChange,
  onAreaChange,
  onGradeChange,
  onFollowersOnlyChange,
  onFollowersOnlyCommentsChange,
  onTeaserTextChange,
  onBack,
  onPublish,
  onRetry,
}: CaptionStepProps) {
  return (
    <div className="flex flex-col gap-0 pb-28">
      {/* Back header */}
      <div className="flex items-center gap-3 border-b border-slate-100 px-4 py-3">
        <button
          type="button"
          id="wizard-step2-back"
          onClick={onBack}
          className="flex size-9 items-center justify-center rounded-lg bg-slate-100 font-bold text-night transition hover:bg-slate-200"
          aria-label="Geri"
        >
          ←
        </button>
        <p className="text-sm font-black text-slate-500">
          {forceReel ? "🎬 Reel" : "📸 Gönderi"} detayları
        </p>
      </div>

      {/* ── Caption textarea ── */}
      <div className="px-4 pt-5">
        <label className="mb-1.5 block text-xs font-black uppercase tracking-wider text-slate-500">
          Açıklama <span className="text-rose-500">*</span>
        </label>
        <textarea
          id="wizard-caption"
          className="w-full min-h-[7rem] resize-none rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-base text-night placeholder:text-slate-400 outline-none transition focus:border-violet-400 focus:bg-white focus:ring-2 focus:ring-violet-100"
          placeholder="Ne öğrettiniz? Kısa ve net bir açıklama yazın… 🎯"
          value={caption}
          onChange={(e) => onCaptionChange(e.target.value)}
          maxLength={2200}
          autoFocus
        />
        <p className="mt-1 text-right text-[0.65rem] font-bold text-slate-400">
          {caption.length}/2200
        </p>
      </div>

      {/* ── Area chips ── */}
      <div className="px-4 pt-4">
        <p className="mb-2 text-xs font-black uppercase tracking-wider text-slate-500">
          Konu Alanı <span className="text-rose-500">*</span>
        </p>
        {areas.length === 0 ? (
          <p className="text-xs font-semibold text-slate-400">
            Henüz konu alanı yok. Profilinizden ilgi alanı ekleyin.
          </p>
        ) : (
          <div className="flex gap-2 overflow-x-auto pb-2 [&::-webkit-scrollbar]:hidden">
            {areas.map((area) => (
              <button
                key={area.id}
                type="button"
                onClick={() => onAreaChange(area.id)}
                className={`shrink-0 whitespace-nowrap rounded-xl px-4 py-2 text-xs font-black transition ${
                  selectedAreaId === area.id
                    ? "bg-violet-600 text-white shadow-sm"
                    : "border border-slate-200 bg-white text-slate-600 hover:bg-slate-50"
                }`}
              >
                {displayEducationAreaName(area.area_name)}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* ── Grade chips ── */}
      <div className="px-4 pt-5">
        <p className="mb-2 text-xs font-black uppercase tracking-wider text-slate-500">
          Hedef Sınıf Seviyesi
        </p>
        <div className="grid grid-cols-2 gap-1.5 sm:grid-cols-3">
          {INDIVIDUAL_GRADE_LEVEL_OPTIONS.map((grade) => (
            <button
              key={grade}
              type="button"
              onClick={() => onGradeChange(grade)}
              className={`rounded-xl px-2 py-2.5 text-xs font-bold transition ${
                targetGrade === grade
                  ? "bg-violet-600 text-white ring-2 ring-violet-200"
                  : "border border-slate-200 bg-white text-slate-700 hover:bg-slate-50"
              }`}
            >
              {grade}
            </button>
          ))}
        </div>
      </div>

      {/* ── External URL & Video Link ── */}
      <div className="px-4 pt-5">
        <div className="flex items-center justify-between gap-2 mb-1.5">
          <label className="block text-xs font-black uppercase tracking-wider text-slate-700">
            🔗 Uzun Video / Dış Bağlantı Linki
          </label>
          {externalUrl.trim() ? (
            <button
              type="button"
              onClick={() => onExternalUrlChange("")}
              className="text-[10px] font-black text-rose-600 hover:underline"
            >
              Temizle
            </button>
          ) : (
            <span className="text-[10px] font-bold text-slate-400">İsteğe Bağlı</span>
          )}
        </div>

        {/* Platform shortcuts */}
        <div className="flex flex-wrap items-center gap-1.5 mb-2.5">
          <button
            type="button"
            onClick={() => onExternalUrlChange("https://youtube.com/watch?v=")}
            className="flex items-center gap-1 rounded-lg border border-red-200 bg-red-50/70 px-2.5 py-1 text-[11px] font-bold text-red-700 transition hover:bg-red-100 active:scale-95"
          >
            <span>🔴</span>
            <span>YouTube</span>
          </button>
          <button
            type="button"
            onClick={() => onExternalUrlChange("https://vimeo.com/")}
            className="flex items-center gap-1 rounded-lg border border-indigo-200 bg-indigo-50/70 px-2.5 py-1 text-[11px] font-bold text-indigo-700 transition hover:bg-indigo-100 active:scale-95"
          >
            <span>🎬</span>
            <span>Vimeo</span>
          </button>
          <button
            type="button"
            onClick={() => onExternalUrlChange("https://instagram.com/reel/")}
            className="flex items-center gap-1 rounded-lg border border-pink-200 bg-pink-50/70 px-2.5 py-1 text-[11px] font-bold text-pink-700 transition hover:bg-pink-100 active:scale-95"
          >
            <span>📸</span>
            <span>Instagram</span>
          </button>
          <button
            type="button"
            onClick={() => onExternalUrlChange("https://")}
            className="flex items-center gap-1 rounded-lg border border-slate-200 bg-slate-50 px-2.5 py-1 text-[11px] font-bold text-slate-700 transition hover:bg-slate-100 active:scale-95"
          >
            <span>🌐</span>
            <span>Web Sitesi</span>
          </button>
        </div>

        <input
          type="url"
          className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-night placeholder:text-slate-400 outline-none transition focus:border-violet-500 focus:bg-white focus:ring-2 focus:ring-violet-100"
          placeholder="https://youtube.com/watch?v=..., https://vimeo.com/... veya ders linkiniz"
          value={externalUrl}
          onChange={(e) => onExternalUrlChange(e.target.value)}
        />

        {/* Link Classification & Status Badge */}
        {externalUrl.trim() && (() => {
          const parsed = classifyExternalLink(externalUrl);
          if (!parsed) return null;
          return (
            <div className="mt-2 space-y-2">
              <div className="flex flex-wrap items-center gap-2">
                <span className={`inline-flex items-center gap-1 rounded-md px-2.5 py-0.5 text-[11px] font-black ${
                  parsed.type === "youtube"
                    ? "bg-red-100 text-red-700 border border-red-200"
                    : parsed.type === "instagram"
                    ? "bg-pink-100 text-pink-700 border border-pink-200"
                    : parsed.type === "video"
                    ? "bg-violet-100 text-violet-700 border border-violet-200"
                    : "bg-indigo-100 text-indigo-700 border border-indigo-200"
                }`}>
                  <span>✓</span>
                  <span>{parsed.label} Algılandı</span>
                </span>
                <span className="text-[11px] font-medium text-slate-500">
                  {parsed.type === "youtube"
                    ? "Feed'de YouTube video kartı ve yönlendirmesi olarak görünecektir."
                    : parsed.type === "video"
                    ? "Feed'de uzun video yönlendirme kartı olarak görünecektir."
                    : parsed.type === "instagram"
                    ? "Feed'de Instagram kartı olarak görüntülenecektir."
                    : "Feed'de site kartı olarak görüntülenecektir."}
                </span>
              </div>
              <div className="overflow-hidden rounded-xl">
                <ExternalLinkCard url={externalUrl} allowInlineEmbed={false} />
              </div>
            </div>
          );
        })()}

        {!externalUrl.trim() && (
          <p className="mt-1.5 text-[0.68rem] font-medium text-slate-400">
            Zigo&apos;da uzun video barındırılmaz. Uzun ders videolarınız için YouTube, Vimeo, Dailymotion, Loom veya eğitim platformu linkinizi ekleyerek öğrencileri doğrudan yönlendirebilirsiniz.
          </p>
        )}
      </div>

      {/* ── Followers Only Toggle ── */}
      <div className="px-4 pt-5">
        <label className="flex items-center justify-between rounded-xl border border-slate-200 bg-white p-4 shadow-sm transition hover:bg-slate-50 cursor-pointer">
          <div className="flex flex-col gap-1 pr-4">
            <span className="text-sm font-black text-night flex items-center gap-2">
              🔒 Sadece Takipçilerime Özel
            </span>
            <span className="text-[0.65rem] font-bold text-slate-400">
              Gönderiyi sadece sizi takip edenler görebilir. Takip etmeyenler bulanık görecek.
            </span>
          </div>
          <div className="relative inline-flex h-6 w-11 shrink-0 cursor-pointer items-center rounded-full transition-colors duration-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-500 focus-visible:ring-offset-2"
               style={{ backgroundColor: followersOnly ? "#8b5cf6" : "#e2e8f0" }}
               onClick={() => onFollowersOnlyChange(!followersOnly)}>
            <span className={`inline-block size-4 transform rounded-full bg-white transition-transform duration-300 ${followersOnly ? "translate-x-6" : "translate-x-1"}`} />
          </div>
        </label>
        {followersOnly && (
          <div className="mt-3">
            <input
              type="text"
              className="w-full rounded-xl border border-violet-200 bg-violet-50/50 px-4 py-3 text-sm text-night placeholder:text-violet-300 outline-none transition focus:border-violet-400 focus:bg-white focus:ring-2 focus:ring-violet-100"
              placeholder="Teaser yazısı ör: 'Ödüllü soru burada!'"
              value={teaserText}
              onChange={(e) => onTeaserTextChange(e.target.value)}
              maxLength={150}
            />
            <p className="mt-1 text-right text-[0.65rem] font-bold text-violet-400">
              {teaserText.length}/150
            </p>
          </div>
        )}
      </div>

      {/* ── Followers Only Comments Toggle ── */}
      <div className="px-4 pt-3">
        <label className="flex items-center justify-between rounded-xl border border-slate-200 bg-white p-4 shadow-sm transition hover:bg-slate-50 cursor-pointer">
          <div className="flex flex-col gap-1 pr-4">
            <span className="text-sm font-black text-night flex items-center gap-2">
              💬 Yorumlar Sadece Takipçilerime Açık
            </span>
            <span className="text-[0.65rem] font-bold text-slate-400">
              Yorum yapabilmek için takipçi olmayı zorunlu kılar.
            </span>
          </div>
          <div className="relative inline-flex h-6 w-11 shrink-0 cursor-pointer items-center rounded-full transition-colors duration-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-500 focus-visible:ring-offset-2"
               style={{ backgroundColor: followersOnlyComments ? "#8b5cf6" : "#e2e8f0" }}
               onClick={() => onFollowersOnlyCommentsChange(!followersOnlyComments)}>
            <span className={`inline-block size-4 transform rounded-full bg-white transition-transform duration-300 ${followersOnlyComments ? "translate-x-6" : "translate-x-1"}`} />
          </div>
        </label>
      </div>

      {/* ── Pipeline error + retry ── */}
      {pipelineError && (
        <div className="mx-4 mt-5 rounded-xl bg-red-50 px-4 py-4">
          <p className="text-sm font-bold text-red-700">⚠️ {pipelineError}</p>
          <button
            type="button"
            id="wizard-retry"
            onClick={onRetry}
            className="mt-3 w-full rounded-xl border border-red-200 bg-white py-2.5 text-sm font-black text-red-600 transition hover:bg-red-50"
          >
            🔄 Tekrar Dene
          </button>
        </div>
      )}

      {/* ── Publish CTA (sticky) ── */}
      <div
        className="zigo-fixed-shell"
        style={{ bottom: "calc(4.5rem + env(safe-area-inset-bottom, 0px))" }}
      >
        <button
          type="button"
          id="wizard-publish"
          onClick={onPublish}
          disabled={!canPublish}
          className="w-full rounded-xl bg-gradient-to-r from-violet-600 to-purple-600 py-4 text-sm font-black text-white shadow-lg shadow-violet-300/50 transition-all active:scale-[0.98] disabled:opacity-40"
        >
          {forceReel ? "🎬 Reeli Paylaş" : "🚀 Paylaş"}
        </button>
      </div>
    </div>
  );
}

// ── Upload Overlay ────────────────────────────────────────────────────────────

type UploadOverlayProps = {
  phase: UploadPhase;
  progress: number;
  message: string;
  onCancel?: () => void;
};

function UploadOverlay({ phase, progress, message, onCancel }: UploadOverlayProps) {
  const isDone = phase === "done";
  const activeIndex = OVERLAY_STEPS.findIndex((s) => s.id === phase);

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm"
      role="dialog"
      aria-modal="true"
      aria-label="İçerik yükleniyor"
    >
      <div className="mx-4 w-full max-w-sm rounded-2xl bg-white p-6 shadow-2xl">
        {isDone ? (
          /* ── Success screen ── */
          <div className="flex flex-col items-center gap-4 py-4 text-center">
            <span className="flex size-16 items-center justify-center rounded-full bg-green-100 text-3xl">
              ✅
            </span>
            <div>
              <p className="text-lg font-black text-night">Paylaşıldı!</p>
              <p className="mt-1 text-sm font-semibold text-slate-500">
                Gönderinize yönlendiriliyorsunuz…
              </p>
            </div>
            {/* Mini progress bar at 100% */}
            <div className="h-1.5 w-full overflow-hidden rounded-full bg-slate-100">
              <div className="h-full rounded-full bg-green-400" style={{ width: "100%" }} />
            </div>
          </div>
        ) : (
          /* ── In-progress screen ── */
          <>
            {/* Spinner + label */}
            <div className="mb-5 flex items-center gap-3">
              <div className="size-9 shrink-0 animate-spin rounded-full border-[3px] border-violet-200 border-t-violet-600" />
              <div className="min-w-0">
                <p className="text-sm font-black text-night">İçerik Yükleniyor</p>
                <p className="truncate text-xs font-semibold text-slate-500">{message}</p>
              </div>
            </div>

            {/* Progress bar */}
            <div className="h-2 overflow-hidden rounded-full bg-slate-100">
              <div
                className="h-full rounded-full bg-gradient-to-r from-violet-600 to-purple-400 transition-all duration-500 ease-out"
                style={{ width: `${progress}%` }}
              />
            </div>
            <p className="mt-1.5 text-right text-[0.65rem] font-bold text-slate-400">
              {progress}%
            </p>

            {/* Step checklist */}
            <div className="mt-5 space-y-2.5">
              {OVERLAY_STEPS.filter((s) => s.id !== "done").map((s, i) => {
                const isActive = s.id === phase;
                const isPast = i < activeIndex;
                return (
                  <div
                    key={s.id}
                    className={`flex items-center gap-2.5 text-xs font-bold transition-opacity ${
                      isActive ? "opacity-100" : isPast ? "opacity-60" : "opacity-25"
                    }`}
                  >
                    <span
                      className={`flex size-5 shrink-0 items-center justify-center rounded-full text-[10px] font-black ${
                        isPast
                          ? "bg-green-100 text-green-600"
                          : isActive
                          ? "bg-violet-100 text-violet-700"
                          : "bg-slate-100 text-slate-400"
                      }`}
                    >
                      {isPast ? "✓" : i + 1}
                    </span>
                    <span className={isActive ? "text-night" : "text-slate-400"}>
                      {s.label}
                    </span>
                  </div>
                );
              })}
            </div>

            {/* Cancel button — only during compression */}
            {onCancel && (
              <button
                type="button"
                id="wizard-overlay-cancel"
                onClick={onCancel}
                className="mt-5 w-full rounded-xl border border-slate-200 py-2.5 text-sm font-black text-slate-500 transition hover:bg-slate-50"
              >
                İptal Et
              </button>
            )}
          </>
        )}
      </div>
    </div>
  );
}

// ── Shared sub-components ─────────────────────────────────────────────────────

function WizardDot({
  active,
  done,
  label,
}: {
  active: boolean;
  done: boolean;
  label: string;
}) {
  return (
    <span
      className={`flex size-7 shrink-0 items-center justify-center rounded-full text-xs font-black transition-all duration-300 ${
        done
          ? "bg-violet-600 text-white"
          : active
          ? "bg-night text-white ring-2 ring-night/20"
          : "bg-slate-200 text-slate-400"
      }`}
    >
      {done ? "✓" : label}
    </span>
  );
}
