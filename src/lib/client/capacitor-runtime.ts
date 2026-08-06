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
  const isAndroidDevice = /Android/i.test(ua);
  const hasAndroidParam = new URLSearchParams(window.location.search).has("android");

  return isAndroidDevice || hasAndroidParam;
}
