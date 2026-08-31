"use client";

import { X } from "lucide-react";
import { useEffect, useRef } from "react";

import { formatTryPrice } from "@/lib/domain/subscription-plans";

type GooglePlaySubscriptionModalProps = {
  isOpen: boolean;
  onClose: () => void;
  onConfirm?: (isPromoApplied: boolean) => void;
  selectedInterval?: "monthly" | "yearly";
  basePriceTry: number;
  isWithinTrialWindow?: boolean;
};

export function GooglePlaySubscriptionModal({
  isOpen,
  onClose,
  onConfirm,
  selectedInterval = "monthly",
  basePriceTry,
  isWithinTrialWindow = false,
}: GooglePlaySubscriptionModalProps) {
  const overlayRef = useRef<HTMLDivElement>(null);
  const closeBtnRef = useRef<HTMLButtonElement>(null);
  const prevFocusRef = useRef<HTMLElement | null>(null);

  useEffect(() => {
    if (!isOpen) return;
    prevFocusRef.current = document.activeElement as HTMLElement | null;
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const t = setTimeout(() => closeBtnRef.current?.focus(), 0);

    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
      if (e.key === "Tab" && overlayRef.current) {
        const focusable = overlayRef.current.querySelectorAll<HTMLElement>(
          'button:not([disabled]), [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
        );
        if (focusable.length === 0) return;
        const first = focusable[0];
        const last = focusable[focusable.length - 1];
        if (e.shiftKey && document.activeElement === first) {
          e.preventDefault();
          last.focus();
        } else if (!e.shiftKey && document.activeElement === last) {
          e.preventDefault();
          first.focus();
        }
      }
    };
    document.addEventListener("keydown", onKey);
    return () => {
      clearTimeout(t);
      document.body.style.overflow = prevOverflow;
      document.removeEventListener("keydown", onKey);
      prevFocusRef.current?.focus();
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const startDate = new Date();
  const endDate = new Date();
  if (selectedInterval === "monthly") {
    endDate.setMonth(endDate.getMonth() + 1);
  } else {
    endDate.setFullYear(endDate.getFullYear() + 1);
  }

  const dateFormater = new Intl.DateTimeFormat("tr-TR", { day: "numeric", month: "long", year: "numeric" });
  const formattedStartDate = dateFormater.format(startDate);
  const formattedEndDate = dateFormater.format(endDate);

  return (
    <div
      ref={overlayRef}
      role="dialog"
      aria-modal="true"
      aria-labelledby="google-play-modal-title"
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 px-4 backdrop-blur-sm"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="w-full max-w-[540px] overflow-hidden rounded-[24px] bg-white shadow-2xl">
        <div className="flex items-center justify-between bg-slate-50 px-6 py-4">
          <h2 id="google-play-modal-title" className="text-xl font-bold text-slate-800">Abonelik Özeti</h2>
          <button
            ref={closeBtnRef}
            aria-label="Kapat"
            className="flex size-8 items-center justify-center rounded-full bg-slate-200 text-slate-600 transition hover:bg-slate-300 focus-visible:ring-2 focus-visible:ring-violet-500"
            onClick={onClose}
            type="button"
          >
            <X className="size-5" strokeWidth={2.5} />
          </button>
        </div>

        <div className="px-6 py-6">
          <div className="mb-6 rounded-xl border border-slate-200 bg-slate-50 p-4">
            <div className="mb-4 flex items-center justify-between border-b border-slate-200 pb-4">
              <div>
                <h3 className="text-lg font-bold text-slate-800">
                  Zigo Plus ({selectedInterval === "monthly" ? "Aylık" : "Yıllık"})
                </h3>
                <p className="text-sm text-slate-500">Düzenli abonelik</p>
              </div>
              <div className="text-right">
                {isWithinTrialWindow && (
                  <div className="text-sm font-bold text-slate-400 line-through">
                    {formatTryPrice(basePriceTry * 2)}
                  </div>
                )}
                <div className="text-2xl font-black text-emerald-600">
                  {formatTryPrice(basePriceTry)}
                </div>
              </div>
            </div>

            <div className="space-y-2 text-sm text-slate-600">
              <div className="flex justify-between">
                <span className="font-medium">Başlangıç Tarihi:</span>
                <span>{formattedStartDate}</span>
              </div>
              <div className="flex justify-between">
                <span className="font-medium">Bitiş Tarihi:</span>
                <span>{formattedEndDate}</span>
              </div>
            </div>
          </div>

          {isWithinTrialWindow && (
            <div className="mb-6 rounded-xl border border-emerald-200 bg-emerald-50 p-4 text-center">
              <p className="text-sm font-bold text-emerald-700">🎉 İlk 7 güne özel %50 indirim uygulandı!</p>
            </div>
          )}

          <p className="mb-6 text-center text-xs text-slate-500">
            Aboneliğiniz, seçtiğiniz dönemin sonunda otomatik olarak yenilenecektir. İstediğiniz zaman iptal edebilirsiniz.
          </p>

          <button
            className="w-full rounded-xl bg-[#1f4e9a] py-4 text-lg font-bold text-white shadow-md transition hover:bg-[#173f80]"
            onClick={() => onConfirm?.(isWithinTrialWindow)}
            type="button"
          >
            {formatTryPrice(basePriceTry)} ile Abone Ol
          </button>
        </div>
      </div>
    </div>
  );
}
