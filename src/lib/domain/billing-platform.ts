const ANDROID_NATIVE_UA = /Capacitor|TWA|wv|ZigoApp/i;

export function isAndroidCapacitorUserAgent(userAgent: string | null | undefined) {
  if (!userAgent?.trim()) return false;
  return /Android/i.test(userAgent) && ANDROID_NATIVE_UA.test(userAgent);
}

export function isWebCheckoutAllowedForRequest(_request: Request) {
  return true;
}

export function getBillingPlatformMessage(locale: "tr" | "en" = "tr") {
  if (locale === "en") {
    return "Google Play Billing is active on the Android app. Select a plan to purchase.";
  }
  return "Android uygulamasında Google Play ile ödeme aktif edilmiştir. Planınızı seçerek satın alabilirsiniz.";
}
