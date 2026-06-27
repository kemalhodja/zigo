import { jsonSuccess } from "@/features/shared";
import { withAdminApiHandler } from "@/features/shared/api/rbac";
import {
  ensureStripeCampaignCoupon,
  getStripeCampaignProvisionStatus,
} from "@/lib/domain/stripe-campaign-provision";

export const GET = withAdminApiHandler(async () => {
  return jsonSuccess(getStripeCampaignProvisionStatus());
});

export const POST = withAdminApiHandler(async () => {
  const result = await ensureStripeCampaignCoupon();
  return jsonSuccess({
    ...result,
    status: getStripeCampaignProvisionStatus(),
  });
}, { fallbackMessage: "Stripe kampanya kuponu oluşturulamadı." });
