export type GooglePlayPurchaseResult = {
  productId: string;
  planId: string;
  purchaseToken: string;
  orderId?: string | null;
  packageName?: string | null;
};

type GooglePlayBridge = {
  purchaseSubscription?: (payload: { productId: string; planId: string; offerToken?: string }) => Promise<GooglePlayPurchaseResult>;
  getProducts?: (payload: { productIds: string[] }) => Promise<{ products?: Array<{ productId?: string }> }>;
};

function getZigoPlayBillingPlugin(): GooglePlayBridge | null {
  if (typeof window === "undefined") return null;

  const anyWindow = window as typeof window & {
    Capacitor?: {
      isNativePlatform?: () => boolean;
      Plugins?: Record<string, GooglePlayBridge>;
    };
    ZigoPlayBilling?: GooglePlayBridge;
  };

  const capacitorPlugin = anyWindow.Capacitor?.Plugins?.ZigoPlayBilling;
  if (capacitorPlugin) return capacitorPlugin;

  if (anyWindow.ZigoPlayBilling) return anyWindow.ZigoPlayBilling;

  return null;
}

export async function purchaseGooglePlaySubscription({
  productId,
  planId,
  offerToken,
}: {
  productId: string;
  planId: string;
  offerToken?: string;
}): Promise<GooglePlayPurchaseResult> {
  const plugin = getZigoPlayBillingPlugin();
  if (plugin?.purchaseSubscription) {
    return plugin.purchaseSubscription({ productId, planId, offerToken });
  }

  throw new Error("Google Play Billing bridge is unavailable on this device.");
}
