"use client";

/**
 * use-upload-pipeline.ts
 *
 * Custom React hook encapsulating the full publish pipeline:
 *   validate → [compress] → upload → publish → done
 *
 * Features:
 * - Client-side daily post limit pre-check (localStorage)
 * - Smart video compression + size/duration validation
 * - Exponential-backoff upload/publish with fetchWithRetry
 * - Abort support (compression cancellation)
 * - Orphaned media cleanup on publish failure
 */

import { useRef, useState } from "react";

import { compressImage, isSupportedImageFile, validateImageLimits } from "@/lib/client/compress-image";
import {
  compressVideo,
  isSupportedVideoFile,
  validateVideoLimits,
  VIDEO_COMPRESS_THRESHOLD_BYTES,
  VIDEO_MAX_SIZE_BYTES,
} from "@/lib/client/compress-video";
import { fetchWithRetry } from "@/lib/client/fetch-with-retry";
import { cleanupUploadedMedia } from "@/lib/client/media-cleanup";
import { uploadSocialMedia } from "@/lib/client/upload-media";

// ── Types ─────────────────────────────────────────────────────────────────────

export type UploadPhase =
  | "idle"
  | "validating"
  | "compressing"
  | "uploading"
  | "publishing"
  | "done"
  | "error";

export interface PublishInput {
  caption: string;
  areaId: number;
  targetGrade: string;
  isReel: boolean;
  files: File[];
  videoPosterFile?: File | null;
  teacherCreatorPlus?: boolean;
  premiumPrepLabel?: string;
  premiumPrepUrl?: string;
  sponsoredLabel?: string;
  sponsoredTargetUrl?: string;
  externalUrl?: string;
  followersOnly?: boolean;
  followersOnlyComments?: boolean;
  teaserText?: string;
}

// ── Daily limit helpers ───────────────────────────────────────────────────────
// Limits are strictly enforced by the server API (based on user role and Zigo Plus subscription).
// Client-side limits (e.g. MAX_DAILY_POSTS = 5) were removed as they incorrectly blocked premium users.

// ── Hook ──────────────────────────────────────────────────────────────────────

