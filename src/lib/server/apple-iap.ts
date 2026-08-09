// src/lib/server/apple-iap.ts

/**
 * Verify an Apple App Store purchase receipt.
 *
 * @param receiptData Base64 encoded receipt string returned by StoreKit/Capacitor.
 * @returns Object containing the verified expiryTime string.
 */
export async function verifyAppleSubscription(receiptData: string): Promise<{ expiryTime: string }> {
  const sharedSecret = process.env.APPLE_IAP_SHARED_SECRET;

  async function queryApple(url: string) {
    const response = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        "receipt-data": receiptData,
        password: sharedSecret || undefined,
      }),
    });
    return response.json() as Promise<{
      status: number;
      latest_receipt_info?: Array<{ expires_date_ms: string }>;
    }>;
  }

  let result = await queryApple("https://buy.itunes.apple.com/verifyReceipt");

  // Status 21007: sandbox receipt sent to production environment, fallback to sandbox
  if (result.status === 21007) {
    result = await queryApple("https://sandbox.itunes.apple.com/verifyReceipt");
  }

  if (result.status !== 0 || !result.latest_receipt_info || result.latest_receipt_info.length === 0) {
    throw new Error(`Apple IAP verification failed with status: ${result.status}`);
  }

  const latestInfo = result.latest_receipt_info[result.latest_receipt_info.length - 1];
  if (!latestInfo?.expires_date_ms) {
    throw new Error("Apple IAP receipt does not contain subscription expiration date.");
  }

  return {
    expiryTime: new Date(Number(latestInfo.expires_date_ms)).toISOString(),
  };
}
