"use client";

import { AlertCircle, CheckCircle2, ExternalLink, Loader2, X } from "lucide-react";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";

import { formatTryPrice } from "@/lib/domain/subscription-plans";

export type GooglePlaySubscriptionModalProps = {
  isOpen: boolean;
  onClose: () => void;
  onConfirm?: (isPromoApplied: boolean) => Promise<void> | void;
  selectedInterval?: "monthly" | "yearly";
  basePriceTry: number;
  isWithinTrialWindow?: boolean;
  planId?: string;
  loading?: boolean;
  errorMessage?: string | null;
  onFallbackCheckout?: () => void;
  onFallbackHavale?: () => void;
};

export function GooglePlaySubscriptionModal({
  isOpen,
  onClose,
  onConfirm,
  selectedInterval = "monthly",
  basePriceTry,
  isWithinTrialWindow = false,
  planId = "zigo-plus-student-monthly",
  loading: externalLoading = false,
  errorMessage: externalError = null,
  onFallbackCheckout,
  onFallbackHavale,
}: GooglePlaySubscriptionModalProps) {
  const overlayRef = useRef<HTMLDivElement>(null);
  const closeBtnRef = useRef<HTMLButtonElement>(null);
  const prevFocusRef = useRef<HTMLElement | null>(null);

  const [internalLoading, setInternalLoading] = useState(false);
  const [internalError, setInternalError] = useState<string | null>(null);

  const isLoading = externalLoading || internalLoading;
  const activeError = externalError || internalError;

  useEffect(() => {
    if (!isOpen) {
      setInternalLoading(false);
      setInternalError(null);
      return;
    }
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

  async function handleConfirm() {
    if (!onConfirm) return;
    setInternalLoading(true);
    setInternalError(null);
    try {
      await onConfirm(isWithinTrialWindow);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      setInternalError(msg || "Google Play abonelik akışı başlatılamadı.");
    } finally {
      setInternalLoading(false);
    }
  }

  return (
    <div
      ref={overlayRef}
      role="dialog"
      aria-modal="true"
      aria-labelledby="google-play-modal-title"
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/70 px-4 backdrop-blur-sm animate-in fade-in duration-200"
      onClick={(e) => {
        if (e.target === e.currentTarget && !isLoading) onClose();
      }}
    >
      <div className="w-full max-w-[540px] max-h-[92vh] overflow-y-auto rounded-[24px] bg-white shadow-2xl border border-slate-100">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-100 bg-slate-50/80 px-6 py-4">
          <div className="flex items-center gap-2.5">
            <span className="flex size-7 items-center justify-center rounded-lg bg-slate-900 text-white shadow-sm">
              <svg aria-hidden="true" className="size-4 fill-current" viewBox="0 0 24 24">
                <path d="M3.609 1.814L13.792 12 3.61 22.186a1.99 1.99 0 0 1-.61-1.42V3.234c0-.553.224-1.053.609-1.42zM15.206 13.414l2.585 2.585-12.87 7.43 10.285-10.015zM15.206 10.586L4.921 .571l12.87 7.43-2.585 2.585zM19.393 12l2.366-1.366c.64-.37.64-1.63 0-2l-2.366-1.366-2.585 2.585L19.393 12z" />
              </svg>
            </span>
            <h2 id="google-play-modal-title" className="text-xl font-bold text-slate-900">
              Abonelik Özeti
            </h2>
          </div>
          <button
            ref={closeBtnRef}
            aria-label="Kapat"
            disabled={isLoading}
            className="flex size-8 items-center justify-center rounded-full bg-slate-200 text-slate-600 transition hover:bg-slate-300 focus-visible:ring-2 focus-visible:ring-violet-500 disabled:opacity-50"
            onClick={onClose}
            type="button"
          >
            <X className="size-5" strokeWidth={2.5} />
          </button>
        </div>

        <div className="px-6 py-6">
          {/* Plan Summary Card */}
          <div className="mb-5 rounded-2xl border border-slate-200 bg-slate-50/70 p-4">
            <div className="mb-4 flex items-center justify-between border-b border-slate-200/80 pb-4">
              <div>
                <h3 className="text-lg font-bold text-slate-900">
                  Zigo Plus ({selectedInterval === "monthly" ? "Aylık" : "Yıllık"})
                </h3>
                <p className="text-xs font-semibold text-slate-500">Google Play & Web Resmi Aboneliği</p>
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

            <div className="space-y-2 text-xs font-semibold text-slate-600">
              <div className="flex justify-between">
                <span className="text-slate-500">Başlangıç Tarihi:</span>
                <span className="font-bold text-slate-800">{formattedStartDate}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Bitiş Tarihi:</span>
                <span className="font-bold text-slate-800">{formattedEndDate}</span>
              </div>
            </div>
          </div>

          {isWithinTrialWindow && (
            <div className="mb-5 rounded-xl border border-emerald-200 bg-emerald-50/80 p-3.5 text-center">
              <p className="text-xs font-black text-emerald-800 flex items-center justify-center gap-1.5">
                <CheckCircle2 className="size-4 text-emerald-600 shrink-0" />
                <span>🎉 İlk 7 güne özel %50 indirim uygulandı!</span>
              </p>
            </div>
          )}

          {/* Error Message & Friendly Fallbacks */}
          {activeError && (
            <div className="mb-5 rounded-xl border border-amber-300 bg-amber-50/90 p-4 text-left">
              <div className="flex items-start gap-2.5">
                <AlertCircle className="size-5 text-amber-600 shrink-0 mt-0.5" />
                <div className="text-xs font-medium text-amber-950">
                  <p className="font-bold text-amber-900">Google Play Ödeme Bildirimi:</p>
                  <p className="mt-1 text-slate-700">{activeError}</p>
                </div>
              </div>

              <div className="mt-3.5 pt-3 border-t border-amber-200/80 flex flex-col gap-2">
                <p className="text-[11px] font-bold text-slate-600">
                  Aşağıdaki alternatif yöntemlerle de aboneliğinizi anında başlatabilirsiniz:
                </p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mt-1">
                  <a
                    href="https://play.google.com/store/apps/details?id=com.zigo.education"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center justify-center gap-1.5 rounded-lg bg-slate-900 px-3 py-2 text-xs font-black text-white hover:bg-slate-800 transition"
                  >
                    <span>Play Store Uygulaması</span>
                    <ExternalLink className="size-3.5" />
                  </a>
                  <Link
                    href={`/billing/havale?planId=${encodeURIComponent(planId)}`}
                    onClick={() => onClose()}
                    className="inline-flex items-center justify-center gap-1.5 rounded-lg bg-amber-500 px-3 py-2 text-xs font-black text-slate-950 hover:bg-amber-600 transition"
                  >
                    <span>Havale / FAST</span>
                    <ExternalLink className="size-3.5" />
                  </Link>
                </div>
              </div>
            </div>
          )}

          <p className="mb-5 text-center text-xs font-medium text-slate-500 leading-relaxed">
            Aboneliğiniz seçtiğiniz dönemin sonunda otomatik yenilenir. İstediğiniz zaman Google Play veya Profil menüsünden tek tıkla iptal edebilirsiniz.
          </p>

          {/* Primary Action Button */}
          <button
            className="w-full rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 py-3.5 px-4 text-base font-black text-white shadow-md transition hover:from-emerald-700 hover:to-teal-700 flex items-center justify-center gap-2 disabled:opacity-60"
            disabled={isLoading}
            onClick={handleConfirm}
            type="button"
          >
            {isLoading ? (
              <>
                <Loader2 className="size-5 animate-spin" />
                <span>Google Play Başlatılıyor…</span>
              </>
            ) : (
              <>
                <svg aria-hidden="true" className="size-4 fill-current" viewBox="0 0 24 24">
                  <path d="M3.609 1.814L13.792 12 3.61 22.186a1.99 1.99 0 0 1-.61-1.42V3.234c0-.553.224-1.053.609-1.42zM15.206 13.414l2.585 2.585-12.87 7.43 10.285-10.015zM15.206 10.586L4.921 .571l12.87 7.43-2.585 2.585zM19.393 12l2.366-1.366c.64-.37.64-1.63 0-2l-2.366-1.366-2.585 2.585L19.393 12z" />
                </svg>
                <span>{formatTryPrice(basePriceTry)} ile Abone Ol</span>
              </>
            )}
          </button>

          {/* Secondary Web / Havale Alternative Bar */}
          <div className="mt-4 flex items-center justify-center gap-4 text-xs font-bold text-slate-500">
            {onFallbackCheckout && (
              <button
                type="button"
                onClick={() => {
                  onClose();
                  onFallbackCheckout();
                }}
                className="hover:text-violet-600 underline underline-offset-2"
              >
                Kredi Kartı ile Öde
              </button>
            )}
            <Link
              href={`/billing/havale?planId=${encodeURIComponent(planId)}`}
              onClick={() => {
                if (onFallbackHavale) onFallbackHavale();
                onClose();
              }}
              className="hover:text-emerald-700 underline underline-offset-2"
            >
              Havale / FAST ile Öde
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
