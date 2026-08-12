/**
 * compress-video.ts
 *
 * Browser-native (Canvas + MediaRecorder) video compression utility.
 * No heavy WASM dependency – works in Capacitor WebView / modern browsers.
 *
 * Strategy:
 *  1. Load the original video into an <video> element.
 *  2. Capture each frame to an OffscreenCanvas (or regular Canvas) at the
 *     target resolution, scaled down proportionally.
 *  3. Stream those frames through a MediaRecorder set to a lower bitrate.
 *  4. Return the compressed Blob → File.
 *
 * Limitations:
 *  - Cannot compress videos longer than available memory allows decoding.
 *  - MediaRecorder codec support is browser-dependent (VP8/VP9/H.264 AVC).
 *  - Very long videos (>10 min) may be slow; the caller can show a progress
 *    callback for UX feedback.
 */

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
      resolve({ valid: true }); // proceed gracefully if metadata cannot be parsed
    };

    video.src = URL.createObjectURL(file);
  });
}

/** Resolution bucket applied before checking the size limit. */
const TARGET_LONG_SIDE_PX = 1280; // 720p-ish for landscape, 9:16 portrait

/**
 * Preferred output bitrate in bits-per-second.
 * ~2 Mbps yields decent quality at 720p for educational content.
 */
const TARGET_VIDEO_BPS = 2_000_000;
const TARGET_AUDIO_BPS = 128_000;

/** Ordered preference list; MediaRecorder.isTypeSupported() filters live. */
const PREFERRED_MIME_TYPES = [
  "video/webm;codecs=vp9",
  "video/webm;codecs=vp8",
  "video/webm",
  "video/mp4", // only on Safari/iOS
];

export type CompressionProgressCallback = (ratio: number) => void; // 0..1

export interface CompressVideoOptions {
  /** Abort signal – resolves early with the original file if triggered. */
  signal?: AbortSignal;
  /** Called periodically with progress 0..1. */
  onProgress?: CompressionProgressCallback;
  /**
   * Size threshold above which compression is attempted.
   * Defaults to VIDEO_MAX_SIZE_BYTES (15 MB).
   */
  thresholdBytes?: number;
}

/** Detected best MIME type for MediaRecorder, cached after first call. */
let _bestMime: string | null | undefined;

function detectBestMime(): string | null {
  if (_bestMime !== undefined) return _bestMime;
  if (typeof window === "undefined" || !("MediaRecorder" in window)) {
    _bestMime = null;
    return null;
  }
  for (const mime of PREFERRED_MIME_TYPES) {
    if (MediaRecorder.isTypeSupported(mime)) {
      _bestMime = mime;
      return mime;
    }
  }
  _bestMime = null;
  return null;
}

/**
 * Returns `true` when the browser supports MediaRecorder-based compression.
 * Use this to conditionally show a "will be compressed" hint in the UI.
 */
export function isVideoCompressionSupported(): boolean {
  return detectBestMime() !== null;
}

/** Create an HTMLVideoElement, load the blob URL, wait for metadata. */
function loadVideoMeta(
  src: string,
  signal?: AbortSignal,
): Promise<HTMLVideoElement> {
  return new Promise((resolve, reject) => {
    const video = document.createElement("video");
    video.muted = true;
    video.playsInline = true;
    video.preload = "metadata";

    const onAbort = () => {
      video.src = "";
      reject(new DOMException("Compression aborted.", "AbortError"));
    };

    signal?.addEventListener("abort", onAbort, { once: true });

    video.addEventListener(
      "loadedmetadata",
      () => {
        signal?.removeEventListener("abort", onAbort);
        resolve(video);
      },
      { once: true },
    );

    video.addEventListener(
      "error",
      () => {
        signal?.removeEventListener("abort", onAbort);
        reject(new Error("Could not load video for compression."));
      },
      { once: true },
    );

    video.src = src;
    video.load();
  });
}

/** Compute canvas dimensions respecting aspect ratio + max long side. */
function computeDimensions(
  srcW: number,
  srcH: number,
): { width: number; height: number } {
  const longSide = Math.max(srcW, srcH);
  if (longSide <= TARGET_LONG_SIDE_PX) {
    // Already small enough – keep original, still re-encode for bitrate.
    return { width: srcW, height: srcH };
  }
  const scale = TARGET_LONG_SIDE_PX / longSide;
  // Ensure even numbers (required by most codec implementations).
  return {
    width: Math.round((srcW * scale) / 2) * 2,
    height: Math.round((srcH * scale) / 2) * 2,
  };
}

