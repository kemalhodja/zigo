/**
 * compress-image.ts
 *
 * Lightweight browser-native image compression and resizing utility.
 * Resizes heavy images down to a maximum side of 1600px and compresses to WebP.
 */

export const IMAGE_MAX_INPUT_SIZE_BYTES = 15 * 1024 * 1024; // 15 MB
export const IMAGE_COMPRESS_THRESHOLD_BYTES = 1.5 * 1024 * 1024; // 1.5 MB

/**
 * Validates image input file size before upload/processing.
 */
export function validateImageLimits(file: File): { valid: boolean; error?: string } {
  if (!file.type.startsWith("image/")) return { valid: true };

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
 * Compresses an image file if it exceeds the threshold (1.5 MB).
 * Resizes max side to 1600px and outputs optimized WebP format.
 */
export async function compressImage(file: File, maxSide = 1600, quality = 0.82): Promise<File> {
  if (!file.type.startsWith("image/")) return file;

  // Skip GIFs (to avoid breaking animated frames) and small files under 1.5 MB
  if (file.type === "image/gif" || file.size <= IMAGE_COMPRESS_THRESHOLD_BYTES) {
    return file;
  }

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

        canvas.toBlob(
          (blob) => {
            if (!blob) {
              resolve(file);
              return;
            }
            const newName = file.name.replace(/\.[^/.]+$/, ".webp");
            const compressedFile = new File([blob], newName, {
              type: "image/webp",
              lastModified: Date.now(),
            });

            // Return compressed file only if it is actually smaller
            resolve(compressedFile.size < file.size ? compressedFile : file);
          },
          "image/webp",
          quality,
        );
      } catch (err) {
        console.warn("[COMPRESS_IMAGE] Canvas compression failed, using original file:", err);
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
