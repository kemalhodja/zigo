"use client";

import Link from "next/link";
import { useEffect } from "react";

type SharedLinkPaywallModalProps = {
  isOpen: boolean;
  onClose: () => void;
  url?: string | null;
  targetDomain?: string | null;
};

export function SharedLinkPaywallModal({
  isOpen,
  onClose,
  targetDomain,
}: SharedLinkPaywallModalProps) {
  useEffect(() => {
    if (isOpen && typeof window !== "undefined" && "vibrate" in navigator) {
      navigator.vibrate([20, 40, 20]);
    }
  }, [isOpen]);

  // ESC tuşu ile kapatma desteği
  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="shared-link-paywall-title"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200"
      onClick={onClose}
    >
      <div
        className="relative w-full max-w-sm overflow-hidden rounded-3xl bg-white p-6 text-center shadow-2xl border border-violet-100 animate-in zoom-in-95 duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Kapat butonu */}
        <button
          type="button"
          onClick={onClose}
          aria-label="Kapat"
          className="tap-scale absolute right-4 top-4 flex size-8 items-center justify-center rounded-full bg-slate-100 text-slate-500 hover:bg-slate-200 transition-colors"
        >
          ✕
        </button>

        {/* İkon */}
        <div className="mx-auto mb-4 flex size-16 items-center justify-center rounded-2xl bg-gradient-to-tr from-violet-600 to-fuchsia-500 text-white shadow-lg shadow-violet-500/30">
          <span className="text-2xl">🔒</span>
        </div>

        {/* Başlık & Rozet */}
        <span className="inline-block px-3 py-1 rounded-full bg-violet-50 text-violet-700 text-[0.68rem] font-black uppercase tracking-wider mb-2 border border-violet-200">
          Zigo Plus Ayrıcalığı
        </span>

        <h3
          id="shared-link-paywall-title"
          className="text-lg font-black text-night"
        >
          Paylaşılan Bağlantılar Kilitli
        </h3>

        <p className="mt-2 text-xs font-semibold leading-relaxed text-slate-600">
          {targetDomain ? (
            <>
              <strong className="text-violet-700">{targetDomain}</strong> gibi paylaşılan dış kaynak ve videolara yalnızca{" "}
              <strong className="text-night">Zigo Plus</strong> aboneleri erişebilir.
            </>
          ) : (
            <>
              Öğretmen ve kullanıcıların paylaştığı dış bağlantılara, videolara ve ders kaynaklarına erişim{" "}
              <strong className="text-night">Zigo Plus</strong> abonelerine özeldir.
            </>
          )}
        </p>

        {/* Avantajlar Listesi */}
        <div className="mt-5 space-y-2 text-left">
          <div className="flex items-center gap-2.5 rounded-xl bg-violet-50/70 p-2.5 border border-violet-100/70">
            <span className="text-base shrink-0">🔗</span>
            <div className="text-xs">
              <span className="font-bold text-night">Tüm Dış Kaynaklar:</span>{" "}
              <span className="text-slate-600">YouTube dersleri, dokümanlar ve web bağlantılarını tek tıkla açın.</span>
            </div>
          </div>

          <div className="flex items-center gap-2.5 rounded-xl bg-violet-50/70 p-2.5 border border-violet-100/70">
            <span className="text-base shrink-0">🎮</span>
            <div className="text-xs">
              <span className="font-bold text-night">Zeka Oyunları Salonu:</span>{" "}
              <span className="text-slate-600">Günde 2 saat boyunca tüm zeka ve odaklanma oyunlarına erişin.</span>
            </div>
          </div>

          <div className="flex items-center gap-2.5 rounded-xl bg-violet-50/70 p-2.5 border border-violet-100/70">
            <span className="text-base shrink-0">🎓</span>
            <div className="text-xs">
              <span className="font-bold text-night">Özel Ders & Soru Odaları:</span>{" "}
              <span className="text-slate-600">Doğrulanmış öğretmenlerle doğrudan iletişim kurun ve ders talebi açın.</span>
            </div>
          </div>
        </div>

        {/* Eylemler */}
        <div className="mt-6 space-y-2">
          <Link
            href="/pricing"
            onClick={onClose}
            className="tap-scale flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-violet-600 to-fuchsia-600 py-3 text-xs font-black text-white shadow-md shadow-violet-500/25 transition hover:brightness-105"
          >
            <span>Zigo Plus'a Abone Ol ✨</span>
          </Link>
          <button
            type="button"
            onClick={onClose}
            className="tap-scale w-full rounded-xl bg-slate-100 py-2.5 text-xs font-bold text-slate-600 hover:bg-slate-200 transition-colors"
          >
            Şimdilik Kapat
          </button>
        </div>
      </div>
    </div>
  );
}