/**
 * Compress a video `File` client-side using Canvas + MediaRecorder.
 *
 * - If compression is unsupported or the file is already within the threshold,
 *   the original file is returned as-is.
 * - Throws `DOMException("AbortError")` if the `signal` is aborted.
 */
export async function compressVideo(
  file: File,
  options: CompressVideoOptions = {},
): Promise<File> {
  const {
    signal,
    onProgress,
    thresholdBytes = VIDEO_MAX_SIZE_BYTES,
  } = options;

  // Only attempt compression on video files.
  if (!file.type.startsWith("video/")) return file;

  // Already within limit – skip.
  if (file.size <= thresholdBytes) {
    onProgress?.(1);
    return file;
  }

  const mimeType = detectBestMime();
  if (!mimeType) {
    // Compression unsupported – return original and let the server reject if
    // it exceeds the limit (the error message will be user-visible).
    onProgress?.(1);
    return file;
  }

  const blobUrl = URL.createObjectURL(file);

  try {
    const video = await loadVideoMeta(blobUrl, signal);

    const { width, height } = computeDimensions(
      video.videoWidth || 1280,
      video.videoHeight || 720,
    );

    // Set up canvas
    const canvas = document.createElement("canvas");
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext("2d", { alpha: false });
    if (!ctx) throw new Error("Canvas 2D context unavailable.");

    // Capture canvas stream
    const canvasStream = canvas.captureStream(30); // 30 fps cap

    // Capture audio from the video element (may be empty for silent clips).
    let finalStream = canvasStream;
    try {
      // @ts-expect-error – captureStream is available in Chrome/Android WebView.
      const videoStream: MediaStream = (video as HTMLVideoElement & {
        captureStream?: () => MediaStream;
        mozCaptureStream?: () => MediaStream;
      }).captureStream?.() ??
        (video as unknown as { mozCaptureStream?: () => MediaStream })
          .mozCaptureStream?.();

      if (videoStream) {
        const audioTracks = videoStream.getAudioTracks();
        if (audioTracks.length > 0) {
          audioTracks.forEach((t) => canvasStream.addTrack(t));
          finalStream = canvasStream;
        }
      }
    } catch {
      // No audio track available – continue with video-only.
    }

    const chunks: BlobPart[] = [];
    const recorder = new MediaRecorder(finalStream, {
      mimeType,
      videoBitsPerSecond: TARGET_VIDEO_BPS,
      audioBitsPerSecond: TARGET_AUDIO_BPS,
    });

    recorder.ondataavailable = (e) => {
      if (e.data.size > 0) chunks.push(e.data);
    };

    const duration = video.duration || 60;

    const compressionDone = new Promise<void>((resolve, reject) => {
      recorder.onstop = () => resolve();
      recorder.onerror = () => reject(new Error("MediaRecorder error."));
    });

    recorder.start(200); // collect data every 200 ms

    // Abort support
    signal?.addEventListener(
      "abort",
      () => {
        recorder.stop();
      },
      { once: true },
    );

    // Play video and draw frames
    await new Promise<void>((resolve, reject) => {
      let animFrameId: number;
      let startTime: number | null = null;

      function drawFrame(now: number) {
        if (signal?.aborted) {
          cancelAnimationFrame(animFrameId);
          resolve();
          return;
        }

        if (startTime === null) startTime = now;
        const elapsed = (now - startTime) / 1000;

        if (!ctx) return;
        ctx.drawImage(video, 0, 0, width, height);
        onProgress?.(Math.min(elapsed / duration, 0.95));

        if (video.ended || video.paused) {
          cancelAnimationFrame(animFrameId);
          resolve();
          return;
        }

        animFrameId = requestAnimationFrame(drawFrame);
      }

      video.addEventListener("ended", () => {
        cancelAnimationFrame(animFrameId);
        resolve();
      }, { once: true });

      video.addEventListener("error", () => {
        cancelAnimationFrame(animFrameId);
        reject(new Error("Video playback error during compression."));
      }, { once: true });

      video.play().then(() => {
        animFrameId = requestAnimationFrame(drawFrame);
      }).catch(reject);
    });

    recorder.stop();
    await compressionDone;

    onProgress?.(1);

    if (signal?.aborted) {
      throw new DOMException("Compression aborted.", "AbortError");
    }

    // Determine extension from chosen mimeType
    const ext = mimeType.includes("mp4") ? "mp4" : "webm";
    const outName = file.name.replace(/\.[^.]+$/, `.compressed.${ext}`);
    const blob = new Blob(chunks, { type: mimeType });

    // If compression made things worse (rare), fall back to original.
    if (blob.size >= file.size) return file;

    return new File([blob], outName, { type: mimeType });
  } finally {
    URL.revokeObjectURL(blobUrl);
  }
}
