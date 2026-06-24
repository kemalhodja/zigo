import { hasStripeConfigured } from "@/lib/domain/billing";
import { getBillingPlatformMessage, isWebCheckoutAllowedForRequest } from "@/lib/domain/billing-platform";

export async function GET(request: Request) {
  const webCheckout = isWebCheckoutAllowedForRequest(request);

  return Response.json({
    data: {
      webCheckout,
      playStoreBilling: !webCheckout,
      stripeConfigured: hasStripeConfigured(),
      message: webCheckout ? null : getBillingPlatformMessage("tr"),
    },
  });
}
