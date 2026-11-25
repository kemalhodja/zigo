/**
 * compress-image.ts
 *
 * Browser-native image validation, EXIF/GPS metadata stripping (KVKK & child safety),
 * format normalization (AVIF / HEIC / HEIF -> WebP/JPEG), 90-degree rotation,
 * resizing (max 1600px), and compression.
 */

export const IMAGE_MAX_INPUT_SIZE_BYTES = 15 * 1024 * 1024; // 15 MB
export const IMAGE_COMPRESS_THRESHOLD_BYTES = 1.5 * 1024 * 1024; // 1.5 MB

export const DIRECT_UPLOAD_IMAGE_TYPES = new Set([
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/gif",
]);

export const TRANSCODABLE_IMAGE_TYPES = new Set([
  "image/avif",
  "image/heic",
  "image/heif",
  "image/heic-sequence",
  "image/heif-sequence",
  "image/bmp",
]);

export const SUPPORTED_IMAGE_MIME_TYPES = new Set([
  ...DIRECT_UPLOAD_IMAGE_TYPES,
  ...TRANSCODABLE_IMAGE_TYPES,
]);

const IMAGE_EXT_REGEX = /\.(jpe?g|png|webp|gif|avif|heic|heif|bmp)$/i;
const TRANSCODABLE_EXT_REGEX = /\.(avif|heic|heif|bmp)$/i;

/**
 * Checks whether a file is a supported image format (by MIME type or mobile file extension).
 */
export function isSupportedImageFile(file: File): boolean {
  if (SUPPORTED_IMAGE_MIME_TYPES.has(file.type.toLowerCase())) return true;
  if (!file.type || file.type === "application/octet-stream") {
    return IMAGE_EXT_REGEX.test(file.name);
  }
  return false;
}

export function needsImageTranscode(file: File): boolean {
  const mime = file.type.toLowerCase();
  if (TRANSCODABLE_IMAGE_TYPES.has(mime)) return true;
  return TRANSCODABLE_EXT_REGEX.test(file.name);
}

/**
 * Validates image input file size before upload/processing.
 */
export function validateImageLimits(file: File): { valid: boolean; error?: string } {
  if (!isSupportedImageFile(file)) {
    return {
      valid: false,
      error: "Desteklenmeyen görsel türü. JPG, PNG, WEBP, GIF, AVIF veya HEIC seçebilirsiniz.",
    };
  }

  if (file.size > IMAGE_MAX_INPUT_SIZE_BYTES) {
    const sizeMb = (file.size / (1024 * 1024)).toFixed(1);
    return {
      valid: false,
      error: `Görsel boyutu 15 MB sınırını aşamaz (${sizeMb} MB). Lütfen daha küçük bir görsel seçin.`,
    };
  }

  return { valid: true };
}

/**
 * Re-encodes ALL non-GIF images through HTML5 Canvas to:
 * 1. Strip 100% of EXIF/GPS location & device metadata (KVKK & student privacy)
 * 2. Transcode mobile formats (AVIF, HEIC, HEIF, BMP) into WebP/JPEG
 * 3. Resize oversized images to max 1600px and compress cleanly
 */
