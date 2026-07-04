import { NextResponse } from "next/server";
import { z } from "zod";

import { requirePlatformAdmin } from "@/lib/domain/admin-auth";
import { getBankTransferRequestById } from "@/lib/domain/bank-transfer";

const querySchema = z.object({
  requestId: z.string().uuid(),
});

export async function GET(request: Request) {
  try {
    const auth = await requirePlatformAdmin();
    if (auth.error) return auth.error;

    const { searchParams } = new URL(request.url);
    const parsed = querySchema.parse({
      requestId: searchParams.get("requestId"),
    });

    const transferRequest = await getBankTransferRequestById(auth.supabase, parsed.requestId);
    if (!transferRequest.receipt_storage_path) {
      return NextResponse.json({ error: "Bu talep için dekont yüklenmemiş." }, { status: 404 });
    }

    const { data, error } = await auth.supabase.storage
      .from("billing-receipts")
      .createSignedUrl(transferRequest.receipt_storage_path, 60 * 10);

    if (error || !data?.signedUrl) {
      return NextResponse.json({ error: error?.message ?? "Dekont bağlantısı oluşturulamadı." }, { status: 400 });
    }

    return NextResponse.json({ data: { url: data.signedUrl } });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: "Geçersiz talep." }, { status: 400 });
    }
    const message = error instanceof Error ? error.message : "Dekont bağlantısı oluşturulamadı.";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
