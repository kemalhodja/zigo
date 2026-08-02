import { randomUUID } from "crypto";
import { NextResponse } from "next/server";

import { getCurrentProfile } from "@/lib/domain/profiles";
import { createClient } from "@/lib/supabase/server";

const ALLOWED_TYPES = new Set([
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/gif",
]);
const MAX_FILE_SIZE_BYTES = 5 * 1024 * 1024; // 5 MB
const EXTENSION_BY_TYPE = new Map([
  ["image/jpeg", "jpg"],
  ["image/png", "png"],
  ["image/webp", "webp"],
  ["image/gif", "gif"],
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

    if (!(file instanceof File)) {
      return NextResponse.json({ error: "File is required." }, { status: 400 });
    }

    if (!ALLOWED_TYPES.has(file.type)) {
      return NextResponse.json({ error: "Unsupported file type." }, { status: 400 });
    }

    if (file.size > MAX_FILE_SIZE_BYTES) {
      return NextResponse.json({ error: "Avatar image must be 5 MB or smaller." }, { status: 400 });
    }

    const extension = EXTENSION_BY_TYPE.get(file.type) ?? "bin";
    const objectPath = `${profile.id}/${randomUUID()}.${extension}`;

    let avatarUrl = "";
    let uploadError = null;

    // 1. Try uploading to 'avatars' storage bucket
    const { error: primaryError } = await supabase.storage.from("avatars").upload(objectPath, file, {
      contentType: file.type,
      upsert: true,
    });

    if (!primaryError) {
      avatarUrl = supabase.storage.from("avatars").getPublicUrl(objectPath).data.publicUrl;
    } else {
      // 2. Fallback to 'social-media' storage bucket if 'avatars' bucket is missing or restricted
      const fallbackPath = `avatars/${objectPath}`;
      const { error: fallbackError } = await supabase.storage.from("social-media").upload(fallbackPath, file, {
        contentType: file.type,
        upsert: true,
      });

      if (!fallbackError) {
        avatarUrl = supabase.storage.from("social-media").getPublicUrl(fallbackPath).data.publicUrl;
      } else {
        uploadError = primaryError.message || fallbackError.message;
      }
    }

    if (uploadError || !avatarUrl) {
      return NextResponse.json({ error: uploadError || "Profil fotoğrafı yüklenemedi." }, { status: 400 });
    }

    // Automatically update the user profile's avatar_url in the database
    await supabase.from("users").update({ avatar_url: avatarUrl }).eq("id", profile.id);

    return NextResponse.json({
      data: {
        avatarUrl,
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
