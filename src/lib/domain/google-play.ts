/** Google Play Billing helpers — never trust client-only mock tokens. */

export const ZIGO_ANDROID_PACKAGE_NAME =
  process.env.GOOGLE_PLAY_PACKAGE_NAME?.trim() || "com.zigo.education";

/** Obvious fake tokens previously used by the broken Android checkout UI. */
export function isMockGooglePlayPurchaseToken(token: string) {
  const normalized = token.trim().toLowerCase();
  if (!normalized) return true;
  if (normalized.startsWith("gplay_token_")) return true;
  if (normalized.startsWith("mock_")) return true;
  if (normalized === "test" || normalized === "demo") return true;
  return false;
}

export function isAllowedGooglePlayPackageName(packageName: string) {
  return packageName.trim() === ZIGO_ANDROID_PACKAGE_NAME;
}

/**
 * Map Zigo plan ids to Play Console subscription product ids.
 * Override with GOOGLE_PLAY_PRODUCT_MAP JSON: {"student-monthly":"zigo_plus_student_monthly",...}
 */
export function resolveGooglePlayProductId(planId: string) {
  const configured = process.env.GOOGLE_PLAY_PRODUCT_MAP?.trim();
  if (configured) {
    try {
      const map = JSON.parse(configured) as Record<string, string>;
      const hit = map[planId]?.trim();
      if (hit) return hit;
    } catch {
      // fall through to default naming
    }
  }

  return `zigo_plus_${planId.replace(/-/g, "_")}`;
}

export type GooglePlayPurchasePayload = {
  planId: string;
  productId: string;
  purchaseToken: string;
  packageName: string;
  orderId?: string | null;
  expiryTime?: string | null;
};

export function assertGooglePlayPurchasePayload(payload: GooglePlayPurchasePayload) {
  if (isMockGooglePlayPurchaseToken(payload.purchaseToken)) {
    throw new Error("MOCK_PURCHASE_TOKEN");
  }
  if (!isAllowedGooglePlayPackageName(payload.packageName)) {
    throw new Error("INVALID_PACKAGE_NAME");
  }
  const expectedProductId = resolveGooglePlayProductId(payload.planId);
  if (payload.productId !== expectedProductId) {
    // Allow either exact map match or legacy zigo.plus.* only when explicitly enabled.
    const allowLegacy = process.env.ZIGO_ALLOW_LEGACY_PLAY_PRODUCT_IDS === "true";
    const legacy = `zigo.plus.${payload.planId}`;
    if (!(allowLegacy && payload.productId === legacy)) {
      throw new Error("PRODUCT_MISMATCH");
    }
  }
}

export function hasGooglePlayVerifierConfigured() {
  return Boolean(process.env.GOOGLE_PLAY_SERVICE_ACCOUNT_JSON?.trim());
}

/**
 * Verifies a subscription purchase with Google Play Developer API when credentials exist.
 * Without credentials, returns { ok:false, code:'VERIFIER_UNCONFIGURED' } — callers must fail closed.
 */
export async function verifyGooglePlaySubscription(params: {
  packageName: string;
  productId: string;
  purchaseToken: string;
}): Promise<{ ok: true; expiryTime: string | null } | { ok: false; code: string; detail?: string }> {
  const raw = process.env.GOOGLE_PLAY_SERVICE_ACCOUNT_JSON?.trim();
  if (!raw) {
    return { ok: false, code: "VERIFIER_UNCONFIGURED" };
  }

  let credentials: { client_email?: string; private_key?: string; token_uri?: string };
  try {
    credentials = JSON.parse(raw) as { client_email?: string; private_key?: string; token_uri?: string };
  } catch {
    return { ok: false, code: "VERIFIER_INVALID_JSON" };
  }

  if (!credentials.client_email || !credentials.private_key) {
    return { ok: false, code: "VERIFIER_INVALID_JSON" };
  }

  try {
    const accessToken = await getGoogleAccessToken(credentials);
    const url =
      `https://androidpublisher.googleapis.com/androidpublisher/v3/applications/` +
      `${encodeURIComponent(params.packageName)}/purchases/subscriptions/` +
      `${encodeURIComponent(params.productId)}/tokens/${encodeURIComponent(params.purchaseToken)}`;

    const response = await fetch(url, {
      headers: { Authorization: `Bearer ${accessToken}` },
    });
    const body = (await response.json().catch(() => ({}))) as {
      error?: { message?: string };
      expiryTimeMillis?: string;
      paymentState?: number;
      cancelReason?: number;
    };

    if (!response.ok) {
      return {
        ok: false,
        code: "GOOGLE_REJECTED",
        detail: body.error?.message ?? `HTTP ${response.status}`,
      };
    }

    // paymentState: 1 = received, 2 = free trial, 3 = pending deferred
    if (body.paymentState !== 1 && body.paymentState !== 2) {
      return { ok: false, code: "PAYMENT_NOT_RECEIVED", detail: `paymentState=${body.paymentState}` };
    }

    const expiryTime = body.expiryTimeMillis
      ? new Date(Number(body.expiryTimeMillis)).toISOString()
      : null;

    return { ok: true, expiryTime };
  } catch (error) {
    return {
      ok: false,
      code: "VERIFIER_ERROR",
      detail: error instanceof Error ? error.message : "unknown",
    };
  }
}

async function getGoogleAccessToken(credentials: {
  client_email?: string;
  private_key?: string;
  token_uri?: string;
}) {
  const now = Math.floor(Date.now() / 1000);
  const header = { alg: "RS256", typ: "JWT" };
  const claim = {
    iss: credentials.client_email,
    scope: "https://www.googleapis.com/auth/androidpublisher",
    aud: credentials.token_uri || "https://oauth2.googleapis.com/token",
    iat: now,
    exp: now + 3600,
  };

  const encode = (value: object) =>
    Buffer.from(JSON.stringify(value)).toString("base64url");

  const unsigned = `${encode(header)}.${encode(claim)}`;
  const crypto = await import("node:crypto");
  const signer = crypto.createSign("RSA-SHA256");
  signer.update(unsigned);
  signer.end();
  const signature = signer.sign(credentials.private_key!.replace(/\\n/g, "\n"), "base64url");
  const jwt = `${unsigned}.${signature}`;

  const tokenUri = credentials.token_uri || "https://oauth2.googleapis.com/token";
  const response = await fetch(tokenUri, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      grant_type: "urn:ietf:params:oauth:grant-type:jwt-bearer",
      assertion: jwt,
    }),
  });
  const payload = (await response.json()) as { access_token?: string; error?: string };
  if (!response.ok || !payload.access_token) {
    throw new Error(payload.error ?? "google_token_failed");
  }
  return payload.access_token;
}
