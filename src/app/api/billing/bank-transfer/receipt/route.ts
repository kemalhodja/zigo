import { NextResponse } from "next/server";
import { z } from "zod";

import { attachBankTransferReceipt, getBankTransferRequestById } from "@/lib/domain/bank-transfer";
import { getCurrentProfile } from "@/lib/domain/profiles";
import { createClient } from "@/lib/supabase/server";

const ALLOWED_TYPES = new Set(["image/jpeg", "image/png", "image/webp", "application/pdf"]);
const MAX_FILE_SIZE_BYTES = 10 * 1024 * 1024;
const EXTENSION_BY_TYPE = new Map([
  ["image/jpeg", "jpg"],
  ["image/png", "png"],
  ["image/webp", "webp"],
  ["application/pdf", "pdf"],
]);

const receiptSchema = z.object({
  requestId: z.string().uuid(),
});

export async function POST(request: Request) {
  try {
    const supabase = await createClient();
    const profile = await getCurrentProfile(supabase);
    if (!profile) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const formData = await request.formData();
    const file = formData.get("file");
    const parsed = receiptSchema.parse({
      requestId: formData.get("requestId"),
    });

    if (!(file instanceof File)) {
      return NextResponse.json({ error: "Dekont dosyası gerekli." }, { status: 400 });
    }

    if (!ALLOWED_TYPES.has(file.type)) {
      return NextResponse.json({ error: "Desteklenmeyen dosya türü." }, { status: 400 });
    }

    if (file.size > MAX_FILE_SIZE_BYTES) {
      return NextResponse.json({ error: "Dekont en fazla 10 MB olabilir." }, { status: 400 });
    }

    const transferRequest = await getBankTransferRequestById(supabase, parsed.requestId);
    if (transferRequest.user_id !== profile.id) {
      return NextResponse.json({ error: "Bu havale talebine erişiminiz yok." }, { status: 403 });
    }
    if (transferRequest.status !== "pending") {
      return NextResponse.json({ error: "Bu talep artık bekleyen durumda değil." }, { status: 400 });
    }

    const extension = EXTENSION_BY_TYPE.get(file.type) ?? "bin";
    const objectPath = `${profile.id}/${parsed.requestId}.${extension}`;

    const { error: uploadError } = await supabase.storage.from("billing-receipts").upload(objectPath, file, {
      contentType: file.type,
      upsert: true,
    });

    if (uploadError) {
      return NextResponse.json({ error: uploadError.message }, { status: 400 });
    }

    const updated = await attachBankTransferReceipt(supabase, parsed.requestId, objectPath);

    return NextResponse.json({ data: updated });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: "Geçersiz dekont yükleme isteği." }, { status: 400 });
    }
    const message = error instanceof Error ? error.message : "Dekont yüklenemedi.";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
