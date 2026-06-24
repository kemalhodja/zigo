import { randomUUID } from "crypto";
import { NextResponse } from "next/server";
import { z } from "zod";

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
const MAX_FILE_SIZE_BYTES = 50 * 1024 * 1024;
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

export async function POST(request: Request) {
  try {
    const supabase = await createClient();
    const profile = await getCurrentProfile(supabase);

    if (!profile) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    if (profile.role !== "teacher" || !profile.is_verified) {
      return NextResponse.json({ error: "Only verified teachers can upload media." }, { status: 403 });
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
      return NextResponse.json({ error: "Media must be 50 MB or smaller." }, { status: 400 });
    }

    const extension = EXTENSION_BY_TYPE.get(file.type) ?? "bin";
    const objectPath = `${profile.id}/${randomUUID()}.${extension}`;

    const { error } = await supabase.storage.from("social-media").upload(objectPath, file, {
      contentType: file.type,
      upsert: false,
    });

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    const { data } = supabase.storage.from("social-media").getPublicUrl(objectPath);
    const mediaType = file.type.startsWith("video/") ? "video" : "image";

    return NextResponse.json({
      data: {
        mediaUrl: data.publicUrl,
        mediaType,
        objectPath,
      },
    });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Media could not be uploaded." },
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

    if (profile.role !== "teacher" || !profile.is_verified) {
      return NextResponse.json({ error: "Only verified teachers can clean uploaded media." }, { status: 403 });
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
