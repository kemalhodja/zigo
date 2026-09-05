import { registerPlugin } from "@capacitor/core";

export type GooglePlayPurchaseResult = {
  productId: string;
  planId: string;
  purchaseToken: string;
  orderId?: string | null;
  packageName?: string | null;
};

export type GooglePlayBridge = {
  purchaseSubscription: (payload: { productId: string; planId: string; offerToken?: string }) => Promise<GooglePlayPurchaseResult>;
  getProducts?: (payload: { productIds: string[] }) => Promise<{ products?: Array<{ productId?: string }> }>;
  restorePurchases?: () => Promise<{ purchases?: GooglePlayPurchaseResult[] }>;
  openSubscriptionsPage?: () => Promise<void>;
  openPlayStoreApp?: () => Promise<void>;
};

type WindowWithCapacitor = typeof window & {
  Capacitor?: {
    isNativePlatform?: () => boolean;
    getPlatform?: () => string;
    Plugins?: {
      ZigoPlayBilling?: GooglePlayBridge;
      NativePurchases?: {
        purchaseProduct?: (payload: { productIdentifier: string; planIdentifier?: string }) => Promise<{
          transactionId?: string;
          purchaseToken?: string;
          productIdentifier?: string;
          receipt?: string;
        }>;
      };
      [key: string]: unknown;
    };
  };
  ZigoPlayBilling?: GooglePlayBridge;
};

// Official Capacitor plugin proxy registered via Capacitor core
export const NativeZigoPlayBilling = registerPlugin<GooglePlayBridge>("ZigoPlayBilling", {
  web: () => ({
    purchaseSubscription: async () => {
      throw new Error("Google Play Billing bridge is unavailable on this device.");
    },
    getProducts: async () => ({ products: [] }),
    restorePurchases: async () => ({ purchases: [] }),
    openSubscriptionsPage: async () => {
      if (typeof window !== "undefined") {
        window.open("https://play.google.com/store/account/subscriptions", "_blank", "noopener,noreferrer");
      }
    },
    openPlayStoreApp: async () => {
      if (typeof window !== "undefined") {
        window.open("https://play.google.com/store/apps/details?id=com.zigo.education", "_blank", "noopener,noreferrer");
      }
    },
  }),
});

export function isGooglePlayBillingAvailable(): boolean {
  if (typeof window === "undefined") return false;

  const win = window as WindowWithCapacitor;
  if (win.Capacitor?.isNativePlatform?.() && win.Capacitor?.getPlatform?.() === "android") return true;
  if (win.ZigoPlayBilling?.purchaseSubscription) return true;
  if (win.Capacitor?.Plugins?.ZigoPlayBilling?.purchaseSubscription) return true;
  if (win.Capacitor?.Plugins?.NativePurchases?.purchaseProduct) return true;

  return false;
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
  // 1. Primary: Use registered Capacitor plugin NativeZigoPlayBilling
  try {
    if (NativeZigoPlayBilling?.purchaseSubscription) {
      const result = await NativeZigoPlayBilling.purchaseSubscription({ productId, planId, offerToken });
      if (result?.purchaseToken) {
        return {
          ...result,
          packageName: result.packageName || "com.zigo.education",
        };
      }
    }
  } catch (nativeErr) {
    const msg = nativeErr instanceof Error ? nativeErr.message : String(nativeErr);
    // If it's a real native rejection (e.g. from Google Play billing flow or user cancel), throw it directly
    if (!msg.toLowerCase().includes("not implemented") && !msg.toLowerCase().includes("unavailable on this device")) {
      throw nativeErr;
    }
  }

  // 2. Fallback: Window attached plugin
  if (typeof window !== "undefined") {
    const win = window as WindowWithCapacitor;
    const directPlugin = win.Capacitor?.Plugins?.ZigoPlayBilling || win.ZigoPlayBilling;
    if (directPlugin?.purchaseSubscription) {
      const result = await directPlugin.purchaseSubscription({ productId, planId, offerToken });
      return {
        ...result,
        packageName: result.packageName || "com.zigo.education",
      };
    }

    // 3. Fallback: NativePurchases (@capgo/native-purchases)
    const nativePurchases = win.Capacitor?.Plugins?.NativePurchases;
    if (nativePurchases?.purchaseProduct) {
      const tx = await nativePurchases.purchaseProduct({
        productIdentifier: productId,
        planIdentifier: planId,
      });
      const token = tx.purchaseToken || tx.receipt || tx.transactionId || "";
      if (token) {
        return {
          productId: tx.productIdentifier || productId,
          planId,
          purchaseToken: token,
          orderId: tx.transactionId || null,
          packageName: "com.zigo.education",
        };
      }
    }
  }

  throw new Error("Google Play Billing bridge is unavailable on this device.");
}

export async function restoreGooglePlayPurchases(): Promise<GooglePlayPurchaseResult[]> {
  try {
    if (NativeZigoPlayBilling?.restorePurchases) {
      const result = await NativeZigoPlayBilling.restorePurchases();
      return result?.purchases ?? [];
    }
  } catch {
    // Ignore and fallback
  }

  if (typeof window !== "undefined") {
    const win = window as WindowWithCapacitor;
    const directPlugin = win.Capacitor?.Plugins?.ZigoPlayBilling || win.ZigoPlayBilling;
    if (directPlugin?.restorePurchases) {
      const result = await directPlugin.restorePurchases();
      return result?.purchases ?? [];
    }
  }

  return [];
}

export async function openGooglePlaySubscriptionsPage(): Promise<void> {
  try {
    if (NativeZigoPlayBilling?.openSubscriptionsPage) {
      await NativeZigoPlayBilling.openSubscriptionsPage();
      return;
    }
  } catch {
    // fallback
  }
  if (typeof window !== "undefined") {
    window.open("https://play.google.com/store/account/subscriptions?package=com.zigo.education", "_blank", "noopener,noreferrer");
  }
}

