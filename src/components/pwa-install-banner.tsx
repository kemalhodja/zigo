"use client";

import { Download, Monitor, MoreVertical, PlusSquare, Share, Smartphone, X } from "lucide-react";
import { useEffect, useRef, useState } from "react";

import { isCapacitorAndroidClient, isCapacitorClient } from "@/lib/client/capacitor-runtime";
import { isGooglePlayBillingAvailable } from "@/lib/client/google-play-billing";

type Platform = "ios" | "android" | "desktop" | null;

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
}

const DISMISS_KEY = "zigo_pwa_banner_dismissed_v3";
const DISMISS_TTL_MS = 24 * 60 * 60 * 1000; // 24 saat sonra tekrar hatırlat

function isDismissedRecently(): boolean {
  if (typeof window === "undefined") return false;
  try {
    const raw = localStorage.getItem(DISMISS_KEY);
    if (!raw) return false;
    const timestamp = Number(raw);
    if (!Number.isFinite(timestamp)) return false;
    return Date.now() - timestamp < DISMISS_TTL_MS;
  } catch {
    return false;
  }
}

function detectPlatform(): Platform {
  if (typeof window === "undefined") return null;

  // Native Android (Capacitor / WebView) uygulamasından giriliyorsa ASLA gösterme
  if (isCapacitorAndroidClient() || isCapacitorClient() || isGooglePlayBillingAvailable()) {
    return null;
  }

  const ua = navigator.userAgent;
  const win = window as unknown as { MSStream?: unknown };
  const nav = navigator as unknown as { standalone?: boolean };
  const isStandalone =
    Boolean(nav.standalone) ||
    window.matchMedia("(display-mode: standalone)").matches ||
    window.matchMedia("(display-mode: window-controls-overlay)").matches;

  // Zaten kısayol / PWA olarak açılmışsa gösterme
  if (isStandalone) return null;

  const isIos = /iPad|iPhone|iPod/.test(ua) && !win.MSStream;
  if (isIos) return "ios";

  const isAndroid = /android/i.test(ua);
  if (isAndroid) return "android";

  return "desktop";
}

