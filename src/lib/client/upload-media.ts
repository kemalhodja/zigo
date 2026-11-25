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

/**
 * Uploads an image or short promo video to Zigo social-media storage.
 * - Images and small videos (<= 3.5 MB) go through POST /api/social/upload FormData.
 * - Larger short promo videos (> 3.5 MB, up to 25 MB / 30s) request a signed
 *   upload URL from POST /api/social/upload and PUT directly to Supabase Storage,
 *   avoiding serverless payload size limits while keeping full server-side validation.
 */
export async function uploadSocialMedia(
  file: File,
  options?: { durationSeconds?: number },
): Promise<UploadedSocialMedia> {
  const isVideo = file.type.startsWith("video/") || isSupportedVideoFile(file);
  const resolvedContentType = isVideo ? resolveVideoMimeType(file) : file.type;

  if (isVideo && file.size > DIRECT_SIGNED_UPLOAD_THRESHOLD_BYTES) {
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

    const putRes = await fetch(ticket.data.signedUrl, {
      method: "PUT",
      headers: {
        "Content-Type": ticket.data.storageContentType || "video/mp4",
        "x-upsert": "false",
      },
      body: file,
    });

    if (!putRes.ok) {
      await cleanupUploadedMedia(ticket.data.objectPath);
      throw new Error("Kısa video depolama alanına yüklenemedi. Lütfen bağlantınızı kontrol edip tekrar deneyin.");
    }

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
  });

  if (!uploadRes.ok) {
    const body = (await uploadRes.json().catch(() => null)) as { error?: string } | null;
    throw new Error(body?.error ?? "Medya yüklenemedi. Lütfen tekrar deneyin.");
  }

  const uploadBody = (await uploadRes.json()) as {
    data: UploadedSocialMedia;
  };

  return uploadBody.data;
}
