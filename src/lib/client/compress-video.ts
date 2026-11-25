/**
 * compress-video.ts
 *
 * (UPDATED: Canvas + MediaRecorder client-side compression has been disabled due to severe battery/CPU drain.)
 * Native Capacitor Plugin integration (e.g., cordova-plugin-video-editor or a custom FFmpeg capacitor plugin)
 * is pending. Until then, videos are passed through in their original size.
 */

import { Capacitor } from '@capacitor/core';
import { Directory,Filesystem } from '@capacitor/filesystem';

import { NativeVideoCompressor } from './capacitor/native-video-compressor';

export const VIDEO_MAX_SIZE_BYTES = 25 * 1024 * 1024; // Kısa tanıtım videosu için 25 MB üst limit
export const VIDEO_COMPRESS_THRESHOLD_BYTES = 12 * 1024 * 1024; // 12 MB üzeri videoları sıkıştır
export const VIDEO_MIN_DURATION_SECONDS = 2;
export const SHORT_VIDEO_MAX_DURATION_SECONDS = 30; // Kısa tanıtım videosu için maksimum 30 saniye
export const REEL_MAX_DURATION_SECONDS = SHORT_VIDEO_MAX_DURATION_SECONDS;
// Zigo'da uzun video barındırılmaz; uzun ders videoları YouTube, Vimeo veya benzeri platform bağlantısı ile paylaşılır.
export const LESSON_VIDEO_MAX_DURATION_SECONDS = SHORT_VIDEO_MAX_DURATION_SECONDS;
export const VIDEO_MAX_DURATION_SECONDS = SHORT_VIDEO_MAX_DURATION_SECONDS;

export const SUPPORTED_VIDEO_MIME_TYPES = new Set([
  "video/mp4",
  "video/webm",
  "video/quicktime",
  "video/x-m4v",
  "video/m4v",
]);

const VIDEO_EXT_REGEX = /\.(mp4|webm|mov|m4v)$/i;

/**
 * Checks if a file is a supported short-video format (MP4, WEBM, iPhone MOV, M4V).
 */
export function isSupportedVideoFile(file: File): boolean {
  const mime = file.type.toLowerCase();
  if (SUPPORTED_VIDEO_MIME_TYPES.has(mime)) return true;
  if (!mime || mime === "application/octet-stream") {
    return VIDEO_EXT_REGEX.test(file.name);
  }
  return false;
}

/**
 * Returns the canonical upload MIME type for supported video files.
 */
export function resolveVideoMimeType(file: File): "video/mp4" | "video/webm" | "video/quicktime" | "video/x-m4v" {
  const mime = file.type.toLowerCase();
  if (mime === "video/webm" || /\.webm$/i.test(file.name)) return "video/webm";
  if (mime === "video/quicktime" || /\.mov$/i.test(file.name)) return "video/quicktime";
  if (mime === "video/x-m4v" || mime === "video/m4v" || /\.m4v$/i.test(file.name)) return "video/x-m4v";
  return "video/mp4";
}

/** Validate client-side short promo video file size (25 MB max) and duration (30s max). */
export async function validateVideoLimits(
  file: File,
  options?: { isReel?: boolean; maxDurationSeconds?: number }
): Promise<{ valid: boolean; error?: string; duration?: number }> {
  if (!isSupportedVideoFile(file)) {
    return {
      valid: false,
      error: "Desteklenmeyen video formatı. MP4, WEBM, MOV (iPhone) veya M4V yükleyebilirsiniz.",
    };
  }

  if (file.size > VIDEO_MAX_SIZE_BYTES) {
    return {
      valid: false,
      error: `Kısa tanıtım videosu en fazla 25 MB olabilir (${(file.size / (1024 * 1024)).toFixed(1)} MB). Daha uzun veya büyük videolar için YouTube, Vimeo vb. link ekleyebilirsiniz.`,
    };
  }

  const maxDuration = options?.maxDurationSeconds ?? SHORT_VIDEO_MAX_DURATION_SECONDS;

  return new Promise((resolve) => {
    const video = document.createElement("video");
    video.preload = "metadata";

    video.onloadedmetadata = () => {
      URL.revokeObjectURL(video.src);
      const duration = video.duration;
      if (Number.isFinite(duration) && duration > maxDuration) {
        resolve({
          valid: false,
          error: `Kısa tanıtım videoları en fazla ${maxDuration} saniye olabilir (seçilen video: ${Math.round(duration)} sn). Uzun ders videolarınız için YouTube, Vimeo veya benzeri platform bağlantısı ekleyebilirsiniz.`,
          duration,
        });
      } else {
        resolve({ valid: true, duration: Number.isFinite(duration) ? duration : undefined });
      }
    };

    video.onerror = () => {
      URL.revokeObjectURL(video.src);
      resolve({ valid: true });
    };

    video.src = URL.createObjectURL(file);
  });
}

export type CompressionProgressCallback = (ratio: number) => void;

export interface CompressVideoOptions {
  signal?: AbortSignal;
  onProgress?: CompressionProgressCallback;
  thresholdBytes?: number;
}

export function isVideoCompressionSupported(): boolean {
  // Returns true if running natively on iOS/Android, false on web/PWA
  return Capacitor.isNativePlatform();
}

