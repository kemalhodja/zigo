import { hasStripeConfigured } from "@/lib/domain/billing";
import { getBillingPlatformMessage, isWebCheckoutAllowedForRequest } from "@/lib/domain/billing-platform";
import { getServerLocale } from "@/lib/i18n/server";

export async function GET(request: Request) {
  const webCheckout = isWebCheckoutAllowedForRequest(request);
  const locale = await getServerLocale();

  return Response.json({
    data: {
      webCheckout,
      playStoreBilling: !webCheckout,
      stripeConfigured: hasStripeConfigured(),
      message: webCheckout ? null : getBillingPlatformMessage(locale),
    },
  });
}
