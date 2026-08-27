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

export const VIDEO_MAX_SIZE_BYTES = 15 * 1024 * 1024; // 15 MB hard limit
export const VIDEO_MIN_DURATION_SECONDS = 5;
export const VIDEO_MAX_DURATION_SECONDS = 45; // 45 saniye süre sınırı

/** Validate client-side video file size (15 MB max) and duration (45s max). */
export async function validateVideoLimits(file: File): Promise<{ valid: boolean; error?: string; duration?: number }> {
  if (!file.type.startsWith("video/")) return { valid: true };

  if (file.size > VIDEO_MAX_SIZE_BYTES) {
    return {
      valid: false,
      error: `Video dosya boyutu 15 MB sınırını aşamaz (${(file.size / (1024 * 1024)).toFixed(1)} MB). Lütfen sıkıştırarak tekrar deneyin.`,
    };
  }

  return new Promise((resolve) => {
    const video = document.createElement("video");
    video.preload = "metadata";

    video.onloadedmetadata = () => {
      URL.revokeObjectURL(video.src);
      const duration = video.duration;
      if (duration > VIDEO_MAX_DURATION_SECONDS) {
        resolve({
          valid: false,
          error: `Video süresi maksimum ${VIDEO_MAX_DURATION_SECONDS} saniye olabilir. Yüklediğiniz video: ${Math.round(duration)} saniye.`,
          duration,
        });
      } else {
        resolve({ valid: true, duration });
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
 * Compress a video `File` client-side using Native Capacitor Plugins.
 * If running on the Web, or if compression fails, it safely falls back to returning the original file.
 */
export async function compressVideo(
  file: File,
  options: CompressVideoOptions = {},
): Promise<File> {
  const { onProgress, thresholdBytes = VIDEO_MAX_SIZE_BYTES } = options;
  
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

