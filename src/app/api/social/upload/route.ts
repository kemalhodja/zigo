import { randomUUID } from "crypto";
import { NextResponse } from "next/server";
import { z } from "zod";

import { extractErrorMessage } from "@/lib/domain/api-errors";
import { getCurrentProfile } from "@/lib/domain/profiles";
import { getUserSubscription } from "@/lib/domain/subscription";
import { checkRateLimitAsync } from "@/lib/server/rate-limit";
import { inspectVideoHeader } from "@/lib/server/video-metadata";
import { createClient } from "@/lib/supabase/server";

const ALLOWED_IMAGE_TYPES = new Set([
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/gif",
  "image/avif",
]);
const ALLOWED_VIDEO_TYPES = new Set([
  "video/mp4",
  "video/webm",
  "video/quicktime",
  "video/x-m4v",
  "video/m4v",
]);
const ALLOWED_TYPES = new Set([...ALLOWED_IMAGE_TYPES, ...ALLOWED_VIDEO_TYPES]);

const MAX_IMAGE_SIZE_BYTES = 5 * 1024 * 1024; // 5 MB (sıkıştırılmış görsel)
const MAX_VIDEO_SIZE_BYTES = 25 * 1024 * 1024; // 25 MB (kısa tanıtım videosu)
const MAX_VIDEO_DURATION_SECONDS = 30; // 30 saniye kısa tanıtım videosu limiti

const EXTENSION_BY_TYPE = new Map([
  ["image/jpeg", "jpg"],
  ["image/png", "png"],
  ["image/webp", "webp"],
  ["image/gif", "gif"],
  ["image/avif", "avif"],
  ["video/mp4", "mp4"],
  ["video/webm", "webm"],
  // Normalize iPhone MOV / M4V (ISO-BMFF ftyp) to MP4 for universal bucket + browser playback
  ["video/quicktime", "mp4"],
  ["video/x-m4v", "mp4"],
  ["video/m4v", "mp4"],
]);

function resolveStorageContentType(contentType: string): string {
  if (contentType === "video/quicktime" || contentType === "video/x-m4v" || contentType === "video/m4v") {
    return "video/mp4";
  }
  return contentType;
}

const signedUploadRequestSchema = z.object({
  mode: z.literal("signed-url"),
  contentType: z.string().min(3).max(80),
  fileSize: z.number().int().positive(),
  durationSeconds: z.number().nonnegative().optional(),
});

const verifySignedUploadSchema = z.object({
  mode: z.literal("verify-signed"),
  objectPath: z.string().min(3).max(500),
});

const cleanupUploadSchema = z.object({
  objectPath: z.string().min(3).max(500),
});

const MAX_VERIFIED_DURATION_GRACE_SECONDS = MAX_VIDEO_DURATION_SECONDS + 0.6;

async function fetchStorageByteRange(url: string, rangeHeader: string): Promise<Uint8Array | null> {
  try {
    const res = await fetch(url, {
      headers: { Range: rangeHeader },
      cache: "no-store",
    });
    if (!res.ok && res.status !== 206) return null;
    return new Uint8Array(await res.arrayBuffer());
  } catch {
    return null;
  }
}

async function hasValidFileSignature(file: File) {
  const header = new Uint8Array(await file.slice(0, 16).arrayBuffer());
  const ascii = (start: number, length: number) => String.fromCharCode(...header.slice(start, start + length));
  const startsWith = (...bytes: number[]) => bytes.every((byte, index) => header[index] === byte);

  switch (file.type) {
    case "image/jpeg":
      return startsWith(0xff, 0xd8, 0xff);
    case "image/png":
      return startsWith(0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a);
    case "image/gif":
      return ascii(0, 6) === "GIF87a" || ascii(0, 6) === "GIF89a";
    case "image/webp":
      return ascii(0, 4) === "RIFF" && ascii(8, 4) === "WEBP";
    case "image/avif":
      return ascii(4, 4) === "ftyp";
    case "video/mp4":
    case "video/quicktime":
    case "video/x-m4v":
    case "video/m4v":
      // ISO-BMFF containers (MP4, MOV, M4V) use ftyp, moov, mdat, wide, or free atoms at byte 4
      return ["ftyp", "moov", "mdat", "wide", "free"].includes(ascii(4, 4));
    case "video/webm":
      return startsWith(0x1a, 0x45, 0xdf, 0xa3);
    default:
      return false;
  }
}

