import { randomUUID } from "crypto";
import { NextResponse } from "next/server";

import { getCurrentProfile } from "@/lib/domain/profiles";
import { createClient } from "@/lib/supabase/server";

const ALLOWED_TYPES = new Set([
  "image/jpeg",
  "image/jpg",
  "image/png",
  "image/webp",
  "image/gif",
  "image/heic",
  "image/heif",
  "image/svg+xml",
]);
const MAX_FILE_SIZE_BYTES = 10 * 1024 * 1024; // 10 MB
const EXTENSION_BY_TYPE = new Map([
  ["image/jpeg", "jpg"],
  ["image/jpg", "jpg"],
  ["image/png", "png"],
  ["image/webp", "webp"],
  ["image/gif", "gif"],
  ["image/heic", "heic"],
  ["image/heif", "heif"],
  ["image/svg+xml", "svg"],
]);

export async function POST(request: Request) {
  try {
    const supabase = await createClient();
    const profile = await getCurrentProfile(supabase);

    if (!profile) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const formData = await request.formData();
    const file = formData.get("file");
    const kind = String(formData.get("kind") ?? "avatar");

    if (!(file instanceof File)) {
      return NextResponse.json({ error: "File is required." }, { status: 400 });
    }

    const isImageType = file.type.startsWith("image/") || ALLOWED_TYPES.has(file.type);
    if (!isImageType) {
      return NextResponse.json({ error: "Lütfen geçerli bir görsel dosyası seçin (JPG, PNG, WEBP)." }, { status: 400 });
    }

    if (file.size > MAX_FILE_SIZE_BYTES) {
      return NextResponse.json({ error: "Görsel en fazla 10 MB olabilir." }, { status: 400 });
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
      // 2. Fallback to 'social-media' storage bucket if 'avatars' bucket is missing or restricted
      const fallbackPath = isCover ? `covers/${objectPath}` : `avatars/${objectPath}`;
      const { error: fallbackError } = await supabase.storage.from("social-media").upload(fallbackPath, file, {
        contentType: file.type || "image/jpeg",
        upsert: true,
      });

      if (!fallbackError) {
        imageUrl = supabase.storage.from("social-media").getPublicUrl(fallbackPath).data.publicUrl;
      } else {
        // 3. Resilient fallback: convert to base64 Data URL so photo NEVER fails to save
        const arrayBuffer = await file.arrayBuffer();
        const base64 = Buffer.from(arrayBuffer).toString("base64");
        const mime = file.type || "image/jpeg";
        imageUrl = `data:${mime};base64,${base64}`;
      }
    }

    if (!imageUrl) {
      return NextResponse.json({ error: "Görsel yüklenemedi." }, { status: 400 });
    }

    // Automatically update user profile's avatar_url or cover_url in database
    if (isCover) {
      await supabase.from("users").update({ cover_url: imageUrl } as any).eq("id", profile.id);
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
