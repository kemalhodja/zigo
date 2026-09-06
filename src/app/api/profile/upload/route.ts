import { randomUUID } from "crypto";
import { NextResponse } from "next/server";

import { getCurrentProfile } from "@/lib/domain/profiles";
import { checkRateLimitAsync } from "@/lib/server/rate-limit";
import type { Database } from "@/lib/supabase/database.types";
import { createClient } from "@/lib/supabase/server";

const ALLOWED_TYPES = new Set([
  "image/jpeg",
  "image/jpg",
  "image/png",
  "image/webp",
  "image/gif",
]);
const MAX_FILE_SIZE_BYTES = 10 * 1024 * 1024; // 10 MB
const EXTENSION_BY_TYPE = new Map([
  ["image/jpeg", "jpg"],
  ["image/jpg", "jpg"],
  ["image/png", "png"],
  ["image/webp", "webp"],
  ["image/gif", "gif"],
]);

async function hasValidImageSignature(file: File) {
  const header = new Uint8Array(await file.slice(0, 16).arrayBuffer());
  const ascii = (start: number, length: number) => String.fromCharCode(...header.slice(start, start + length));
  const startsWith = (...bytes: number[]) => bytes.every((byte, index) => header[index] === byte);

  switch (file.type) {
    case "image/jpeg":
    case "image/jpg":
      return startsWith(0xff, 0xd8, 0xff);
    case "image/png":
      return startsWith(0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a);
    case "image/gif":
      return ascii(0, 6) === "GIF87a" || ascii(0, 6) === "GIF89a";
    case "image/webp":
      return ascii(0, 4) === "RIFF" && ascii(8, 4) === "WEBP";
    default:
      return false;
  }
}

export async function POST(request: Request) {
  try {
    const supabase = await createClient();
    const profile = await getCurrentProfile(supabase);

    if (!profile) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const rateLimit = await checkRateLimitAsync(`profile-upload:${profile.id}`, 20, 60 * 60_000);
    if (!rateLimit.allowed) {
      return NextResponse.json(
        { error: "Çok fazla görsel yükledin. Lütfen daha sonra tekrar dene." },
        { status: 429, headers: { "Retry-After": String(rateLimit.retryAfterSeconds) } },
      );
    }

    const formData = await request.formData();
    const file = formData.get("file");
    const kind = String(formData.get("kind") ?? "avatar");

    if (!(file instanceof File)) {
      return NextResponse.json({ error: "File is required." }, { status: 400 });
    }

    if (!ALLOWED_TYPES.has(file.type)) {
      return NextResponse.json({ error: "Lütfen geçerli bir görsel dosyası seçin (JPG, PNG, WEBP)." }, { status: 400 });
    }

    if (file.size > MAX_FILE_SIZE_BYTES) {
      return NextResponse.json({ error: "Görsel en fazla 10 MB olabilir." }, { status: 400 });
    }

    if (!(await hasValidImageSignature(file))) {
      return NextResponse.json({ error: "Dosya içeriği bildirilen görsel türüyle eşleşmiyor." }, { status: 400 });
    }

    const extension = EXTENSION_BY_TYPE.get(file.type) ?? "jpg";
    const isCover = kind === "cover";
    const objectPath = isCover
      ? `covers/${profile.id}/${randomUUID()}.${extension}`
      : `${profile.id}/${randomUUID()}.${extension}`;

    let imageUrl = "";

    // 1. Try uploading to 'avatars' storage bucket
    const { error: primaryError } = await supabase.storage.from("avatars").upload(objectPath, file, {
      contentType: file.type || "image/jpeg",
      upsert: true,
    });

    if (!primaryError) {
      imageUrl = supabase.storage.from("avatars").getPublicUrl(objectPath).data.publicUrl;
    } else {
      return NextResponse.json(
        { error: primaryError.message ?? "Görsel yüklenemedi. Profil storage alanını kontrol edin." },
        { status: 400 },
      );
    }

    if (!imageUrl) {
      return NextResponse.json({ error: "Görsel yüklenemedi." }, { status: 400 });
    }

    // Automatically update user profile's avatar_url or cover_url in database
    if (isCover) {
      await supabase.from("users").update({ cover_url: imageUrl } as unknown as Partial<Database["public"]["Tables"]["users"]["Update"]>).eq("id", profile.id);
    } else {
      await supabase.from("users").update({ avatar_url: imageUrl }).eq("id", profile.id);
    }

    return NextResponse.json({
      data: {
        avatarUrl: isCover ? undefined : imageUrl,
        coverUrl: isCover ? imageUrl : undefined,
        imageUrl,
        objectPath,
      },
    });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Avatar could not be uploaded." },
      { status: 400 },
    );
  }
}
