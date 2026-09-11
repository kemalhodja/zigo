"use client";

import { useEffect, useState } from "react";
import { Share, PlusSquare, X } from "lucide-react";

export function IosPwaInstallPrompt() {
  const [showPrompt, setShowPrompt] = useState(false);

  useEffect(() => {
    // Only show on iOS Safari and when not already running in standalone PWA mode
    if (typeof window === "undefined") return;

    const isIos = /iPad|iPhone|iPod/.test(navigator.userAgent) && !(window as any).MSStream;
    const isStandalone = (window.navigator as any).standalone || window.matchMedia("(display-mode: standalone)").matches;
    const hasDismissed = localStorage.getItem("zigo_ios_prompt_dismissed");

    if (isIos && !isStandalone && !hasDismissed) {
      // Delay prompt for 3 seconds after page load for non-intrusive feel
      const timer = setTimeout(() => setShowPrompt(true), 3000);
      return () => clearTimeout(timer);
    }
  }, []);

  function handleDismiss() {
    setShowPrompt(false);
    localStorage.setItem("zigo_ios_prompt_dismissed", "true");
  }

  if (!showPrompt) return null;

  return (
    <div className="fixed bottom-20 inset-x-4 z-50 mx-auto max-w-sm rounded-2xl border border-crystal/30 bg-night/95 p-4 text-white shadow-2xl backdrop-blur-md animate-in fade-in slide-in-from-bottom-5 duration-300">
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-2.5">
          <div className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-gradient-to-tr from-crystal to-berry text-white shadow-sm font-black text-sm">
            Z
          </div>
          <div>
            <h4 className="text-xs font-black text-white">Bildirimleri ve Sayacı Aç</h4>
            <p className="text-[11px] font-medium text-slate-300">Zigo'yu telefonuna ekle</p>
          </div>
        </div>
        <button
          type="button"
          onClick={handleDismiss}
          className="rounded-lg p-1 text-slate-400 hover:text-white"
        >
          <X className="size-4" />
        </button>
      </div>

      <div className="mt-3 rounded-xl bg-white/10 p-2.5 text-[11px] leading-relaxed text-slate-200">
        <div className="flex items-center gap-2 mb-1.5">
          <span className="flex size-5 items-center justify-center rounded-full bg-white/20 font-black text-[10px]">1</span>
          <span>Aşağıdaki <strong>Paylaş</strong> <Share className="inline size-3.5 mx-0.5 text-crystal" /> simgesine dokunun.</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="flex size-5 items-center justify-center rounded-full bg-white/20 font-black text-[10px]">2</span>
          <span><strong>Ana Ekrana Ekle</strong> <PlusSquare className="inline size-3.5 mx-0.5 text-crystal" /> seçeneğini seçin.</span>
        </div>
      </div>

      <button
        type="button"
        onClick={handleDismiss}
        className="tap-scale mt-3 w-full rounded-xl bg-crystal py-2 text-center text-xs font-black text-white shadow-sm hover:brightness-110"
      >
        Anladım
      </button>
    </div>
  );
}
