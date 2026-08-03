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

import { cleanupUploadedMedia } from "@/lib/client/media-cleanup";
import { compressVideo, validateVideoLimits, VIDEO_MAX_SIZE_BYTES } from "@/lib/client/compress-video";
import { fetchWithRetry } from "@/lib/client/fetch-with-retry";

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
  file: File | null;
  teacherCreatorPlus?: boolean;
  premiumPrepLabel?: string;
  premiumPrepUrl?: string;
  sponsoredLabel?: string;
  sponsoredTargetUrl?: string;
  externalUrl?: string;
}

// ── Daily limit helpers ───────────────────────────────────────────────────────

const MAX_DAILY_POSTS = 5;

function getDailyKey(): string {
  return `zigo:daily-posts:${new Date().toISOString().slice(0, 10)}`;
}

function readDailyCount(): number {
  try {
    return Number(localStorage.getItem(getDailyKey()) ?? 0);
  } catch {
    return 0; // fail open — server enforces authoritatively
  }
}

function bumpDailyCount(): void {
  try {
    localStorage.setItem(getDailyKey(), String(readDailyCount() + 1));
  } catch {
    // non-critical
  }
}

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
    if (runningRef.current) return;
    runningRef.current = true;

    // ── Client-side daily limit pre-check ──────────────────────────────
    if (readDailyCount() >= MAX_DAILY_POSTS) {
      setPhase("error");
      setError("Günlük maksimum 5 gönderi sınırına ulaştınız. Yarın tekrar deneyin.");
      runningRef.current = false;
      return;
    }

    setError(null);
    setPhase("validating");
    setProgress(5);
    setMessage("Doğrulanıyor…");

    let mediaUrl = "";
    let mediaType: "image" | "video" = "image";
    let uploadedObjectPath = "";

    if (input.file) {
      // ── Validate (size + duration for videos) ──────────────────────────
      const validation = await validateVideoLimits(input.file);
      if (!validation.valid) {
        setPhase("error");
        setError(validation.error ?? "Dosya doğrulanamadı. Lütfen farklı bir dosya seçin.");
        runningRef.current = false;
        return;
      }

      // ── Compress large videos before upload ────────────────────────────
      let fileToUpload = input.file;
      if (input.file.type.startsWith("video/") && input.file.size > VIDEO_MAX_SIZE_BYTES) {
        setPhase("compressing");
        setProgress(10);
        setMessage("Video optimize ediliyor… 0%");

        const ctrl = new AbortController();
        abortCtrlRef.current = ctrl;

        try {
          fileToUpload = await compressVideo(input.file, {
            signal: ctrl.signal,
            onProgress: (ratio) => {
              // Progress: 10% → 50% during compression
              setProgress(10 + Math.round(ratio * 40));
              setMessage(`Video optimize ediliyor… ${Math.round(ratio * 100)}%`);
            },
          });

          // Post-compression size guard
          if (fileToUpload.size > VIDEO_MAX_SIZE_BYTES) {
            setPhase("error");
            setError(
              `Video sıkıştırıldıktan sonra hâlâ ${Math.round(fileToUpload.size / 1024 / 1024)} MB. ` +
              "Lütfen daha kısa veya düşük çözünürlüklü bir video seçin.",
            );
            runningRef.current = false;
            return;
          }
        } catch (err) {
          if (err instanceof DOMException && err.name === "AbortError") {
            // User cancelled compression
            runningRef.current = false;
            setPhase("idle");
            setProgress(0);
            setMessage("");
            return;
          }
          // Non-fatal: fall back to original file (server will reject if still too large)
          fileToUpload = input.file;
        } finally {
          abortCtrlRef.current = null;
        }
      }

      // ── Upload media to storage ────────────────────────────────────────
      setPhase("uploading");
      setProgress(55);
      setMessage("Medya yükleniyor…");

      const uploadData = new FormData();
      uploadData.set("file", fileToUpload);

      let uploadRes: Response;
      try {
        uploadRes = await fetchWithRetry("/api/social/upload", {
          method: "POST",
          body: uploadData,
        });
      } catch {
        setPhase("error");
        setError(
          "Yükleme başarısız oldu. Bağlantınızı kontrol edip tekrar deneyin.",
        );
        runningRef.current = false;
        return;
      }

      if (!uploadRes.ok) {
        const body = (await uploadRes.json().catch(() => null)) as { error?: string } | null;
        setPhase("error");
        setError(body?.error ?? "Medya yüklenemedi. Lütfen tekrar deneyin.");
        runningRef.current = false;
        return;
      }

      const uploadBody = (await uploadRes.json()) as {
        data: { mediaUrl: string; mediaType: "image" | "video"; objectPath: string };
      };
      mediaUrl = uploadBody.data.mediaUrl;
      mediaType = uploadBody.data.mediaType;
      uploadedObjectPath = uploadBody.data.objectPath;
      setProgress(75);
    }

    // ── Publish post ──────────────────────────────────────────────────────
    setPhase("publishing");
    setProgress(80);
    setMessage("Paylaşım tamamlanıyor…");

    let publishRes: Response;
    try {
      publishRes = await fetchWithRetry("/api/social/posts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          caption: input.caption,
          mediaUrl,
          mediaType,
          areaId: input.areaId,
          targetAudience: "grade",
          targetGrade: input.targetGrade,
          isReel: input.isReel,
          externalUrl: input.externalUrl?.trim() || undefined,
          ...(input.teacherCreatorPlus && input.premiumPrepLabel && input.premiumPrepUrl
            ? { premiumPrepLabel: input.premiumPrepLabel, premiumPrepUrl: input.premiumPrepUrl }
            : {}),
          ...(input.teacherCreatorPlus && input.sponsoredLabel && input.sponsoredTargetUrl
            ? { sponsoredLabel: input.sponsoredLabel, sponsoredTargetUrl: input.sponsoredTargetUrl }
            : {}),
        }),
      });
    } catch {
      await cleanupUploadedMedia(uploadedObjectPath);
      setPhase("error");
      setError(
        "Bağlantı kesildi. İnternet bağlantınızı kontrol edip tekrar deneyin.",
      );
      runningRef.current = false;
      return;
    }

    if (!publishRes.ok) {
      const body = (await publishRes.json().catch(() => null)) as { error?: string } | null;
      await cleanupUploadedMedia(uploadedObjectPath);
      setPhase("error");
      setError(body?.error ?? "Gönderi paylaşılamadı. Lütfen tekrar deneyin.");
      runningRef.current = false;
      return;
    }

    const body = (await publishRes.json().catch(() => null)) as {
      data?: { id?: string };
    } | null;

    bumpDailyCount();
    setProgress(100);
    setPhase("done");
    setMessage("Paylaşıldı! 🎉");
    setPublishedPostId(body?.data?.id ?? null);
    runningRef.current = false;
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
