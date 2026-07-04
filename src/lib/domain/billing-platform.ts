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
    return "Subscriptions on the Android app will use Google Play Billing soon. For now, subscribe from the Zigo website in your browser.";
  }
  return "Android uygulamasında abonelik yakında Google Play üzerinden açılacak. Şimdilik tarayıcıdan zigo web sitesinden abone olabilirsiniz.";
}