export function PwaInstallBanner() {
  const [platform, setPlatform] = useState<Platform>(null);
  const [visible, setVisible] = useState(false);
  const [installing, setInstalling] = useState(false);
  const [hasNativePrompt, setHasNativePrompt] = useState(false);
  const [showManualGuide, setShowManualGuide] = useState(false);
  const deferredPrompt = useRef<BeforeInstallPromptEvent | null>(null);

  useEffect(() => {
    if (typeof window === "undefined") return;

    // Catch implicit-flow Supabase password recovery hash fragments (#access_token=...&type=recovery)
    // if Supabase redirected to site_url ("/") instead of "/auth/reset-password"
    const hash = window.location.hash || "";
    const pathname = window.location.pathname || "";
    if (
      hash &&
      (hash.includes("type=recovery") || hash.includes("error_code=otp_expired")) &&
      !pathname.startsWith("/auth/reset-password") &&
      !pathname.startsWith("/auth/recover")
    ) {
      window.location.replace(`/auth/reset-password${hash}`);
      return;
    }

    if (isDismissedRecently()) return;

    const p = detectPlatform();
    if (!p) return;

    setPlatform(p);

    const handleBeforeInstall = (e: Event) => {
      e.preventDefault();
      deferredPrompt.current = e as BeforeInstallPromptEvent;
      setHasNativePrompt(true);
      setVisible(true);
    };

    const handleAppInstalled = () => {
      deferredPrompt.current = null;
      setHasNativePrompt(false);
      setVisible(false);
      try {
        localStorage.setItem(DISMISS_KEY, String(Date.now() + 365 * 24 * 60 * 60 * 1000));
      } catch {
        // ignore
      }
    };

    window.addEventListener("beforeinstallprompt", handleBeforeInstall);
    window.addEventListener("appinstalled", handleAppInstalled);

    // Web'den giren tüm kullanıcılara (Android Chrome, iOS Safari, Masaüstü) 1.5 saniye içinde kısayol indirme uyarısını göster
    const t = setTimeout(() => {
      setVisible(true);
    }, 1500);

    return () => {
      clearTimeout(t);
      window.removeEventListener("beforeinstallprompt", handleBeforeInstall);
      window.removeEventListener("appinstalled", handleAppInstalled);
    };
  }, []);

  function handleDismiss() {
    if (typeof navigator !== "undefined" && navigator.vibrate) {
      navigator.vibrate(10);
    }
    setVisible(false);
    try {
      localStorage.setItem(DISMISS_KEY, String(Date.now()));
    } catch {
      // ignore
    }
  }

  async function handleInstall() {
    if (typeof navigator !== "undefined" && navigator.vibrate) {
      navigator.vibrate(15);
    }

    if (deferredPrompt.current) {
      setInstalling(true);
      try {
        await deferredPrompt.current.prompt();
        const { outcome } = await deferredPrompt.current.userChoice;
        if (outcome === "accepted") {
          deferredPrompt.current = null;
          setHasNativePrompt(false);
          handleDismiss();
        }
      } finally {
        setInstalling(false);
      }
      return;
    }

    // Tarayıcı henüz otomatik prompt vermediyse (veya desteklemiyorsa) adım adım kısayol rehberini aç
    setShowManualGuide(true);
  }

  if (!visible || !platform) return null;

  const isIos = platform === "ios";
  const isDesktop = platform === "desktop";

  return (
    <div
      role="dialog"
      aria-label="Zigo kısayolunu indir"
      className="fixed bottom-20 inset-x-3 z-[60] mx-auto max-w-sm sm:bottom-6 sm:right-6 sm:left-auto sm:mx-0"
    >
      <div className="relative overflow-hidden rounded-3xl border border-amber-400/30 bg-slate-950/95 shadow-2xl shadow-black/50 backdrop-blur-xl animate-in fade-in slide-in-from-bottom-6 duration-500">
        <div className="absolute inset-0 bg-gradient-to-br from-violet-600/15 via-transparent to-amber-500/15 pointer-events-none" />

        <div className="relative flex items-center justify-between gap-3 px-4 pt-4 pb-3">
          <div className="flex items-center gap-3">
            <div className="relative flex size-12 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-tr from-violet-600 via-purple-500 to-amber-500 text-white shadow-lg shadow-violet-500/30 font-black text-xl">
              Z
              <span className="absolute -bottom-1 -right-1 flex size-4 items-center justify-center rounded-full bg-emerald-500 text-white shadow ring-2 ring-slate-950">
                <Download className="size-2.5" strokeWidth={3} />
              </span>
            </div>
            <div>
              <div className="inline-flex items-center gap-1 rounded-full bg-amber-400/15 border border-amber-400/30 px-2 py-0.5 text-[10px] font-black uppercase tracking-wider text-amber-300 mb-0.5">
                <span>⚡ Hızlı Erişim Kısayolu</span>
              </div>
              <p className="text-sm font-black text-white leading-tight">
                {isDesktop ? "Zigo Kısayolunu Masaüstüne İndir" : "Zigo Kısayolunu Ana Ekrana İndir"}
              </p>
              <p className="text-[11px] font-medium text-slate-300 mt-0.5">
                {isIos
                  ? "Ana ekrana ekleyerek uygulama gibi tek tıkla aç"
                  : isDesktop
                    ? "Masaüstünden tek tıkla tam ekran uygulama olarak aç"
                    : "Ana ekrana kısayol ekle, anında aç"}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={handleDismiss}
            aria-label="Kapat"
            className="flex size-7 shrink-0 items-center justify-center rounded-full bg-white/10 text-slate-400 hover:bg-white/20 hover:text-white transition"
          >
            <X className="size-3.5" />
          </button>
        </div>

        <div className="mx-4 h-px bg-white/10" />

        <div className="relative px-4 py-3">
          {isIos ? (
            <div className="space-y-2">
              <p className="text-[10px] font-black uppercase tracking-wider text-amber-300 mb-2">
                Safari&apos;de 2 adımda kısayol indir
              </p>
              <div className="flex items-center gap-2.5 rounded-xl bg-white/[0.08] px-3 py-2">
                <span className="flex size-6 shrink-0 items-center justify-center rounded-full bg-violet-500/20 text-violet-300 font-black text-[10px]">
                  1
                </span>
                <span className="text-[11px] text-slate-200 leading-snug">
                  Alttaki <Share className="inline size-3.5 mx-0.5 text-sky-400" />{" "}
                  <strong className="text-white">Paylaş</strong> simgesine dokun
                </span>
              </div>
              <div className="flex items-center gap-2.5 rounded-xl bg-white/[0.08] px-3 py-2">
                <span className="flex size-6 shrink-0 items-center justify-center rounded-full bg-amber-500/20 text-amber-300 font-black text-[10px]">
                  2
                </span>
                <span className="text-[11px] text-slate-200 leading-snug">
                  <PlusSquare className="inline size-3.5 mx-0.5 text-amber-400" />{" "}
                  <strong className="text-white">Ana Ekrana Ekle</strong> seçeneğine dokun
                </span>
              </div>
              <button
                type="button"
                onClick={handleDismiss}
                className="tap-scale mt-1 w-full rounded-2xl bg-gradient-to-r from-amber-500 to-orange-500 py-2.5 text-center text-xs font-black text-slate-950 shadow-lg shadow-amber-500/25 hover:brightness-110 transition"
              >
                Tamam, Ekliyorum ✓
              </button>
            </div>
          ) : showManualGuide && !hasNativePrompt ? (
            <div className="space-y-2.5 animate-in fade-in duration-200">
              <p className="text-[10px] font-black uppercase tracking-wider text-amber-300">
                {isDesktop ? "Tarayıcıdan Kısayol İndirme:" : "Telefona Kısayol İndirme:"}
              </p>
              {isDesktop ? (
                <div className="space-y-2 text-[11px] text-slate-200">
                  <div className="flex items-start gap-2 rounded-xl bg-white/[0.08] px-3 py-2">
                    <Monitor className="size-4 shrink-0 text-amber-400 mt-0.5" />
                    <span>
                      Adres çubuğunun sağındaki <strong>&quot;Zigo uygulamasını yükle&quot; (⬇)</strong> simgesine veya tarayıcı menüsünden <strong>&quot;Yükle / Kısayol Oluştur&quot;</strong> seçeneğine tıklayın.
                    </span>
                  </div>
                </div>
              ) : (
                <div className="space-y-2 text-[11px] text-slate-200">
                  <div className="flex items-center gap-2 rounded-xl bg-white/[0.08] px-3 py-2">
                    <MoreVertical className="size-4 shrink-0 text-amber-400" />
                    <span>
                      Sağ üstteki <strong>üç nokta (⋮)</strong> menüsünden <strong>&quot;Uygulamayı yükle&quot;</strong> veya <strong>&quot;Ana ekrana ekle&quot;</strong> seçeneğine dokunun.
                    </span>
                  </div>
                </div>
              )}
              <button
                type="button"
                onClick={handleDismiss}
                className="tap-scale w-full rounded-2xl bg-gradient-to-r from-amber-500 to-orange-500 py-2.5 text-center text-xs font-black text-slate-950 shadow-lg transition hover:brightness-110"
              >
                Anladım ✓
              </button>
            </div>
          ) : (
            <div className="space-y-2.5">
              <div className="flex items-center gap-2 text-[11px] text-slate-300">
                {isDesktop ? (
                  <Monitor className="size-3.5 shrink-0 text-amber-400" />
                ) : (
                  <Smartphone className="size-3.5 shrink-0 text-amber-400" />
                )}
                <span>
                  {isDesktop
                    ? "Zigo kısayolunu bilgisayarınıza indirin, tek tıkla açın."
                    : "Zigo kısayolunu telefonunuzun ana ekranına indirin."}
                </span>
              </div>
              <button
                type="button"
                onClick={() => void handleInstall()}
                disabled={installing}
                className="tap-scale w-full rounded-2xl bg-gradient-to-r from-amber-500 via-orange-500 to-amber-600 py-3 text-center text-sm font-black text-slate-950 shadow-lg shadow-amber-500/25 hover:brightness-110 transition disabled:opacity-70 flex items-center justify-center gap-2"
              >
                <Download className="size-4 stroke-[2.5]" />
                <span>{installing ? "Kısayol İndiriliyor…" : "Kısayolu İndir — Ücretsiz"}</span>
              </button>
              <button
                type="button"
                onClick={handleDismiss}
                className="w-full text-center text-[11px] font-bold text-slate-400 hover:text-slate-200 transition py-1"
              >
                Daha sonra hatırlat
              </button>
            </div>
          )}
        </div>

        <div className="relative flex items-center justify-center gap-4 px-4 pb-3.5">
          <span className="text-[10px] font-bold text-slate-400">⚡ Anında açılır</span>
          <span className="text-[10px] font-bold text-slate-400">📱 Uygulama deneyimi</span>
          <span className="text-[10px] font-bold text-slate-400">🔒 Güvenli</span>
        </div>
      </div>
    </div>
  );
}
