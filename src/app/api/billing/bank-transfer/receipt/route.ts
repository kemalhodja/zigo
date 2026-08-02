import { NextResponse } from "next/server";
import { z } from "zod";

import { attachBankTransferReceipt, getBankTransferRequestById } from "@/lib/domain/bank-transfer";
import { getCurrentProfile } from "@/lib/domain/profiles";
import { getServerMessages } from "@/lib/i18n/server";
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
  const messages = await getServerMessages();
  const h = messages.billingUi.havale;

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
      return NextResponse.json({ error: h.apiReceiptRequired }, { status: 400 });
    }

    if (!ALLOWED_TYPES.has(file.type)) {
      return NextResponse.json({ error: h.apiUnsupportedType }, { status: 400 });
    }

    if (file.size > MAX_FILE_SIZE_BYTES) {
      return NextResponse.json({ error: h.apiFileTooLarge }, { status: 400 });
    }

    const transferRequest = await getBankTransferRequestById(supabase, parsed.requestId);
    if (transferRequest.user_id !== profile.id) {
      return NextResponse.json({ error: h.apiNoAccess }, { status: 403 });
    }
    if (transferRequest.status !== "pending") {
      return NextResponse.json({ error: h.apiNotPending }, { status: 400 });
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
      return NextResponse.json({ error: h.apiInvalidReceipt }, { status: 400 });
    }
    const message = error instanceof Error ? error.message : h.receiptFailed;
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
