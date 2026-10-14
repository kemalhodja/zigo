"use client";

import { Download, PlusSquare, Share, Smartphone, X } from "lucide-react";
import { useEffect, useRef, useState } from "react";

type Platform = "ios" | "android" | "desktop" | null;

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
}

const DISMISS_KEY = "zigo_pwa_banner_dismissed_v2";

function detectPlatform(): Platform {
  if (typeof window === "undefined") return null;
  const ua = navigator.userAgent;
  const win = window as unknown as { MSStream?: unknown };
  const nav = navigator as unknown as { standalone?: boolean };
  const isStandalone =
    Boolean(nav.standalone) ||
    window.matchMedia("(display-mode: standalone)").matches;

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
  const deferredPrompt = useRef<BeforeInstallPromptEvent | null>(null);

  useEffect(() => {
    if (typeof window === "undefined") return;
    if (localStorage.getItem(DISMISS_KEY)) return;

    const p = detectPlatform();
    if (!p) return;

    const handleBeforeInstall = (e: Event) => {
      e.preventDefault();
      deferredPrompt.current = e as BeforeInstallPromptEvent;
      setPlatform(p);
      const t = setTimeout(() => setVisible(true), 4000);
      return () => clearTimeout(t);
    };

    window.addEventListener("beforeinstallprompt", handleBeforeInstall);

    if (p === "ios") {
      const t = setTimeout(() => {
        setPlatform("ios");
        setVisible(true);
      }, 4000);
      return () => {
        clearTimeout(t);
        window.removeEventListener("beforeinstallprompt", handleBeforeInstall);
      };
    }

    return () => {
      window.removeEventListener("beforeinstallprompt", handleBeforeInstall);
    };
  }, []);

  function handleDismiss() {
    setVisible(false);
    localStorage.setItem(DISMISS_KEY, "true");
  }

  async function handleInstall() {
    if (platform === "ios") return;
    if (!deferredPrompt.current) return;
    setInstalling(true);
    try {
      await deferredPrompt.current.prompt();
      const { outcome } = await deferredPrompt.current.userChoice;
      if (outcome === "accepted") {
        deferredPrompt.current = null;
        handleDismiss();
      }
    } finally {
      setInstalling(false);
    }
  }

  if (!visible || !platform) return null;

  const isIos = platform === "ios";

  return (
    <div
      role="dialog"
      aria-label="Zigo uygulamasını yükle"
      className="fixed bottom-20 inset-x-3 z-[60] mx-auto max-w-sm"
    >
      <div className="relative overflow-hidden rounded-3xl border border-white/20 bg-night/96 shadow-2xl shadow-black/40 backdrop-blur-xl animate-in fade-in slide-in-from-bottom-6 duration-500">
        <div className="absolute inset-0 bg-gradient-to-br from-violet-600/10 via-transparent to-amber-500/10 pointer-events-none" />

        <div className="relative flex items-center justify-between gap-3 px-4 pt-4 pb-3">
          <div className="flex items-center gap-3">
            <div className="relative flex size-12 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-tr from-violet-600 via-purple-500 to-amber-500 text-white shadow-lg shadow-violet-500/30 font-black text-xl">
              Z
              <span className="absolute -bottom-1 -right-1 flex size-4 items-center justify-center rounded-full bg-emerald-500 text-white shadow ring-2 ring-night">
                <Download className="size-2.5" strokeWidth={3} />
              </span>
            </div>
            <div>
              <p className="text-sm font-black text-white leading-tight">
                {platform === "desktop" ? "Zigo'yu PC'ye Ekle" : "Zigo'yu Telefona Ekle"}
              </p>
              <p className="text-[11px] font-medium text-slate-400 mt-0.5">
                {isIos
                  ? "Ana ekrana ekleyerek uygulama gibi kullan"
                  : platform === "desktop"
                    ? "Tarayıcıdan bağımsız uygulama olarak çalışır"
                    : "Ana ekrana ekle, daha hızlı eriş"}
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
              <p className="text-[10px] font-black uppercase tracking-wider text-slate-500 mb-2">
                Safari&apos;de 2 adımda ekle
              </p>
              <div className="flex items-center gap-2.5 rounded-xl bg-white/[0.08] px-3 py-2">
                <span className="flex size-6 shrink-0 items-center justify-center rounded-full bg-violet-500/20 text-violet-300 font-black text-[10px]">1</span>
                <span className="text-[11px] text-slate-300 leading-snug">
                  Alttaki <Share className="inline size-3.5 mx-0.5 text-sky-400" /> <strong className="text-white">Paylaş</strong> simgesine dokun
                </span>
              </div>
              <div className="flex items-center gap-2.5 rounded-xl bg-white/[0.08] px-3 py-2">
                <span className="flex size-6 shrink-0 items-center justify-center rounded-full bg-amber-500/20 text-amber-300 font-black text-[10px]">2</span>
                <span className="text-[11px] text-slate-300 leading-snug">
                  <PlusSquare className="inline size-3.5 mx-0.5 text-amber-400" /> <strong className="text-white">Ana Ekrana Ekle</strong>&apos;yi seç
                </span>
              </div>
              <button
                type="button"
                onClick={handleDismiss}
                className="tap-scale mt-1 w-full rounded-2xl bg-gradient-to-r from-violet-600 to-purple-600 py-2.5 text-center text-xs font-black text-white shadow-lg shadow-violet-500/30 hover:brightness-110 transition"
              >
                Anladım ✓
              </button>
            </div>
          ) : (
            <div className="space-y-3">
              <div className="flex items-center gap-2 text-[11px] text-slate-400">
                <Smartphone className="size-3.5 shrink-0 text-violet-400" />
                <span>
                  {platform === "desktop"
                    ? "Adres çubuğundaki ⬇ simgesine veya aşağıdaki butona tıkla"
                    : "Zigo'yu ana ekrana ekle; bildirim ve hızlı erişim kazan"}
                </span>
              </div>
              <button
                type="button"
                onClick={handleInstall}
                disabled={installing}
                className="tap-scale w-full rounded-2xl bg-gradient-to-r from-violet-600 via-purple-600 to-violet-700 py-3 text-center text-sm font-black text-white shadow-lg shadow-violet-500/30 hover:brightness-110 transition disabled:opacity-70 flex items-center justify-center gap-2"
              >
                <Download className="size-4" />
                <span>{installing ? "Yükleniyor…" : "Hemen Yükle — Ücretsiz"}</span>
              </button>
              <button
                type="button"
                onClick={handleDismiss}
                className="w-full text-center text-[11px] font-bold text-slate-500 hover:text-slate-400 transition py-1"
              >
                Şimdi değil
              </button>
            </div>
          )}
        </div>

        <div className="relative flex items-center justify-center gap-4 px-4 pb-4">
          <span className="text-[10px] font-bold text-slate-600">🔒 Veri toplamaz</span>
          <span className="text-[10px] font-bold text-slate-600">⚡ Anında açılır</span>
          <span className="text-[10px] font-bold text-slate-600">📶 Çevrimdışı çalışır</span>
        </div>
      </div>
    </div>
  );
}