export async function POST(request: Request) {
  try {
    const supabase = await createClient();
    const profile = await getCurrentProfile(supabase);

    if (!profile) {
      return NextResponse.json({ error: "Medya yüklemek için lütfen giriş yapın." }, { status: 401 });
    }

    if (profile.account_status === "closed" || profile.account_status === "suspended") {
      return NextResponse.json({ error: "Kısıtlanmış veya kapatılmış hesaplar medya yükleyemez." }, { status: 403 });
    }

    const publisherRoles = new Set([
      "teacher",
      "education_institution",
      "education_platform",
      "publisher",
      "student",
      "parent",
    ]);
    if (!publisherRoles.has(profile.role)) {
      return NextResponse.json({ error: "Bu hesap türü medya paylaşamaz." }, { status: 403 });
    }

    const isStudentOrParent = profile.role === "student" || profile.role === "parent";
    if (isStudentOrParent) {
      const subscription = await getUserSubscription(supabase, profile.id);
      const hasZigoPlus = Boolean(subscription?.isPremium || profile.is_premium);
      if (!hasZigoPlus) {
        return NextResponse.json(
          { error: "Öğrenciler ve veliler medya paylaşabilmek için aktif bir Zigo Plus abonesi olmalıdır." },
          { status: 403 },
        );
      }
    }

    if (profile.role === "teacher" && !profile.is_verified) {
      return NextResponse.json({ error: "Medya paylaşımı için öğretmen hesabınızın doğrulanmış olması gerekir." }, { status: 403 });
    }

    // A carousel may contain up to 10 assets. Keep a meaningful abuse guard while
    // allowing daily posts plus normal retries or a replacement upload.
    const rateLimit = await checkRateLimitAsync(`social-upload:v2:${profile.id}`, 60, 60 * 60_000);
    if (!rateLimit.allowed) {
      return NextResponse.json(
        { error: "Bu saat için medya yükleme sınırına ulaştınız. Lütfen daha sonra tekrar deneyin." },
        { status: 429, headers: { "Retry-After": String(rateLimit.retryAfterSeconds) } },
      );
    }

    const contentTypeHeader = request.headers.get("content-type") ?? "";

    // ── Mode A & C: JSON requests (signed upload URL or post-upload verification) ──
    if (contentTypeHeader.includes("application/json")) {
      const jsonBody = (await request.json()) as { mode?: string };

      // ── Mode C: Server-side verification of direct-uploaded video container & duration ──
      if (jsonBody?.mode === "verify-signed") {
        const parsedVerify = verifySignedUploadSchema.safeParse(jsonBody);
        if (!parsedVerify.success || !parsedVerify.data.objectPath.startsWith(`${profile.id}/`)) {
          return NextResponse.json({ error: "Geçersiz doğrulama yolu." }, { status: 400 });
        }

        const objectPath = parsedVerify.data.objectPath;
        const supabaseUrl = (
          process.env.NEXT_PUBLIC_SUPABASE_URL ||
          "https://fuqnjxcoxopomzgbifve.supabase.co"
        )
          .trim()
          .replace(/\/$/, "");
        const objectUrl = `${supabaseUrl}/storage/v1/object/public/social-media/${objectPath}`;

        const headBytes = await fetchStorageByteRange(objectUrl, "bytes=0-65535");
        if (!headBytes) {
          // If Storage is unreachable or still propagating, do not block legitimate uploads
          return NextResponse.json({ data: { verified: true, skipped: true } });
        }

        let inspection = inspectVideoHeader(headBytes);
        if (inspection.validContainer && inspection.container === "mp4" && inspection.durationSeconds === null) {
          const tailBytes = await fetchStorageByteRange(objectUrl, "bytes=-65536");
          inspection = inspectVideoHeader(headBytes, tailBytes);
        }

        const rejectAndCleanup = async (errorMessage: string) => {
          await supabase.storage.from("social-media").remove([objectPath]).catch(() => {});
          const lifecycle = supabase as unknown as {
            from: (table: "media_uploads") => {
              update: (value: Record<string, unknown>) => {
                eq: (col: string, val: string) => {
                  eq: (col: string, val: string) => Promise<{ error: { message?: string } | null }>;
                };
              };
            };
          };
          await lifecycle
            .from("media_uploads")
            .update({ status: "deleted", deleted_at: new Date().toISOString() })
            .eq("object_path", objectPath)
            .eq("owner_id", profile.id)
            .catch(() => {});
          return NextResponse.json({ error: errorMessage }, { status: 400 });
        };

        if (!inspection.validContainer) {
          return rejectAndCleanup(
            "Yüklenen dosya geçerli bir kısa video formatı değil. Lütfen MP4, WEBM, MOV veya M4V seçin.",
          );
        }

        if (
          inspection.durationSeconds !== null &&
          inspection.durationSeconds > MAX_VERIFIED_DURATION_GRACE_SECONDS
        ) {
          return rejectAndCleanup(
            `Sunucu doğrulaması: Video süresi ${Math.round(inspection.durationSeconds)} sn olarak tespit edildi. Kısa tanıtım videoları en fazla ${MAX_VIDEO_DURATION_SECONDS} saniye olabilir; uzun dersler için YouTube veya Vimeo linki ekleyin.`,
          );
        }

        return NextResponse.json({
          data: {
            verified: true,
            container: inspection.container,
            durationSeconds: inspection.durationSeconds,
          },
        });
      }

      const parsed = signedUploadRequestSchema.safeParse(jsonBody);
      if (!parsed.success) {
        return NextResponse.json({ error: "Geçersiz yükleme isteği." }, { status: 400 });
      }

      const { contentType, fileSize, durationSeconds } = parsed.data;
      const normalizedType = contentType.toLowerCase();
      if (!ALLOWED_VIDEO_TYPES.has(normalizedType)) {
        return NextResponse.json(
          { error: "Kısa tanıtım videoları için MP4, WEBM, MOV (iPhone) veya M4V formatı desteklenir." },
          { status: 400 },
        );
      }

      if (fileSize > MAX_VIDEO_SIZE_BYTES) {
        return NextResponse.json(
          {
            error: "Kısa tanıtım videosu boyutu en fazla 25 MB olabilir. Uzun videolarınız için YouTube, Vimeo veya benzeri platform bağlantısı ekleyebilirsiniz.",
          },
          { status: 400 },
        );
      }

      if (typeof durationSeconds === "number" && durationSeconds > MAX_VIDEO_DURATION_SECONDS) {
        return NextResponse.json(
          {
            error: `Kısa tanıtım videoları en fazla ${MAX_VIDEO_DURATION_SECONDS} saniye olabilir. Uzun ders videolarınız için YouTube, Vimeo veya benzeri platform bağlantısı ekleyebilirsiniz.`,
          },
          { status: 400 },
        );
      }

      const extension = EXTENSION_BY_TYPE.get(normalizedType) ?? "mp4";
      const storageContentType = resolveStorageContentType(normalizedType);
      const objectPath = `${profile.id}/${randomUUID()}.${extension}`;

      const { data: signedData, error: signedError } = await supabase.storage
        .from("social-media")
        .createSignedUploadUrl(objectPath);

      if (signedError || !signedData?.signedUrl) {
        return NextResponse.json(
          { error: signedError?.message ?? "Video yükleme bağlantısı oluşturulamadı. Lütfen tekrar deneyin." },
          { status: 400 },
        );
      }

      const lifecycle = supabase as unknown as {
        from: (table: "media_uploads") => {
          insert: (value: Record<string, unknown>) => Promise<{ error: { message?: string } | null }>;
        };
      };
      const { error: lifecycleError } = await lifecycle.from("media_uploads").insert({
        owner_id: profile.id,
        object_path: objectPath,
        media_type: "video",
        byte_size: fileSize,
      });

      if (lifecycleError) {
        return NextResponse.json(
          { error: "Medya kaydı oluşturulamadı. Lütfen tekrar deneyin." },
          { status: 500 },
        );
      }

      return NextResponse.json({
        data: {
          signedUrl: signedData.signedUrl,
          token: signedData.token,
          storageContentType,
          mediaUrl: `/api/social/media?path=${encodeURIComponent(objectPath)}`,
          mediaType: "video" as const,
          objectPath,
        },
      });
    }

    // ── Mode B: Multipart FormData Upload (images + small short promo videos) ──
    const formData = await request.formData();
    const file = formData.get("file");

    if (!(file instanceof File)) {
      return NextResponse.json({ error: "Lütfen bir medya dosyası seçin." }, { status: 400 });
    }

    const normalizedType = file.type.toLowerCase();
    if (!ALLOWED_TYPES.has(normalizedType)) {
      return NextResponse.json(
        {
          error: "Desteklenmeyen dosya türü. Fotoğraf (JPG, PNG, WEBP, GIF, AVIF, HEIC) veya kısa tanıtım videosu (MP4, WEBM, MOV, M4V · maks. 30 sn) yükleyebilirsiniz.",
        },
        { status: 400 },
      );
    }

    const isVideo = ALLOWED_VIDEO_TYPES.has(normalizedType);
    if (isVideo) {
      const durationRaw = formData.get("durationSeconds");
      const durationSeconds = typeof durationRaw === "string" ? Number(durationRaw) : NaN;
      if (Number.isFinite(durationSeconds) && durationSeconds > MAX_VIDEO_DURATION_SECONDS) {
        return NextResponse.json(
          {
            error: `Kısa tanıtım videoları en fazla ${MAX_VIDEO_DURATION_SECONDS} saniye olabilir. Uzun ders videolarınız için YouTube, Vimeo veya benzeri platform bağlantısı ekleyebilirsiniz.`,
          },
          { status: 400 },
        );
      }

      if (file.size > MAX_VIDEO_SIZE_BYTES) {
        return NextResponse.json(
          {
            error: "Kısa tanıtım videosu boyutu en fazla 25 MB olabilir. Uzun videolarınız için YouTube, Vimeo veya benzeri platform bağlantısı ekleyebilirsiniz.",
          },
          { status: 400 },
        );
      }
    } else if (file.size > MAX_IMAGE_SIZE_BYTES) {
      return NextResponse.json({ error: "Görsel boyutu en fazla 5 MB olabilir." }, { status: 400 });
    }

    if (!(await hasValidFileSignature(file))) {
      return NextResponse.json({ error: "Dosya içeriği bildirilen medya türüyle eşleşmiyor." }, { status: 400 });
    }

    const extension = EXTENSION_BY_TYPE.get(normalizedType) ?? "bin";
    const storageContentType = resolveStorageContentType(normalizedType);
    const objectPath = `${profile.id}/${randomUUID()}.${extension}`;
    const mediaType = isVideo ? "video" : "image";

    let mediaUrl = "";

    const { error: primaryError } = await supabase.storage.from("social-media").upload(objectPath, file, {
      contentType: storageContentType,
      upsert: false,
    });

    if (!primaryError) {
      mediaUrl = `/api/social/media?path=${encodeURIComponent(objectPath)}`;
    } else {
      return NextResponse.json(
        { error: primaryError.message ?? "Medya yüklenemedi. Depolama alanını kontrol edin." },
        { status: 400 },
      );
    }

    const lifecycle = supabase as unknown as {
      from: (table: "media_uploads") => {
        insert: (value: Record<string, unknown>) => Promise<{ error: { message?: string } | null }>;
      };
    };
    const { error: lifecycleError } = await lifecycle.from("media_uploads").insert({
      owner_id: profile.id,
      object_path: objectPath,
      media_type: mediaType,
      byte_size: file.size,
    });
    if (lifecycleError) {
      await supabase.storage.from("social-media").remove([objectPath]);
      return NextResponse.json(
        { error: "Medya kaydı oluşturulamadı. Lütfen tekrar deneyin." },
        { status: 500 },
      );
    }

    return NextResponse.json({
      data: {
        mediaUrl,
        mediaType,
        objectPath,
      },
    });
  } catch (error) {
    const message = extractErrorMessage(error, "Medya yüklenemedi. Lütfen tekrar deneyin.");
    return NextResponse.json(
      { error: message },
      { status: 400 },
    );
  }
}

