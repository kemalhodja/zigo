import { NextResponse } from "next/server";
import { z } from "zod";

import { getCurrentProfile } from "@/lib/domain/profiles";
import { submitTeacherCredential } from "@/lib/domain/trust";
import { createClient } from "@/lib/supabase/server";

const ALLOWED_TYPES = new Set(["image/jpeg", "image/png", "image/webp", "application/pdf"]);
const MAX_FILE_SIZE_BYTES = 10 * 1024 * 1024;
const EXTENSION_BY_TYPE = new Map([
  ["image/jpeg", "jpg"],
  ["image/png", "png"],
  ["image/webp", "webp"],
  ["application/pdf", "pdf"],
]);

const uploadSchema = z.object({
  credentialType: z.enum(["diploma", "e_devlet"]),
});

export async function POST(request: Request) {
  try {
    const supabase = await createClient();
    const profile = await getCurrentProfile(supabase);
    if (!profile || profile.role !== "teacher") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const formData = await request.formData();
    const file = formData.get("file");
    const parsed = uploadSchema.parse({
      credentialType: formData.get("credentialType"),
    });

    if (!(file instanceof File)) {
      return NextResponse.json({ error: "Diploma/sertifika dosyası gerekli." }, { status: 400 });
    }

    if (!ALLOWED_TYPES.has(file.type)) {
      return NextResponse.json({ error: "Desteklenmeyen dosya türü." }, { status: 400 });
    }

    if (file.size > MAX_FILE_SIZE_BYTES) {
      return NextResponse.json({ error: "Dosya en fazla 10 MB olabilir." }, { status: 400 });
    }

    const extension = EXTENSION_BY_TYPE.get(file.type) ?? "bin";
    const objectPath = `${profile.id}/${crypto.randomUUID()}.${extension}`;

    const { error: uploadError } = await supabase.storage.from("teacher-credentials").upload(objectPath, file, {
      contentType: file.type,
      upsert: false,
    });

    if (uploadError) {
      return NextResponse.json({ error: uploadError.message }, { status: 400 });
    }

    const documentRef = `teacher-credentials/${objectPath}`;
    const submission = await submitTeacherCredential(supabase, profile.id, {
      credentialType: parsed.credentialType,
      documentUrl: documentRef,
    });

    return NextResponse.json({ data: submission }, { status: 201 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: "Geçersiz yükleme isteği." }, { status: 400 });
    }
    const message = error instanceof Error ? error.message : "Dosya yüklenemedi.";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
