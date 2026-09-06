import { randomUUID } from "crypto";
import { NextResponse } from "next/server";
import { z } from "zod";

import { extractErrorMessage } from "@/lib/domain/api-errors";
import { getCurrentProfile } from "@/lib/domain/profiles";
import { getUserSubscription } from "@/lib/domain/subscription";
import { checkRateLimitAsync } from "@/lib/server/rate-limit";
import { createClient } from "@/lib/supabase/server";

const ALLOWED_TYPES = new Set([
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/gif",
  "video/mp4",
  "video/webm",
]);
const MAX_FILE_SIZE_BYTES = 100 * 1024 * 1024;
const EXTENSION_BY_TYPE = new Map([
  ["image/jpeg", "jpg"],
  ["image/png", "png"],
  ["image/webp", "webp"],
  ["image/gif", "gif"],
  ["video/mp4", "mp4"],
  ["video/webm", "webm"],
]);
const cleanupUploadSchema = z.object({
  objectPath: z.string().min(3).max(500),
});

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
    case "video/mp4":
      return ascii(4, 4) === "ftyp";
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
    // allowing two daily posts plus normal retries or a replacement upload.
    const rateLimit = await checkRateLimitAsync(`social-upload:v2:${profile.id}`, 60, 60 * 60_000);
    if (!rateLimit.allowed) {
      return NextResponse.json(
        { error: "Bu saat için medya yükleme sınırına ulaştınız. Lütfen daha sonra tekrar deneyin." },
        { status: 429, headers: { "Retry-After": String(rateLimit.retryAfterSeconds) } },
      );
    }

    const formData = await request.formData();
    const file = formData.get("file");

    if (!(file instanceof File)) {
      return NextResponse.json({ error: "Lütfen bir medya dosyası seçin." }, { status: 400 });
    }

    if (!ALLOWED_TYPES.has(file.type)) {
      return NextResponse.json({ error: "Desteklenmeyen dosya türü. Lütfen JPG, PNG, WEBP, GIF, MP4 veya WEBM kullanın." }, { status: 400 });
    }

    if (file.size > MAX_FILE_SIZE_BYTES) {
      return NextResponse.json({ error: "Medya boyutu en fazla 100 MB olabilir." }, { status: 400 });
    }

    if (!(await hasValidFileSignature(file))) {
      return NextResponse.json({ error: "Dosya içeriği bildirilen medya türüyle eşleşmiyor." }, { status: 400 });
    }

    const extension = EXTENSION_BY_TYPE.get(file.type) ?? "bin";
    const objectPath = `${profile.id}/${randomUUID()}.${extension}`;
    const mediaType = file.type.startsWith("video/") ? "video" : "image";

    let mediaUrl = "";

    // 1. Try uploading to 'social-media' storage bucket
    const { error: primaryError } = await supabase.storage.from("social-media").upload(objectPath, file, {
      contentType: file.type,
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
      return NextResponse.json({ error: "Kısıtlanmış veya kapatılmış hesaplar medya silebilir." }, { status: 403 });
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
