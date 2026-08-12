// src/lib/server/google-play.ts

/**
 * Verify a Google Play subscription purchase.
 *
 * @param receiptToken The purchase token returned by Google Play after a successful purchase.
 * @param productId    The subscription product ID (e.g., "zigo_plus").
 * @param packageName  The Android package name of the app (e.g., "com.zigo.app").
 * @returns The purchase object from Google Play if valid.
 */
export async function verifyGooglePlaySubscription(
  receiptToken: string,
  productId: string,
  packageName: string,
) {
  const serviceAccountJson = process.env.GOOGLE_PLAY_SERVICE_ACCOUNT;
  if (!serviceAccountJson) {
    throw new Error("Google Play service account credentials not set");
  }

  try {
    const pkgName = "googleapis";
    const googleapis = await import(/* webpackIgnore: true */ pkgName).catch(() => null);
    if (googleapis?.google) {
      const credentials = JSON.parse(serviceAccountJson);
      const auth = new googleapis.google.auth.GoogleAuth({
        credentials,
        scopes: ["https://www.googleapis.com/auth/androidpublisher"],
      });
      const androidpublisher = googleapis.google.androidpublisher({ version: "v3", auth });
      const response = await androidpublisher.purchases.subscriptions.get({
        packageName,
        subscriptionId: productId,
        token: receiptToken,
      });
      return response.data;
    }
  } catch (err: unknown) {
    const errorMsg = (err as Error)?.message || "Bilinmeyen hata";
    throw new Error(`Google Play API doğrulama hatası: ${errorMsg}`);
  }

  throw new Error("Google Play SDK yüklenemedi veya doğrulama başarısız.");
}

