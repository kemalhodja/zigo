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

import { compressVideo, validateVideoLimits, VIDEO_MAX_SIZE_BYTES } from "@/lib/client/compress-video";
import { fetchWithRetry } from "@/lib/client/fetch-with-retry";
import { cleanupUploadedMedia } from "@/lib/client/media-cleanup";
import { createClient } from "@/lib/supabase/client";

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
    if (runningRef.current) {
      console.warn("[POST_PIPELINE] Pipeline is already running.");
      return;
    }
    runningRef.current = true;

    // ── Client-side daily limit pre-check ──────────────────────────────
    if (readDailyCount() >= MAX_DAILY_POSTS) {
      console.warn("[POST_PIPELINE] Daily post limit reached.");
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
    let mediaType: "image" | "video" | "carousel" = "image";
    const uploadedObjectPaths: string[] = [];

    if (input.files && input.files.length > 0) {
      const isCarousel = input.files.length > 1;
      const uploadedUrls: string[] = [];
      
      for (let i = 0; i < input.files.length; i++) {
        let fileToUpload = input.files[i];
        
        // ── Validate (size + duration for videos) ──────────────────────────
        const validation = await validateVideoLimits(fileToUpload);
        if (!validation.valid) {
          console.error(`[POST_PIPELINE] Media validation failed for file ${i + 1}:`, validation.error);
          setPhase("error");
          setError(validation.error ?? `Dosya ${i + 1} doğrulanamadı. Lütfen farklı bir dosya seçin.`);
          runningRef.current = false;
          return;
        }

        // ── Compress large videos before upload ────────────────────────────
        if (fileToUpload.type.startsWith("video/") && fileToUpload.size > VIDEO_MAX_SIZE_BYTES) {
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
                "Lütfen daha kısa veya düşük çözünürlüklü bir video seçin.",
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

        setPhase("uploading");
        setProgress(50 + Math.round((i / input.files.length) * 25));
        setMessage(isCarousel ? `Medya ${i + 1}/${input.files.length} yükleniyor…` : "Medya yükleniyor…");

        let currentMediaUrl = "";
        let directSuccess = false;
        try {
          const supabase = createClient();
          const { data: { user } } = await supabase.auth.getUser();
          if (user?.id) {
            const extension = fileToUpload.name.split(".").pop() || (fileToUpload.type.startsWith("video/") ? "mp4" : "jpg");
            const objectPath = `${user.id}/${crypto.randomUUID()}.${extension}`;
            const { error: directErr } = await supabase.storage
              .from("social-media")
              .upload(objectPath, fileToUpload, { contentType: fileToUpload.type, upsert: false });

            if (!directErr) {
              const { data: publicData } = supabase.storage.from("social-media").getPublicUrl(objectPath);
              if (publicData?.publicUrl) {
                currentMediaUrl = publicData.publicUrl;
                mediaType = fileToUpload.type.startsWith("video/") ? "video" : "image";
                uploadedObjectPaths.push(objectPath);
                directSuccess = true;
              }
            } else {
              console.warn("[POST_PIPELINE_DIRECT_UPLOAD_FALLBACK] Direct upload warning, trying signed upload URL fallback:", directErr.message);
              // Attempt 2: Fetch Signed Upload URL from server
              const signedRes = await fetch(`/api/social/upload?fileType=${encodeURIComponent(fileToUpload.type)}&filename=${encodeURIComponent(fileToUpload.name)}`);
              if (signedRes.ok) {
                const signedBody = await signedRes.json();
                if (signedBody?.data?.signedUrl && signedBody?.data?.path && signedBody?.data?.token) {
                  const { error: signedUploadErr } = await supabase.storage
                    .from("social-media")
                    .uploadToSignedUrl(signedBody.data.path, signedBody.data.token, fileToUpload);

                  if (!signedUploadErr) {
                    currentMediaUrl = signedBody.data.mediaUrl;
                    mediaType = signedBody.data.mediaType;
                    uploadedObjectPaths.push(signedBody.data.objectPath);
                    directSuccess = true;
                  }
                }
              }
            }
          }
        } catch (err) {
          console.warn("[POST_PIPELINE_DIRECT_UPLOAD_EXCEPTION] Falling back to /api/social/upload:", err);
        }

        if (!directSuccess) {
          const uploadData = new FormData();
          uploadData.set("file", fileToUpload);

          let uploadRes: Response;
          try {
            uploadRes = await fetchWithRetry("/api/social/upload", {
              method: "POST",
              body: uploadData,
            });
          } catch (err) {
            console.error("[POST_PIPELINE_UPLOAD_ERROR] Network error during upload:", err);
            setPhase("error");
            setError("Yükleme başarısız oldu. Bağlantınızı kontrol edip tekrar deneyin.");
            runningRef.current = false;
            return;
          }

          if (!uploadRes.ok) {
            const body = (await uploadRes.json().catch(() => null)) as { error?: string } | null;
            console.error("[POST_PIPELINE_UPLOAD_FAILED] HTTP", uploadRes.status, body);
            setPhase("error");
            setError(body?.error ?? "Medya yüklenemedi. Lütfen tekrar deneyin.");
            runningRef.current = false;
            return;
          }

          const uploadBody = (await uploadRes.json()) as {
            data: { mediaUrl: string; mediaType: "image" | "video"; objectPath: string };
          };
          currentMediaUrl = uploadBody.data.mediaUrl;
          mediaType = uploadBody.data.mediaType;
          uploadedObjectPaths.push(uploadBody.data.objectPath);
        }
        
        uploadedUrls.push(currentMediaUrl);
      }
      
      if (isCarousel) {
        mediaType = "carousel";
        mediaUrl = JSON.stringify(uploadedUrls);
      } else {
        mediaUrl = uploadedUrls[0];
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
