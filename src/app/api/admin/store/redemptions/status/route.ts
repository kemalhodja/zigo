import { jsonSuccess } from "@/features/shared";
import { withAdminApiHandler } from "@/features/shared/api/rbac";
import { updateStoreRedemptionStatus } from "@/lib/domain/admin";

export const PATCH = withAdminApiHandler(async (request, _context, auth) => {
  const body = await request.json();
  const redemption = await updateStoreRedemptionStatus(auth.supabase, {
    redemptionId: body.redemptionId,
    status: body.status,
  });

  return jsonSuccess(redemption);
}, { fallbackMessage: "Redemption status could not be updated." });
