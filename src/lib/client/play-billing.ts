import { registerPlugin } from "@capacitor/core";

import { isCapacitorAndroidClient } from "@/lib/client/capacitor-runtime";
import { resolveGooglePlayProductId } from "@/lib/domain/google-play";

export type PlayBillingPurchase = {
  productId: string;
  planId: string;
  purchaseToken: string;
  orderId: string;
  packageName: string;
};

type ZigoPlayBillingPlugin = {
  purchaseSubscription(options: { productId: string; planId: string }): Promise<PlayBillingPurchase>;
  restorePurchases(): Promise<{ purchases: PlayBillingPurchase[] }>;
  getProducts(options: { productIds: string[] }): Promise<{
    products: Array<{ productId: string; title: string; description: string; formattedPrice: string }>;
  }>;
};

const PlayBilling = registerPlugin<ZigoPlayBillingPlugin>("ZigoPlayBilling");

export async function purchaseGooglePlaySubscription(planId: string): Promise<PlayBillingPurchase> {
  if (!isCapacitorAndroidClient()) {
    throw new Error("Google Play Billing yalnızca Android uygulamasında kullanılabilir.");
  }

  const productId = resolveGooglePlayProductId(planId);
  const result = await PlayBilling.purchaseSubscription({ productId, planId });

  if (!result?.purchaseToken?.trim()) {
    throw new Error("Google Play satın alma tamamlanamadı.");
  }

  return {
    productId: result.productId || productId,
    planId: result.planId || planId,
    purchaseToken: result.purchaseToken,
    orderId: result.orderId ?? "",
    packageName: result.packageName || "com.zigo.education",
  };
}
