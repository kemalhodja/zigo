"use client";

import { isSupportedVideoFile, resolveVideoMimeType } from "@/lib/client/compress-video";
import { fetchWithRetry } from "@/lib/client/fetch-with-retry";
import { cleanupUploadedMedia } from "@/lib/client/media-cleanup";

// Stay comfortably under Vercel's 4.5 MB serverless body limit by using
// direct-to-Supabase signed upload URLs for videos larger than 3.5 MB.
const DIRECT_SIGNED_UPLOAD_THRESHOLD_BYTES = 3.5 * 1024 * 1024;

export type UploadedSocialMedia = {
  mediaUrl: string;
  mediaType: "image" | "video";
  objectPath: string;
};

export type UploadSocialMediaOptions = {
  durationSeconds?: number;
  onProgress?: (ratio: number) => void;
  signal?: AbortSignal;
};

function putWithProgress(
  url: string,
  file: File,
  contentType: string,
  onProgress?: (ratio: number) => void,
  signal?: AbortSignal,
): Promise<void> {
  return new Promise((resolve, reject) => {
    if (signal?.aborted) {
      reject(new DOMException("Yükleme iptal edildi.", "AbortError"));
      return;
    }

    const xhr = new XMLHttpRequest();
    xhr.open("PUT", url, true);
    xhr.setRequestHeader("Content-Type", contentType);
    xhr.setRequestHeader("x-upsert", "false");

    const onAbort = () => {
      xhr.abort();
      reject(new DOMException("Yükleme iptal edildi.", "AbortError"));
    };

    signal?.addEventListener("abort", onAbort, { once: true });

    xhr.upload.onprogress = (event) => {
      if (event.lengthComputable && event.total > 0) {
        onProgress?.(Math.min(0.99, event.loaded / event.total));
      }
    };

    xhr.onload = () => {
      signal?.removeEventListener("abort", onAbort);
      if (xhr.status >= 200 && xhr.status < 300) {
        onProgress?.(1);
        resolve();
      } else {
        reject(new Error("Kısa video depolama alanına yüklenemedi. Lütfen bağlantınızı kontrol edip tekrar deneyin."));
      }
    };

    xhr.onerror = () => {
      signal?.removeEventListener("abort", onAbort);
      reject(new Error("Ağ hatası nedeniyle video yüklenemedi. Lütfen tekrar deneyin."));
    };

    xhr.onabort = () => {
      signal?.removeEventListener("abort", onAbort);
      reject(new DOMException("Yükleme iptal edildi.", "AbortError"));
    };

    xhr.send(file);
  });
}

/**
 * Uploads an image or short promo video to Zigo social-media storage.
 * - Images and small videos (<= 3.5 MB) go through POST /api/social/upload FormData.
 * - Larger short promo videos (> 3.5 MB, up to 25 MB / 30s) request a signed
 *   upload URL from POST /api/social/upload, stream via XHR with live progress + abort,
 *   and finish with server-side MP4 container & duration verification.
 */
export async function uploadSocialMedia(
  file: File,
  options?: UploadSocialMediaOptions,
): Promise<UploadedSocialMedia> {
  const isVideo = file.type.startsWith("video/") || isSupportedVideoFile(file);
  const resolvedContentType = isVideo ? resolveVideoMimeType(file) : file.type;

  if (isVideo && file.size > DIRECT_SIGNED_UPLOAD_THRESHOLD_BYTES) {
    options?.onProgress?.(0.02);
    const ticketRes = await fetchWithRetry("/api/social/upload", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        mode: "signed-url",
        contentType: resolvedContentType,
        fileSize: file.size,
        durationSeconds: options?.durationSeconds,
      }),
    });

    if (!ticketRes.ok) {
      const body = (await ticketRes.json().catch(() => null)) as { error?: string } | null;
      throw new Error(body?.error ?? "Video yükleme izni alınamadı. Lütfen tekrar deneyin.");
    }

    const ticket = (await ticketRes.json()) as {
      data: {
        signedUrl: string;
        storageContentType?: string;
        objectPath: string;
        mediaUrl: string;
        mediaType: "video";
      };
    };

    try {
      await putWithProgress(
        ticket.data.signedUrl,
        file,
        ticket.data.storageContentType || "video/mp4",
        (ratio) => options?.onProgress?.(0.05 + ratio * 0.85),
        options?.signal,
      );
    } catch (err) {
      await cleanupUploadedMedia(ticket.data.objectPath);
      throw err;
    }

    // Server-side MP4 container & duration verification (blocks spoofed durations)
    const verifyRes = await fetch("/api/social/upload", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        mode: "verify-signed",
        objectPath: ticket.data.objectPath,
      }),
    });

    if (!verifyRes.ok) {
      const body = (await verifyRes.json().catch(() => null)) as { error?: string } | null;
      throw new Error(
        body?.error ?? "Kısa video sunucu doğrulamasından geçemedi. Maksimum 30 saniyelik geçerli bir video seçin.",
      );
    }

    options?.onProgress?.(1);
    return {
      mediaUrl: ticket.data.mediaUrl,
      mediaType: "video",
      objectPath: ticket.data.objectPath,
    };
  }

  // Ensure mobile files with empty MIME type carry their resolved MIME type
  const uploadFile =
    isVideo && file.type !== resolvedContentType
      ? new File([file], file.name, { type: resolvedContentType, lastModified: file.lastModified })
      : file;

  const uploadData = new FormData();
  uploadData.set("file", uploadFile);
  if (isVideo && typeof options?.durationSeconds === "number" && Number.isFinite(options.durationSeconds)) {
    uploadData.set("durationSeconds", String(Math.round(options.durationSeconds)));
  }

  const uploadRes = await fetchWithRetry("/api/social/upload", {
    method: "POST",
    body: uploadData,
    signal: options?.signal,
  });

  if (!uploadRes.ok) {
    const body = (await uploadRes.json().catch(() => null)) as { error?: string } | null;
    throw new Error(body?.error ?? "Medya yüklenemedi. Lütfen tekrar deneyin.");
  }

  options?.onProgress?.(1);
  const uploadBody = (await uploadRes.json()) as {
    data: UploadedSocialMedia;
  };

  return uploadBody.data;
}
