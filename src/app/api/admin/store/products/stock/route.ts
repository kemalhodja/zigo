import { jsonSuccess } from "@/features/shared";
import { withAdminApiHandler } from "@/features/shared/api/rbac";
import { updateStoreProductStock } from "@/lib/domain/admin";

export const PATCH = withAdminApiHandler(async (request, _context, auth) => {
  const body = await request.json();
  const product = await updateStoreProductStock(auth.supabase, {
    productId: body.productId,
    stockCount: body.stockCount,
  });

  return jsonSuccess(product);
}, { fallbackMessage: "Stock could not be updated." });
