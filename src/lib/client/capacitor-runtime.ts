type CapacitorWindow = Window & {
  Capacitor?: {
    getPlatform?: () => string;
    isNativePlatform?: () => boolean;
  };
};

export function isCapacitorClient(): boolean {
  if (typeof window === "undefined") return false;

  const capacitor = (window as CapacitorWindow).Capacitor;
  if (capacitor?.isNativePlatform?.()) {
    return true;
  }
  if (capacitor?.getPlatform?.() && capacitor.getPlatform() !== "web") {
    return true;
  }

  return /Capacitor/i.test(navigator.userAgent);
}

export function isCapacitorAndroidClient(): boolean {
  if (typeof window === "undefined") return false;

  const capacitor = (window as CapacitorWindow).Capacitor;
  if (capacitor?.getPlatform?.() === "android") {
    return true;
  }

  if (capacitor?.isNativePlatform?.() && /Android/i.test(navigator.userAgent)) {
    return true;
  }

  // Explicit testing query param (?android=1)
  if (new URLSearchParams(window.location.search).has("android")) {
    return true;
  }

  // Android WebView (wv), Capacitor, TWA or custom ZigoApp user agent
  return /Android/i.test(navigator.userAgent) && /Capacitor|TWA|wv|ZigoApp/i.test(navigator.userAgent);
}