/**
 * Automatically extracts a lightweight WebP poster frame from a local video File
 * (at ~0.4s or 0s for very short clips) so feed videos display an instant cover
 * without downloading full video bytes until playback begins.
 */
export async function extractVideoFrameFile(
  file: File,
  seekSeconds = 0.4,
): Promise<File | null> {
  if (!isSupportedVideoFile(file)) return null;

  return new Promise((resolve) => {
    const video = document.createElement("video");
    const objectUrl = URL.createObjectURL(file);
    let settled = false;

    const finish = (result: File | null) => {
      if (settled) return;
      settled = true;
      clearTimeout(timeoutId);
      URL.revokeObjectURL(objectUrl);
      resolve(result);
    };

    const timeoutId = setTimeout(() => finish(null), 4000);

    video.preload = "auto";
    video.muted = true;
    video.playsInline = true;

    const capture = () => {
      try {
        const vw = video.videoWidth;
        const vh = video.videoHeight;
        if (!vw || !vh) {
          finish(null);
          return;
        }
        const maxSide = 960;
        let width = vw;
        let height = vh;
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
        if (!ctx) {
          finish(null);
          return;
        }
        ctx.drawImage(video, 0, 0, width, height);
        canvas.toBlob(
          (blob) => {
            if (!blob) {
              finish(null);
              return;
            }
            finish(
              new File([blob], `auto-poster-${Date.now()}.webp`, {
                type: "image/webp",
                lastModified: Date.now(),
              }),
            );
          },
          "image/webp",
          0.8,
        );
      } catch {
        finish(null);
      }
    };

    video.onloadeddata = () => {
      const targetTime =
        Number.isFinite(video.duration) && video.duration > 0.6
          ? Math.min(seekSeconds, video.duration * 0.2)
          : 0;
      if (targetTime <= 0.05) {
        capture();
      } else {
        video.onseeked = capture;
        try {
          video.currentTime = targetTime;
        } catch {
          capture();
        }
      }
    };

    video.onerror = () => finish(null);
    video.src = objectUrl;
  });
}

/** 
 * Compress a video `File` client-side using Native Capacitor Plugins.
 * If running on the Web, or if compression fails, it safely falls back to returning the original file.
 */
export async function compressVideo(
  file: File,
  options: CompressVideoOptions = {},
): Promise<File> {
  const { onProgress, thresholdBytes = VIDEO_COMPRESS_THRESHOLD_BYTES } = options;
  
  if (!file.type.startsWith("video/")) return file;
  if (file.size <= thresholdBytes) {
    onProgress?.(1);
    return file;
  }

  // Graceful fallback for Web/PWA since Native Video Compression requires OS-level codecs
  if (!Capacitor.isNativePlatform()) {
    console.warn("[CLIENT_VIDEO_COMPRESSOR] Native compression is not available on web. Falling back to original file.");
    onProgress?.(1);
    return file;
  }

  try {
    // 1. Temporarily write the File object to Native Filesystem to get a file:// URI
    const tempFileName = `temp_in_${Date.now()}.mp4`;
    // For a real production app with huge files, passing blob to base64 is heavy. 
    // Usually, the native Camera plugin returns a File URI directly, skipping this step.
    const base64Data = await convertFileToBase64(file);
    const writeResult = await Filesystem.writeFile({
      path: tempFileName,
      data: base64Data,
      directory: Directory.Cache,
    });

    // 2. Pass the file URI to the Custom Native Video Compressor Plugin
    onProgress?.(0.1); // Notify UI that compression has started
    const compressResult = await NativeVideoCompressor.compress({
      fileUri: writeResult.uri,
      quality: 0.6,
      maxResolution: 720,
    });

    onProgress?.(0.9); // Notify UI that compression finished natively

    // 3. Read the compressed video back into a web File object
    let outPath = compressResult.fileUri;
    if (outPath.startsWith('file://')) {
      outPath = outPath.replace('file://', '');
    }

    const readResult = await Filesystem.readFile({
      path: outPath,
    });
    
    // Clean up temp files
    await Filesystem.deleteFile({ path: tempFileName, directory: Directory.Cache }).catch(() => {});
    await Filesystem.deleteFile({ path: outPath }).catch(() => {});

    // Convert back to File
    const blob = await fetch(`data:${file.type};base64,${readResult.data}`).then(r => r.blob());
    
    // If native compression somehow made it larger, return original
    if (blob.size >= file.size) {
      console.warn("[CLIENT_VIDEO_COMPRESSOR] Compressed file is larger than original. Using original.");
      onProgress?.(1);
      return file;
    }

    onProgress?.(1);
    return new File([blob], file.name.replace(/\.[^.]+$/, `.compressed.mp4`), { type: file.type });
    
  } catch (err) {
    console.error("[CLIENT_VIDEO_COMPRESSOR] Native compression failed, safely falling back to original:", err);
    onProgress?.(1);
    return file;
  }
}

function convertFileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => {
      const result = reader.result as string;
      const base64 = result.split(',')[1];
      resolve(base64);
    };
    reader.onerror = (error) => reject(error);
  });
}

