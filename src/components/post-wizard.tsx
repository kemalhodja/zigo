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
import { validateVideoLimits } from "@/lib/client/compress-video";
import { type UploadPhase,useUploadPipeline } from "@/lib/client/use-upload-pipeline";
import { displayEducationAreaName } from "@/lib/domain/education-catalog";
import { INDIVIDUAL_GRADE_LEVEL_OPTIONS } from "@/lib/domain/grade-level";

// ── Constants ─────────────────────────────────────────────────────────────────

const ALLOWED_TYPES = new Set([
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/gif",
  "video/mp4",
  "video/webm",
]);
const MAX_IMAGE_BYTES = 100 * 1024 * 1024;

const OVERLAY_STEPS: { id: UploadPhase; label: string }[] = [
  { id: "validating", label: "Doğrulanıyor" },
  { id: "compressing", label: "Video Optimize Ediliyor" },
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
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [previews, setPreviews] = useState<{ url: string; type: "image" | "video" }[]>([]);
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
    if ((!selectedAreaId || selectedAreaId === 0) && areas.length > 0 && areas[0]?.id) {
      setSelectedAreaId(areas[0].id);
    }
  }, [areas, selectedAreaId]);

  // Navigate to the new post / reel after success animation
  useEffect(() => {
    if (pipeline.phase !== "done") return;
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

  function clearPreview() {
    previews.forEach(p => {
      if (p.url.startsWith("blob:")) URL.revokeObjectURL(p.url);
    });
    setPreviews([]);
    setSelectedFiles([]);
    setMediaError(null);
  }

  async function handleFilesSelect(files: FileList | null) {
    if (!files || files.length === 0) return;
    
    // Limits
    if (files.length > 10) {
      setMediaError("En fazla 10 medya seçebilirsiniz.");
      return;
    }
    
    // Only allow videos for single item reels for now (or multiple photos)
    const hasVideo = Array.from(files).some(f => f.type.startsWith("video/"));
    if (files.length > 1 && hasVideo) {
      setMediaError("Çoklu seçim (carousel) sadece fotoğraflar için desteklenmektedir. Lütfen sadece fotoğraf seçin veya tek bir video yükleyin.");
      return;
    }

    clearPreview();
    setMediaError(null);

    const validFiles: File[] = [];
    const newPreviews: { url: string; type: "image" | "video" }[] = [];

    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      if (!ALLOWED_TYPES.has(file.type)) {
        setMediaError("Desteklenmeyen dosya türü tespit edildi. Lütfen sadece JPG, PNG, WEBP, GIF, MP4 veya WEBM seçin.");
        return;
      }

      if (file.type.startsWith("video/")) {
        setIsValidatingMedia(true);
        const result = await validateVideoLimits(file);
        setIsValidatingMedia(false);
        if (!result.valid) {
          setMediaError(result.error ?? "Video geçersiz.");
          return;
        }
      } else if (file.size > MAX_IMAGE_BYTES) {
        setMediaError("Seçilen bir görsel 100 MB sınırını aşıyor.");
        return;
      }

      validFiles.push(file);
      newPreviews.push({ url: URL.createObjectURL(file), type: file.type.startsWith("video/") ? "video" : "image" });
    }

    setSelectedFiles(validFiles);
    setPreviews(newPreviews);
  }

  // ── Publish ──────────────────────────────────────────────────────────

  async function handlePublish() {
    if (!caption.trim() || !selectedAreaId || pipeline.isLocked) return;
    await pipeline.run({
      caption: caption.trim(),
      externalUrl: externalUrl.trim() || undefined,
      areaId: selectedAreaId,
      targetGrade,
      isReel: forceReel || (previews.length === 1 && previews[0].type === "video"),
      files: selectedFiles,
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
          onCancel={pipeline.phase === "compressing" ? pipeline.abort : undefined}
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
            previews={previews}
            isValidating={isValidatingMedia}
            mediaError={mediaError}
            onFilesSelect={handleFilesSelect}
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
  previews: { url: string; type: "image" | "video" }[];
  isValidating: boolean;
  mediaError: string | null;
  onFilesSelect: (files: FileList | null) => void;
  onClearMedia: () => void;
  onNext: () => void;
};

function MediaPickerStep({
  forceReel,
  previews,
  isValidating,
  mediaError,
  onFilesSelect,
  onClearMedia,
  onNext,
}: MediaPickerStepProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const accept = forceReel
    ? "video/mp4,video/webm"
    : "image/jpeg,image/png,image/webp,image/gif,video/mp4,video/webm";

  const hasMedia = previews.length > 0;
  const isVideo = hasMedia && previews[0].type === "video";

  return (
    <div className="flex flex-col">
      {/* Media area */}
      {hasMedia ? (
        <div className="relative bg-black">
          {isVideo ? (
            <video
              className="max-h-[22rem] w-full object-contain"
              src={previews[0].url}
              controls
              playsInline
            />
          ) : (
            <div className="flex overflow-x-auto snap-x snap-mandatory hide-scrollbar">
              {previews.map((p, idx) => (
                <div key={p.url} className="w-full shrink-0 snap-center relative">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    className="max-h-[22rem] w-full object-contain"
                    src={p.url}
                    alt={`Medya önizlemesi ${idx + 1}`}
                  />
                  {previews.length > 1 && (
                    <div className="absolute top-3 left-3 bg-black/60 text-white text-xs px-2 py-1 rounded-md font-bold backdrop-blur-sm">
                      {idx + 1} / {previews.length}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}

          {/* Overlay buttons */}
          <div className="absolute right-3 top-3 flex gap-2">
            <button
              type="button"
              onClick={onClearMedia}
              className="flex items-center gap-1 rounded-xl bg-black/60 px-3 py-1.5 text-xs font-black text-white backdrop-blur-sm transition hover:bg-black/80"
            >
              ✕ Kaldır
            </button>
            <label className="flex cursor-pointer items-center gap-1 rounded-xl bg-black/60 px-3 py-1.5 text-xs font-black text-white backdrop-blur-sm transition hover:bg-black/80">
              🔄 Değiştir
              <input
                type="file"
                className="sr-only"
                accept={accept}
                multiple={!forceReel}
                onChange={(e) => onFilesSelect(e.target.files)}
              />
            </label>
          </div>
        </div>
      ) : (
        /* Empty picker */
        <label
          className="flex min-h-72 cursor-pointer flex-col items-center justify-center gap-5 bg-gradient-to-br from-night via-violet-900 to-crystal text-white transition-opacity hover:opacity-95"
          aria-label="Medya seç"
        >
          {isValidating ? (
            <>
              <div className="size-16 animate-spin rounded-full border-4 border-white/30 border-t-white" />
              <p className="text-sm font-black">Kontrol ediliyor…</p>
            </>
          ) : (
            <>
              <span className="flex size-20 items-center justify-center rounded-2xl border-2 border-white/30 bg-white/10 text-4xl backdrop-blur">
                {forceReel ? "🎬" : "📷"}
              </span>
              <div className="text-center">
                <p className="text-base font-black">
                  {forceReel ? "Video Seç" : "Fotoğraf (Çoklu eklenebilir) veya Video Seç"}
                </p>
                <p className="mt-1 text-xs font-bold text-white/70">
                  {forceReel
                    ? "MP4 · WEBM · Maks 100 MB · Maks 90 sn"
                    : "JPG · PNG · MP4 · WEBM · Maks 100 MB"}
                </p>
              </div>
            </>
          )}
          <input
            ref={inputRef}
            type="file"
            className="sr-only"
            accept={accept}
            multiple={!forceReel}
            onChange={(e) => onFilesSelect(e.target.files)}
          />
        </label>
      )}

      {/* Media error */}
      {mediaError && (
        <div className="mx-4 mt-3 rounded-xl bg-red-50 px-4 py-3 text-sm font-bold text-red-600">
          ⚠️ {mediaError}
        </div>
      )}

      {/* Next button */}
      <div className="px-4 py-4">
        <button
          type="button"
          id="wizard-step1-next"
          onClick={onNext}
          disabled={(forceReel && !hasMedia) || isValidating}
          className="w-full rounded-xl bg-night py-4 text-sm font-black text-white shadow-sm transition-all active:scale-[0.98] disabled:opacity-40"
        >
          {hasMedia
            ? "Devam Et →"
            : forceReel
            ? "Önce video seçin"
            : "Medya olmadan devam et →"}
        </button>

        {!hasMedia && !forceReel && (
          <p className="mt-2 text-center text-xs font-semibold text-slate-400">
            Medya seçimi zorunlu değil
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

      {/* ── External URL ── */}
      <div className="px-4 pt-5">
        <label className="mb-1.5 block text-xs font-black uppercase tracking-wider text-slate-500">
          Dış Bağlantı (İsteğe Bağlı)
        </label>
        <input
          type="url"
          className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-night placeholder:text-slate-400 outline-none transition focus:border-violet-400 focus:bg-white focus:ring-2 focus:ring-violet-100"
          placeholder="https://..."
          value={externalUrl}
          onChange={(e) => onExternalUrlChange(e.target.value)}
        />
        <p className="mt-1.5 text-[0.65rem] font-bold text-slate-400">
          Gönderinizde tıklanabilir bir buton olarak görünür.
        </p>
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
