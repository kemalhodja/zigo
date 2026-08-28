import { NativePurchases, type Product, type Transaction } from "@capgo/native-purchases";

export const PRODUCT_IDS = {
  MONTHLY: "zigo_plus_monthly",
  YEARLY: "zigo_plus_yearly",
};

export class BillingService {
  /**
   * Initializes the NativePurchases plugin.
   * Useful to call on app startup.
   */
  static async initializeBilling(): Promise<void> {
    try {
      console.log("BillingService initialized.");
      // In @capgo/native-purchases, initialization might be implicit, but restoring purchases or setting up listeners might be needed.
    } catch (error) {
      console.error("Failed to initialize billing:", error);
    }
  }

  /**
   * Fetches the subscription products from Google Play/App Store.
   */
  static async fetchProducts(): Promise<Product[]> {
    try {
      const response = await NativePurchases.getProducts({
        productIdentifiers: [PRODUCT_IDS.MONTHLY, PRODUCT_IDS.YEARLY],
      });
      return response.products;
    } catch (error) {
      console.error("Failed to fetch products:", error);
      throw new Error("Abonelik paketleri yüklenemedi.");
    }
  }

  /**
   * Triggers the native purchase flow for a given product ID.
   * @param productId The ID of the product to purchase.
   * @returns The transaction details if successful.
   */
  static async purchaseSubscription(productId: string): Promise<Transaction> {
    try {
      const transaction = await NativePurchases.purchaseProduct({
        productIdentifier: productId,
      });
      
      if (!transaction || (!transaction.transactionId && !transaction.purchaseToken)) {
        throw new Error("Satın alma işlemi tamamlanamadı veya iptal edildi.");
      }
      
      return transaction;
    } catch (error: any) {
      console.error("Failed to purchase product:", error);
      throw new Error(error?.message || "Satın alma sırasında bir hata oluştu.");
    }
  }

  /**
   * Verifies the purchase with our backend.
   * @param purchaseToken The purchase token from the transaction (on Android).
   * @param productId The product ID that was purchased.
   */
  static async verifyPurchase(purchaseToken: string, productId: string): Promise<boolean> {
    try {
      const response = await fetch("/api/subscriptions/verify", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          receipt: purchaseToken,
          productId: productId,
        }),
      });

      const data = await response.json();
      
      if (!response.ok || !data.success) {
        console.error("Backend verification failed:", data);
        return false;
      }
      
      return true;
    } catch (error) {
      console.error("Failed to verify purchase:", error);
      return false;
    }
  }
}
