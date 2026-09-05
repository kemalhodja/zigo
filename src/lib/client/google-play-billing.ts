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
  restorePurchases?: () => Promise<{ purchases?: GooglePlayPurchaseResult[] }>;
};

type NativePurchasesBridge = {
  purchaseProduct?: (payload: { productIdentifier: string; planIdentifier?: string }) => Promise<{
    transactionId?: string;
    purchaseToken?: string;
    productIdentifier?: string;
    receipt?: string;
  }>;
  restorePurchases?: () => Promise<unknown>;
};

type WindowWithCapacitor = typeof window & {
  Capacitor?: {
    isNativePlatform?: () => boolean;
    getPlatform?: () => string;
    Plugins?: {
      ZigoPlayBilling?: GooglePlayBridge;
      NativePurchases?: NativePurchasesBridge;
      [key: string]: unknown;
    };
  };
  ZigoPlayBilling?: GooglePlayBridge;
};

export function isGooglePlayBillingAvailable(): boolean {
  if (typeof window === "undefined") return false;

  const win = window as WindowWithCapacitor;
  if (win.ZigoPlayBilling?.purchaseSubscription) return true;
  if (win.Capacitor?.Plugins?.ZigoPlayBilling?.purchaseSubscription) return true;
  if (win.Capacitor?.Plugins?.NativePurchases?.purchaseProduct) return true;

  return false;
}

function getZigoPlayBillingPlugin(): GooglePlayBridge | null {
  if (typeof window === "undefined") return null;

  const win = window as WindowWithCapacitor;

  const capacitorPlugin = win.Capacitor?.Plugins?.ZigoPlayBilling;
  if (capacitorPlugin) return capacitorPlugin;

  if (win.ZigoPlayBilling) return win.ZigoPlayBilling;

  // Fallback bridge wrapping NativePurchases if available
  const nativePurchases = win.Capacitor?.Plugins?.NativePurchases;
  if (nativePurchases?.purchaseProduct) {
    return {
      purchaseSubscription: async ({ productId, planId }) => {
        const tx = await nativePurchases.purchaseProduct!({
          productIdentifier: productId,
          planIdentifier: planId,
        });
        const token = tx.purchaseToken || tx.receipt || tx.transactionId || "";
        if (!token) {
          throw new Error("Native purchases: purchaseToken not returned");
        }
        return {
          productId: tx.productIdentifier || productId,
          planId,
          purchaseToken: token,
          orderId: tx.transactionId || null,
          packageName: "com.zigo.education",
        };
      },
    };
  }

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
    const result = await plugin.purchaseSubscription({ productId, planId, offerToken });
    return {
      ...result,
      packageName: result.packageName || "com.zigo.education",
    };
  }

  throw new Error("Google Play Billing bridge is unavailable on this device.");
}

export async function restoreGooglePlayPurchases(): Promise<GooglePlayPurchaseResult[]> {
  const plugin = getZigoPlayBillingPlugin();
  if (plugin?.restorePurchases) {
    const result = await plugin.restorePurchases();
    return result?.purchases ?? [];
  }
  return [];
}