export function useUploadPipeline() {
  const [phase, setPhase] = useState<UploadPhase>("idle");
  const [progress, setProgress] = useState(0);
  const [message, setMessage] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [publishedPostId, setPublishedPostId] = useState<string | null>(null);

  const abortCtrlRef = useRef<AbortController | null>(null);
  const runningRef = useRef(false);

  /** True while the pipeline is active — UI should be locked during this. */
  const isLocked = phase !== "idle" && phase !== "done" && phase !== "error";

  /** Cancel the current compression and return to idle. */
  function abort(): void {
    abortCtrlRef.current?.abort();
    runningRef.current = false;
    setPhase("idle");
    setProgress(0);
    setMessage("");
    setError(null);
  }

  /** Reset all state back to idle (used by "Retry" button). */
  function reset(): void {
    runningRef.current = false;
    setPhase("idle");
    setProgress(0);
    setMessage("");
    setError(null);
    setPublishedPostId(null);
  }

  async function run(input: PublishInput): Promise<void> {
    if (runningRef.current) {
      console.warn("[POST_PIPELINE] Pipeline is already running.");
      return;
    }
    runningRef.current = true;

    // ── Pre-check ──────────────────────────────
    // Daily limits are enforced authoritatively by the server.

    setError(null);
    setPhase("validating");
    setProgress(5);
    setMessage("Doğrulanıyor…");

    let mediaUrl = "";
    let mediaType: "image" | "video" | "carousel" = "image";
    const uploadedObjectPaths: string[] = [];

    if (input.files && input.files.length > 0) {
      const isCarousel = input.files.length > 1;
      const uploadedUrls: string[] = [];
      
      for (let i = 0; i < input.files.length; i++) {
        let fileToUpload = input.files[i];
        
        // ── Validate & Compress Images ─────────────────────────────────────
        if (fileToUpload.type.startsWith("image/") || isSupportedImageFile(fileToUpload)) {
          const imgValidation = validateImageLimits(fileToUpload);
          if (!imgValidation.valid) {
            console.error(`[POST_PIPELINE] Image validation failed for file ${i + 1}:`, imgValidation.error);
            setPhase("error");
            setError(imgValidation.error ?? `Görsel ${i + 1} doğrulanamadı.`);
            runningRef.current = false;
            return;
          }

          setPhase("compressing");
          setMessage(isCarousel ? `Görsel ${i + 1} optimize ediliyor…` : "Görsel optimize ediliyor…");
          fileToUpload = await compressImage(fileToUpload);
        }

        let videoDurationSeconds: number | undefined;

        // ── Validate & Compress Videos ─────────────────────────────────────
        if (fileToUpload.type.startsWith("video/") || isSupportedVideoFile(fileToUpload)) {
          const videoValidation = await validateVideoLimits(fileToUpload, { isReel: input.isReel });
          if (!videoValidation.valid) {
            console.error(`[POST_PIPELINE] Video validation failed for file ${i + 1}:`, videoValidation.error);
            setPhase("error");
            setError(videoValidation.error ?? `Video ${i + 1} doğrulanamadı. Lütfen en fazla 30 saniyelik bir tanıtım videosu seçin.`);
            runningRef.current = false;
            return;
          }
          videoDurationSeconds = videoValidation.duration;

          // Compress larger short videos (> 12 MB) before upload
          if (fileToUpload.size > VIDEO_COMPRESS_THRESHOLD_BYTES) {
            setPhase("compressing");
            setProgress(10 + (i * 20)); // Approximate progress
            setMessage(isCarousel ? `Video ${i + 1} optimize ediliyor…` : "Video optimize ediliyor… 0%");

            const ctrl = new AbortController();
            abortCtrlRef.current = ctrl;

            try {
              fileToUpload = await compressVideo(fileToUpload, {
                signal: ctrl.signal,
                onProgress: (ratio) => {
                  if (!isCarousel) {
                    setProgress(10 + Math.round(ratio * 40));
                    setMessage(`Video optimize ediliyor… ${Math.round(ratio * 100)}%`);
                  }
                },
              });

              if (fileToUpload.size > VIDEO_MAX_SIZE_BYTES) {
                console.error("[POST_PIPELINE] Post-compression size exceeds limit:", fileToUpload.size);
                setPhase("error");
                setError(
                  `Video sıkıştırıldıktan sonra hâlâ ${Math.round(fileToUpload.size / 1024 / 1024)} MB. ` +
                  "Kısa tanıtım videoları en fazla 25 MB olabilir; uzun videolar için YouTube veya Vimeo linki ekleyebilirsiniz.",
                );
                runningRef.current = false;
                return;
              }
            } catch (err) {
              if (err instanceof DOMException && err.name === "AbortError") {
                runningRef.current = false;
                setPhase("idle");
                setProgress(0);
                setMessage("");
                return;
              }
              console.warn("[POST_PIPELINE] Video compression failed, falling back to original file:", err);
              fileToUpload = input.files[i];
            } finally {
              abortCtrlRef.current = null;
            }
          }
        }

        setPhase("uploading");
        setProgress(50 + Math.round((i / input.files.length) * 25));
        setMessage(isCarousel ? `Medya ${i + 1}/${input.files.length} yükleniyor…` : "Medya yükleniyor…");

        let currentMediaUrl = "";
        try {
          const uploaded = await uploadSocialMedia(fileToUpload, {
            durationSeconds: videoDurationSeconds,
          });
          currentMediaUrl = uploaded.mediaUrl;
          mediaType = uploaded.mediaType;
          uploadedObjectPaths.push(uploaded.objectPath);
        } catch (err) {
          console.error("[POST_PIPELINE_UPLOAD_FAILED]", err);
          setPhase("error");
          setError(
            err instanceof Error && err.message
              ? err.message
              : "Medya yüklenemedi. Bağlantınızı kontrol edip tekrar deneyin.",
          );
          runningRef.current = false;
          return;
        }
        
        uploadedUrls.push(currentMediaUrl);
      }
      
      if (isCarousel) {
        mediaType = "carousel";
        mediaUrl = JSON.stringify(uploadedUrls);
      } else {
        mediaUrl = uploadedUrls[0];
      }

      // ── Optional custom cover photo (thumbnail) for short promo video ────
      if (mediaType === "video" && input.videoPosterFile && mediaUrl) {
        try {
          setPhase("uploading");
          setProgress(70);
          setMessage("Video kapağı yükleniyor…");
          const optimizedPoster = await compressImage(input.videoPosterFile, 1280, 0.82);
          const posterUpload = await uploadSocialMedia(optimizedPoster);
          uploadedObjectPaths.push(posterUpload.objectPath);
          const sep = mediaUrl.includes("?") ? "&" : "?";
          mediaUrl = `${mediaUrl}${sep}poster=${encodeURIComponent(posterUpload.objectPath)}`;
        } catch (posterErr) {
          // Non-fatal: continue publishing the video even if custom cover fails
          console.warn("[POST_PIPELINE] Video poster upload skipped:", posterErr);
        }
      }
      
      setProgress(75);
    }

    // ── Publish post ──────────────────────────────────────────────────────
    setPhase("publishing");
    setProgress(80);
    setMessage("Paylaşım tamamlanıyor…");

    const payload = {
      caption: input.caption,
      mediaUrl,
      mediaType,
      areaId: input.areaId,
      targetAudience: input.targetGrade?.trim() ? "grade" : "all",
      targetGrade: input.targetGrade?.trim() || null,
      isReel: input.isReel,
      followersOnly: input.followersOnly,
      followersOnlyComments: input.followersOnlyComments,
      teaserText: input.teaserText?.trim() || undefined,
      externalUrl: input.externalUrl?.trim() || undefined,
      ...(input.teacherCreatorPlus && input.premiumPrepLabel && input.premiumPrepUrl
        ? { premiumPrepLabel: input.premiumPrepLabel, premiumPrepUrl: input.premiumPrepUrl }
        : {}),
      ...(input.teacherCreatorPlus && input.sponsoredLabel && input.sponsoredTargetUrl
        ? { sponsoredLabel: input.sponsoredLabel, sponsoredTargetUrl: input.sponsoredTargetUrl }
        : {}),
    };

    let publishRes: Response;
    try {
      publishRes = await fetchWithRetry("/api/social/posts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
    } catch (err) {
      console.error("[POST_PIPELINE_PUBLISH_ERROR] Network error during post publish:", err);
      await Promise.allSettled(uploadedObjectPaths.map(p => cleanupUploadedMedia(p)));
      setPhase("error");
      setError(
        "Bağlantı kesildi. İnternet bağlantınızı kontrol edip tekrar deneyin.",
      );
      runningRef.current = false;
      return;
    }

    if (!publishRes.ok) {
      const body = (await publishRes.json().catch(() => null)) as { error?: string } | null;
      console.error("[POST_PIPELINE_PUBLISH_FAILED] HTTP", publishRes.status, body);
      await Promise.allSettled(uploadedObjectPaths.map(p => cleanupUploadedMedia(p)));
      setPhase("error");
      setError(body?.error ?? "Gönderi paylaşılamadı. Lütfen tekrar deneyin.");
      runningRef.current = false;
      return;
    }

    const body = (await publishRes.json().catch(() => null)) as {
      data?: { id?: string };
    } | null;

    setProgress(100);
    setPhase("done");
    setMessage("Paylaşıldı! 🎉");
    setPublishedPostId(body?.data?.id ?? null);
    runningRef.current = false;

    // Haptic ve başarı kutlaması
    try {
      if (typeof navigator !== "undefined" && "vibrate" in navigator) {
        navigator.vibrate([40, 60, 40]);
      }
      import("canvas-confetti").then((confettiMod) => {
        const confetti = confettiMod.default;
        confetti({
          particleCount: 50,
          spread: 60,
          origin: { y: 0.7 },
        });
      }).catch(() => {});
    } catch {
      // non-critical UI polish
    }
  }

  return {
    phase,
    progress,
    message,
    error,
    isLocked,
    publishedPostId,
    run,
    abort,
    reset,
  };
}
