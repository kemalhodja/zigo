export function isCapacitorAndroidClient() {
  if (typeof window === "undefined") return false;

  const capacitor = (window as Window & { Capacitor?: { getPlatform?: () => string } }).Capacitor;
  if (capacitor?.getPlatform?.() === "android") {
    return true;
  }

  return /Android/i.test(navigator.userAgent) && /Capacitor/i.test(navigator.userAgent);
}
