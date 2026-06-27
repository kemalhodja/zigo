import { jsonSuccess } from "@/features/shared";
import { withAdminApiHandler } from "@/features/shared/api/rbac";
import { reviewBankTransferRequest } from "@/lib/domain/bank-transfer";

export const PATCH = withAdminApiHandler(async (request, _context, auth) => {
  const body = await request.json();
  const updated = await reviewBankTransferRequest(auth.supabase, body);
  return jsonSuccess(updated);
}, { fallbackMessage: "Havale talebi güncellenemedi." });