export async function DELETE(request: Request) {
  try {
    const supabase = await createClient();
    const profile = await getCurrentProfile(supabase);

    if (!profile) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    if (profile.account_status === "closed" || profile.account_status === "suspended") {
      return NextResponse.json({ error: "Kısıtlanmış veya kapatılmış hesaplar medya silemez." }, { status: 403 });
    }

    const body = cleanupUploadSchema.parse(await request.json());
    if (!body.objectPath.startsWith(`${profile.id}/`)) {
      return NextResponse.json({ error: "Uploaded media can be cleaned only by its owner." }, { status: 403 });
    }

    const { error } = await supabase.storage.from("social-media").remove([body.objectPath]);
    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    const lifecycle = supabase as unknown as {
      from: (table: "media_uploads") => {
        update: (value: Record<string, unknown>) => {
          eq: (column: string, value: string) => {
            eq: (column: string, value: string) => Promise<{ error: { message?: string } | null }>;
          };
        };
      };
    };
    const { error: lifecycleError } = await lifecycle.from("media_uploads")
      .update({ status: "deleted", deleted_at: new Date().toISOString() })
      .eq("object_path", body.objectPath)
      .eq("owner_id", profile.id);
    if (lifecycleError) {
      console.error("[MEDIA_LIFECYCLE_CLEANUP_ERROR]", lifecycleError.message);
    }

    return NextResponse.json({ data: { cleaned: true } });
  } catch (error) {
    const message = error instanceof z.ZodError
      ? "Choose a valid uploaded media path to clean."
      : error instanceof Error
        ? error.message
        : "Uploaded media could not be cleaned.";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
