type CapacitorWindow = Window & { Capacitor?: { getPlatform?: () => string } };

export function isCapacitorClient() {
  if (typeof window === "undefined") return false;

  const capacitor = (window as CapacitorWindow).Capacitor;
  if (capacitor?.getPlatform?.()) {
    return true;
  }

  return /Capacitor/i.test(navigator.userAgent);
}

export function isCapacitorAndroidClient() {
  if (typeof window === "undefined") return false;

  const capacitor = (window as CapacitorWindow).Capacitor;
  if (capacitor?.getPlatform?.() === "android") {
    return true;
  }

  const ua = navigator.userAgent || "";
  const isAndroid = /Android/i.test(ua);
  const isNativeApp =
    /Capacitor/i.test(ua) ||
    /TWA/i.test(ua) ||
    /wv/i.test(ua) ||
    /ZigoApp/i.test(ua) ||
    (typeof document !== "undefined" && document.referrer && document.referrer.startsWith("android-app://"));

  return isAndroid && (isNativeApp || (typeof window !== "undefined" && window.matchMedia?.("(display-mode: standalone)")?.matches));
}
