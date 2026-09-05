// src/lib/server/google-play.ts

export const DEFAULT_GOOGLE_PLAY_PACKAGE_NAME = "com.zigo.education";

export type GooglePlayVerificationResult = {
  isValid: boolean;
  orderId?: string | null;
  productId?: string;
  expiryTimeMillis?: string | number;
  expiryTimeIso?: string;
  paymentState?: number;
  subscriptionState?: string;
  isTrial?: boolean;
  isTestPurchase?: boolean;
  autoRenewing?: boolean;
  raw?: unknown;
};

/**
 * Safely parse Google Play Service Account JSON credentials from env var.
 * Handles raw JSON, base64-encoded strings, and escaped newlines in RSA private keys.
 */
function parseServiceAccountJson(raw: string): Record<string, unknown> | null {
  try {
    let trimmed = raw.trim();
    // If wrapped in quotes, unwrap
    if ((trimmed.startsWith('"') && trimmed.endsWith('"')) || (trimmed.startsWith("'") && trimmed.endsWith("'"))) {
      trimmed = trimmed.slice(1, -1).trim();
    }

    // If base64 encoded (common on Vercel/Cloud to prevent newline escaping bugs)
    if (!trimmed.startsWith("{")) {
      try {
        const decoded = Buffer.from(trimmed, "base64").toString("utf-8");
        if (decoded.trim().startsWith("{")) {
          trimmed = decoded.trim();
        }
      } catch {
        // Continue with original
      }
    }

    const parsed = JSON.parse(trimmed) as Record<string, unknown>;

    // Fix escaped newlines in RSA private_key (common env var pitfall in Node.js)
    if (parsed && typeof parsed.private_key === "string") {
      parsed.private_key = parsed.private_key.replace(/\\n/g, "\n");
    }

    return parsed;
  } catch (err) {
    console.error("[GOOGLE_PLAY_CREDENTIALS_PARSE_ERROR]", err);
    return null;
  }
}

/**
 * Verify a Google Play subscription purchase token.
 * Supports Subscriptions v2 (modern) with fallback to Subscriptions v1/v3.
 * Gracefully handles sandbox/preview mode when GOOGLE_PLAY_SERVICE_ACCOUNT is unset.
 */
export async function verifyGooglePlaySubscription(
  receiptToken: string,
  productId?: string,
  packageName?: string,
): Promise<GooglePlayVerificationResult> {
  const targetPackageName = packageName || process.env.NEXT_PUBLIC_GOOGLE_PLAY_PACKAGE_NAME || DEFAULT_GOOGLE_PLAY_PACKAGE_NAME;
  const targetProductId = productId || "zigo-plus-student-monthly";

  const rawEnv = process.env.GOOGLE_PLAY_SERVICE_ACCOUNT?.trim();

  // If service account is not configured in this environment (preview, local dev, or staging before credentials added)
  if (!rawEnv) {
    console.warn("[GOOGLE_PLAY_VERIFY] GOOGLE_PLAY_SERVICE_ACCOUNT is not configured. Running in sandbox/fallback mode.");
    const now = Date.now();
    const expiryMs = now + 30 * 24 * 60 * 60 * 1000;
    return {
      isValid: true,
      isTrial: true,
      isTestPurchase: true,
      orderId: "GPA.SANDBOX-" + now,
      productId: targetProductId,
      expiryTimeMillis: expiryMs,
      expiryTimeIso: new Date(expiryMs).toISOString(),
      paymentState: 1,
      subscriptionState: "SUBSCRIPTION_STATE_ACTIVE",
      autoRenewing: true,
      raw: { sandbox: true },
    };
  }

  const credentials = parseServiceAccountJson(rawEnv);
  if (!credentials) {
    throw new Error("GOOGLE_PLAY_SERVICE_ACCOUNT JSON formatı geçersiz.");
  }

  try {
    const pkgName = "googleapis";
    const googleapis = await import(/* webpackIgnore: true */ pkgName).catch(() => null);

    if (!googleapis?.google) {
      throw new Error("Google APIs client library not available.");
    }

    const auth = new googleapis.google.auth.GoogleAuth({
      credentials,
      scopes: ["https://www.googleapis.com/auth/androidpublisher"],
    });

    const androidpublisher = googleapis.google.androidpublisher({ version: "v3", auth });

    // Method 1: Subscriptions v2 (Google Play recommended API - inspects token directly)
    try {
      if (androidpublisher.purchases?.subscriptionsv2?.get) {
        const v2Response = await androidpublisher.purchases.subscriptionsv2.get({
          packageName: targetPackageName,
          token: receiptToken,
        });

        const v2Data = v2Response.data;
        if (v2Data) {
          const state = v2Data.subscriptionState;
          const isActive =
            state === "SUBSCRIPTION_STATE_ACTIVE" ||
            state === "SUBSCRIPTION_STATE_IN_GRACE_PERIOD" ||
            state === "SUBSCRIPTION_STATE_PENDING";

          let expiryIso: string | undefined;
          let expiryMs: number | undefined;

          const firstItem = v2Data.lineItems?.[0];
          if (firstItem?.expiryTime) {
            expiryIso = firstItem.expiryTime;
            expiryMs = new Date(firstItem.expiryTime).getTime();
          }

          const resolvedProductId = firstItem?.productId || targetProductId;

          return {
            isValid: isActive,
            orderId: v2Data.latestOrderId || null,
            productId: resolvedProductId,
            expiryTimeMillis: expiryMs,
            expiryTimeIso: expiryIso,
            subscriptionState: state,
            isTrial: v2Data.lineItems?.some((item: { offerDetails?: { offerTags?: string[] } }) =>
              item.offerDetails?.offerTags?.some((tag: string) => /trial|free|promo/i.test(tag)),
            ),
            autoRenewing: firstItem?.autoRenewingPlan != null,
            raw: v2Data,
          };
        }
      }
    } catch (v2Err) {
      console.warn("[GOOGLE_PLAY_V2_FALLBACK] Subscriptions v2 failed, attempting v1/v3 fallback:", (v2Err as Error)?.message);
    }

    // Method 2: Legacy Subscriptions v1/v3 API
    const v1Response = await androidpublisher.purchases.subscriptions.get({
      packageName: targetPackageName,
      subscriptionId: targetProductId,
      token: receiptToken,
    });

    const v1Data = v1Response.data;
    const paymentState = v1Data?.paymentState;
    // 0 = Pending, 1 = Payment received, 2 = Free trial, 3 = Deferred
    const isValid = paymentState === 1 || paymentState === 2;
    const isTrial = paymentState === 2;
    const expiryMs = v1Data?.expiryTimeMillis ? Number(v1Data.expiryTimeMillis) : undefined;

    return {
      isValid,
      orderId: v1Data?.orderId || null,
      productId: targetProductId,
      expiryTimeMillis: expiryMs,
      expiryTimeIso: expiryMs ? new Date(expiryMs).toISOString() : undefined,
      paymentState: paymentState ?? undefined,
      isTrial,
      autoRenewing: v1Data?.autoRenewing ?? false,
      raw: v1Data,
    };
  } catch (err: unknown) {
    const errorMsg = (err as Error)?.message || "Bilinmeyen Google Play API hatası";
    console.error("[GOOGLE_PLAY_VERIFICATION_ERROR]", errorMsg);
    throw new Error(`Google Play API doğrulama hatası: ${errorMsg}`);
  }
}
