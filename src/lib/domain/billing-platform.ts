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
    return "Android subscriptions use Google Play Billing. Choose a plan — payment opens in Google Play and is verified on our servers before Zigo Plus activates.";
  }
  return "Android abonelikleri Google Play Billing ile alınır. Plan seçin; ödeme Google Play'de tamamlanır ve sunucuda doğrulanmadan Zigo Plus açılmaz.";
}
