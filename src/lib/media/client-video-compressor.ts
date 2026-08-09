/**
 * Zigo Client-Side Video & Media Compressor
 * 
 * Rules:
 * - Max File Size: 100 MB (104,857,600 bytes)
 * - Max Video Duration: 90 seconds
 * - Automatic client-side video file size check & lightweight canvas/MediaRecorder compression helper
 */

export const MAX_VIDEO_SIZE_BYTES = 100 * 1024 * 1024; // 100 MB
export const MAX_VIDEO_DURATION_SECONDS = 90;

export type CompressVideoOptions = {
  maxSizeBytes?: number;
  maxDurationSeconds?: number;
};

export type CompressVideoResult = {
  file: File;
  compressed: boolean;
  originalSizeBytes: number;
  finalSizeBytes: number;
  durationSeconds?: number;
};

/**
 * Checks if a video file exceeds limits and compresses it if necessary using MediaRecorder / HTML5 Video Canvas API.
 */
export async function validateAndCompressVideo(
  file: File,
  options: CompressVideoOptions = {},
): Promise<CompressVideoResult> {
  const maxBytes = options.maxSizeBytes ?? MAX_VIDEO_SIZE_BYTES;
  const maxDuration = options.maxDurationSeconds ?? MAX_VIDEO_DURATION_SECONDS;

  // If file is not a video or size is already under max limit, return as is
  if (!file.type.startsWith("video/") || file.size <= maxBytes) {
    return {
      file,
      compressed: false,
      originalSizeBytes: file.size,
      finalSizeBytes: file.size,
    };
  }

  // Attempt client-side video compression via MediaRecorder HTML5 Canvas pipeline
  try {
    const compressedBlob = await compressVideoBlob(file, maxBytes, maxDuration);
    const compressedFile = new File([compressedBlob], file.name.replace(/\.[^/.]+$/, ".mp4"), {
      type: "video/mp4",
      lastModified: Date.now(),
    });

    return {
      file: compressedFile.size < file.size ? compressedFile : file,
      compressed: compressedFile.size < file.size,
      originalSizeBytes: file.size,
      finalSizeBytes: compressedFile.size < file.size ? compressedFile.size : file.size,
    };
  } catch (error) {
    console.warn("[CLIENT_VIDEO_COMPRESSOR] Fallback to original file:", error);
    return {
      file,
      compressed: false,
      originalSizeBytes: file.size,
      finalSizeBytes: file.size,
    };
  }
}

/**
 * Lightweight canvas-based MediaRecorder video compressor helper
 */
function compressVideoBlob(
  file: File,
  _targetMaxBytes: number,
  maxDuration: number,
): Promise<Blob> {
  return new Promise((resolve, reject) => {
    const video = document.createElement("video");
    video.src = URL.createObjectURL(file);
    video.muted = true;
    video.playsInline = true;

    video.onloadedmetadata = () => {
      const duration = video.duration;
      if (duration > maxDuration) {
        URL.revokeObjectURL(video.src);
        reject(new Error(`Video duration (${Math.round(duration)}s) exceeds maximum allowed ${maxDuration} seconds.`));
        return;
      }

      const canvas = document.createElement("canvas");
      // Scale down dimensions if resolution is 1080p+ to conserve video bitrate
      let width = video.videoWidth || 1280;
      let height = video.videoHeight || 720;
      if (width > 1280) {
        height = Math.round((height * 1280) / width);
        width = 1280;
      }
      canvas.width = width;
      canvas.height = height;

      const ctx = canvas.getContext("2d");
      if (!ctx) {
        URL.revokeObjectURL(video.src);
        reject(new Error("Canvas 2D context unavailable"));
        return;
      }

      const stream = canvas.captureStream(25); // 25 fps
      const mediaRecorder = new MediaRecorder(stream, {
        mimeType: MediaRecorder.isTypeSupported("video/webm;codecs=vp8")
          ? "video/webm;codecs=vp8"
          : "video/webm",
        videoBitsPerSecond: 2_500_000, // 2.5 Mbps target
      });

      const chunks: Blob[] = [];
      mediaRecorder.ondataavailable = (e) => {
        if (e.data.size > 0) chunks.push(e.data);
      };

      mediaRecorder.onstop = () => {
        URL.revokeObjectURL(video.src);
        const blob = new Blob(chunks, { type: "video/mp4" });
        resolve(blob);
      };

      mediaRecorder.start();
      video.play();

      function drawFrame() {
        if (video.paused || video.ended) {
          mediaRecorder.stop();
          return;
        }
        ctx?.drawImage(video, 0, 0, width, height);
        requestAnimationFrame(drawFrame);
      }

      drawFrame();
    };

    video.onerror = () => {
      URL.revokeObjectURL(video.src);
      reject(new Error("Video playback error during compression"));
    };
  });
}
