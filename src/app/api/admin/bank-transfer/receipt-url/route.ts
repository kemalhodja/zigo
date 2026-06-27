import { z } from "zod";

import { jsonNotFound, jsonSuccess } from "@/features/shared";
import { withAdminApiHandler } from "@/features/shared/api/rbac";
import { getBankTransferRequestById } from "@/lib/domain/bank-transfer";

const querySchema = z.object({
  requestId: z.string().uuid(),
});

export const GET = withAdminApiHandler(async (request, _context, auth) => {
  const { searchParams } = new URL(request.url);
  const parsed = querySchema.parse({
    requestId: searchParams.get("requestId"),
  });

  const transferRequest = await getBankTransferRequestById(auth.supabase, parsed.requestId);
  if (!transferRequest.receipt_storage_path) {
    return jsonNotFound("Bu talep için dekont yüklenmemiş.");
  }

  const { data, error } = await auth.supabase.storage
    .from("billing-receipts")
    .createSignedUrl(transferRequest.receipt_storage_path, 60 * 10);

  if (error || !data?.signedUrl) {
    throw new Error(error?.message ?? "Dekont bağlantısı oluşturulamadı.");
  }

  return jsonSuccess({ url: data.signedUrl });
}, { fallbackMessage: "Dekont bağlantısı oluşturulamadı." });
