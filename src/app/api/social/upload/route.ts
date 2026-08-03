import { randomUUID } from "crypto";
import { NextResponse } from "next/server";
import { z } from "zod";

import { extractErrorMessage } from "@/lib/domain/api-errors";
import { getCurrentProfile } from "@/lib/domain/profiles";
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

export async function GET(request: Request) {
  try {
    const supabase = await createClient();
    const profile = await getCurrentProfile(supabase);

    if (!profile) {
      return NextResponse.json({ error: "İmza adresi almak için lütfen giriş yapın." }, { status: 401 });
    }

    if (profile.account_status === "closed" || profile.account_status === "suspended") {
      return NextResponse.json({ error: "Kısıtlanmış veya kapatılmış hesaplar medya yükleyemez." }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const fileType = searchParams.get("fileType") || "image/jpeg";
    const filename = searchParams.get("filename") || "media.bin";

    if (!ALLOWED_TYPES.has(fileType)) {
      return NextResponse.json({ error: "Desteklenmeyen dosya türü." }, { status: 400 });
    }

    const extension = EXTENSION_BY_TYPE.get(fileType) ?? (filename.split(".").pop() || "bin");
    const objectPath = `${profile.id}/${randomUUID()}.${extension}`;

    const { data, error } = await supabase.storage
      .from("social-media")
      .createSignedUploadUrl(objectPath);

    if (error || !data?.signedUrl) {
      return NextResponse.json({ error: error?.message || "İmza adresi oluşturulamadı." }, { status: 400 });
    }

    const { data: publicData } = supabase.storage.from("social-media").getPublicUrl(objectPath);

    return NextResponse.json({
      data: {
        signedUrl: data.signedUrl,
        token: data.token,
        path: data.path,
        objectPath,
        mediaUrl: publicData.publicUrl,
        mediaType: fileType.startsWith("video/") ? "video" : "image",
      },
    });
  } catch (error) {
    const message = extractErrorMessage(error, "Yükleme adresi oluşturulamadı.");
    return NextResponse.json({ error: message }, { status: 400 });
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
      const { data } = supabase.storage.from("social-media").getPublicUrl(objectPath);
      mediaUrl = data.publicUrl;
    } else {
      // 2. Fallback: try uploading to 'avatars' storage bucket
      const fallbackPath = `social/${objectPath}`;
      const { error: fallbackError } = await supabase.storage.from("avatars").upload(fallbackPath, file, {
        contentType: file.type,
        upsert: true,
      });

      if (!fallbackError) {
        const { data } = supabase.storage.from("avatars").getPublicUrl(fallbackPath);
        mediaUrl = data.publicUrl;
      } else if (mediaType === "image" && file.size <= 10 * 1024 * 1024) {
        // 3. Resilient fallback for images: convert to base64 Data URL so photo upload never fails
        const arrayBuffer = await file.arrayBuffer();
        const base64 = Buffer.from(arrayBuffer).toString("base64");
        mediaUrl = `data:${file.type};base64,${base64}`;
      } else {
        return NextResponse.json(
          { error: primaryError?.message ?? fallbackError?.message ?? "Medya yüklenemedi. Depolama alanını kontrol edin." },
          { status: 400 },
        );
      }
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
