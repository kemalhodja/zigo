/**
 * React Native (react-native-iap) & Expo (expo-in-app-purchases) & Capacitor In-App Purchases Integration Service
 */

export const IAP_PRODUCT_IDS = {
  ZIGO_PLUS: "zigo_plus",
  STUDENT_MONTHLY: "zigo_student_plus_monthly",
  STUDENT_YEARLY: "zigo_student_plus_yearly",
  PARENT_MONTHLY: "zigo_parent_plus_monthly",
  TEACHER_MONTHLY: "zigo_teacher_plus_monthly",
  TEACHER_YEARLY: "zigo_teacher_plus_yearly",
} as const;

export type MobilePurchasePayload = {
  planId: string;
  platform: "android" | "ios";
  productId: string;
  purchaseToken?: string; // Google Play Purchase Token or App Store Receipt
  orderId?: string;
  packageName?: string;
};

/**
 * Sends validated Google Play purchase token to Zigo backend
 */
export async function verifyGooglePlayPurchase(payload: {
  planId?: string;
  productId?: string;
  purchaseToken: string;
  orderId?: string;
  packageName?: string;
}) {
  try {
    const response = await fetch("/api/billing/google-play", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        planId: payload.planId ?? "zigo-plus-student-montly",
        productId: payload.productId ?? IAP_PRODUCT_IDS.ZIGO_PLUS,
        purchaseToken: payload.purchaseToken,
        orderId: payload.orderId ?? null,
        packageName: payload.packageName ?? "com.zigo.app",
      }),
    });

    const data = await response.json().catch(() => ({}));

    if (!response.ok) {
      throw new Error(data.error || "Google Play satın alma doğrulaması başarısız.");
    }

    return {
      success: true,
      data: data.data,
      message: "Tebrikler! Google Play aboneliğiniz ve 30 günlük denemeniz başarıyla aktifleştirildi.",
    };
  } catch (err) {
    return {
      success: false,
      error: err instanceof Error ? err.message : "Bağlantı hatası",
    };
  }
}

/**
 * Sends validated In-App Purchase token from React Native / Expo to Zigo backend
 */
export async function verifyMobileInAppPurchase(payload: MobilePurchasePayload) {
  try {
    const response = await fetch("/api/billing/mobile-verify", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    const data = await response.json().catch(() => ({}));

    if (!response.ok) {
      throw new Error(data.error || "Mobil satın alma doğrulanamadı.");
    }

    return {
      success: true,
      subscription: data.subscription,
      message: "Tebrikler! Mobil aboneliğiniz başarıyla aktifleştirildi.",
    };
  } catch (err) {
    return {
      success: false,
      error: err instanceof Error ? err.message : "Bağlantı hatası",
    };
  }
}

/**
 * Code Snippet Reference for React Native (react-native-iap) Integration:
 * 
 * import RNIap, { purchaseUpdatedListener, finishTransaction } from 'react-native-iap';
 * 
 * const itemSkus = Platform.select({
 *   ios: ['zigo_student_plus_monthly', 'zigo_teacher_plus_monthly'],
 *   android: ['zigo_student_plus_monthly', 'zigo_teacher_plus_monthly']
 * });
 * 
 * export const setupIAPListeners = () => {
 *   purchaseUpdatedListener(async (purchase) => {
 *     const receipt = purchase.transactionReceipt || purchase.purchaseToken;
 *     if (receipt) {
 *       const res = await verifyMobileInAppPurchase({
 *         planId: purchase.productId,
 *         platform: Platform.OS === 'ios' ? 'ios' : 'android',
 *         productId: purchase.productId,
 *         purchaseToken: purchase.purchaseToken,
 *         orderId: purchase.transactionId,
 *       });
 *       if (res.success) {
 *         await finishTransaction({ purchase, isConsumable: false });
 *       }
 *     }
 *   });
 * };
 */
