const ANDROID_CAPACITOR_UA = /Capacitor/i;

export function isAndroidCapacitorUserAgent(userAgent: string | null | undefined) {
  if (!userAgent?.trim()) return false;
  return /Android/i.test(userAgent) && ANDROID_CAPACITOR_UA.test(userAgent);
}

export function isWebCheckoutAllowedForRequest(request: Request) {
  if (process.env.ZIGO_ALLOW_WEB_CHECKOUT_ON_ANDROID === "true") {
    return true;
  }
  return !isAndroidCapacitorUserAgent(request.headers.get("user-agent"));
}

export function getBillingPlatformMessage(locale: "tr" | "en" = "tr") {
  if (locale === "en") {
    return "Google Play Billing is active on the Android app. Select a plan to purchase.";
  }
  return "Android uygulamasında Google Play ile ödeme aktif edilmiştir. Planınızı seçerek satın alabilirsiniz.";
}