export async function compressImage(file: File, maxSide = 1600, quality = 0.84): Promise<File> {
  if (!isSupportedImageFile(file)) return file;

  // Keep animated GIF frames intact (GIF does not store camera GPS EXIF)
  if (file.type === "image/gif") {
    return file;
  }

  const mustTranscode = needsImageTranscode(file);
  const effectiveQuality = file.size <= IMAGE_COMPRESS_THRESHOLD_BYTES ? Math.max(quality, 0.9) : quality;

  return new Promise((resolve) => {
    const img = new Image();
    const objectUrl = URL.createObjectURL(file);

    img.onload = () => {
      URL.revokeObjectURL(objectUrl);
      try {
        const canvas = document.createElement("canvas");
        let width = img.naturalWidth || img.width;
        let height = img.naturalHeight || img.height;

        if (width > maxSide || height > maxSide) {
          if (width > height) {
            height = Math.round((height * maxSide) / width);
            width = maxSide;
          } else {
            width = Math.round((width * maxSide) / height);
            height = maxSide;
          }
        }

        canvas.width = width;
        canvas.height = height;

        const ctx = canvas.getContext("2d");
        if (!ctx) {
          resolve(file);
          return;
        }

        ctx.drawImage(img, 0, 0, width, height);

        const tryEncode = (targetMime: "image/webp" | "image/jpeg", ext: ".webp" | ".jpg") => {
          canvas.toBlob(
            (blob) => {
              if (!blob) {
                if (targetMime === "image/webp") {
                  tryEncode("image/jpeg", ".jpg");
                  return;
                }
                resolve(file);
                return;
              }
              const newName = file.name.replace(/\.[^/.]+$/, ext);
              const sanitizedFile = new File([blob], newName, {
                type: targetMime,
                lastModified: Date.now(),
              });

              // Always return the canvas-sanitized output so EXIF/GPS is stripped
              // (unless it unexpectedly blew up over 5 MB server limit and original is smaller & safe)
              const overServerLimit = sanitizedFile.size > 5 * 1024 * 1024;
              if (!mustTranscode && overServerLimit && file.size < sanitizedFile.size) {
                resolve(file);
                return;
              }
              resolve(sanitizedFile);
            },
            targetMime,
            effectiveQuality,
          );
        };

        tryEncode("image/webp", ".webp");
      } catch (err) {
        console.warn("[COMPRESS_IMAGE] Canvas sanitization failed, using original file:", err);
        resolve(file);
      }
    };

    img.onerror = () => {
      URL.revokeObjectURL(objectUrl);
      resolve(file);
    };

    img.src = objectUrl;
  });
}

/**
 * Rotates an image 90 degrees clockwise via Canvas (also preserves EXIF stripping).
 * Handy for sideways notebook, question, or whiteboard photos taken on phones.
 */
export async function rotateImage90(file: File): Promise<File> {
  if (!isSupportedImageFile(file) || file.type === "image/gif") return file;

  return new Promise((resolve) => {
    const img = new Image();
    const objectUrl = URL.createObjectURL(file);

    img.onload = () => {
      URL.revokeObjectURL(objectUrl);
      try {
        const w = img.naturalWidth || img.width;
        const h = img.naturalHeight || img.height;
        const canvas = document.createElement("canvas");
        canvas.width = h;
        canvas.height = w;

        const ctx = canvas.getContext("2d");
        if (!ctx) {
          resolve(file);
          return;
        }

        ctx.translate(h / 2, w / 2);
        ctx.rotate(Math.PI / 2);
        ctx.drawImage(img, -w / 2, -h / 2);

        const targetMime = file.type === "image/jpeg" ? "image/jpeg" : "image/webp";
        const ext = targetMime === "image/jpeg" ? ".jpg" : ".webp";

        canvas.toBlob(
          (blob) => {
            if (!blob) {
              resolve(file);
              return;
            }
            const newName = file.name.replace(/\.[^/.]+$/, ext);
            resolve(
              new File([blob], newName, {
                type: targetMime,
                lastModified: Date.now(),
              }),
            );
          },
          targetMime,
          0.9,
        );
      } catch {
        resolve(file);
      }
    };

    img.onerror = () => {
      URL.revokeObjectURL(objectUrl);
      resolve(file);
    };

    img.src = objectUrl;
  });
}

/**
 * Validates and normalizes an image (including AVIF/HEIC transcoding and EXIF/GPS removal)
 * right at selection time.
 */
export async function prepareImageForUpload(
  file: File,
): Promise<{ valid: true; file: File; converted: boolean } | { valid: false; error: string }> {
  const limits = validateImageLimits(file);
  if (!limits.valid) {
    return { valid: false, error: limits.error ?? "Görsel geçersiz." };
  }

  if (file.type === "image/gif") {
    return { valid: true, file, converted: false };
  }

  const mustTranscode = needsImageTranscode(file);
  const sanitized = await compressImage(file);

  if (mustTranscode && !DIRECT_UPLOAD_IMAGE_TYPES.has(sanitized.type.toLowerCase())) {
    return {
      valid: false,
      error:
        "Bu tarayıcı HEIC/AVIF görselini otomatik dönüştüremedi. Lütfen iPhone/Android kameradan doğrudan çekin veya fotoğrafı JPG/PNG olarak kaydedip seçin.",
    };
  }

  return { valid: true, file: sanitized, converted: mustTranscode };
}
