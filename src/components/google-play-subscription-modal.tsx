"use client";

import { X } from "lucide-react";
import { useState, useMemo } from "react";
import { formatTryPrice } from "@/lib/domain/subscription-plans";
import { applyPromoCode } from "@/lib/domain/subscription-campaign";

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
  const [promoCode, setPromoCode] = useState("");
  const [promoMessage, setPromoMessage] = useState("");
  const [currentPrice, setCurrentPrice] = useState(basePriceTry);
  const [isPromoApplied, setIsPromoApplied] = useState(false);

  // Reset state when modal opens/closes or base price changes
  useMemo(() => {
    setCurrentPrice(basePriceTry);
    setPromoCode("");
    setPromoMessage("");
    setIsPromoApplied(false);
  }, [basePriceTry, isOpen]);

  if (!isOpen) return null;

  const handleApplyPromo = () => {
    if (!promoCode) return;
    const result = applyPromoCode(basePriceTry, promoCode, isWithinTrialWindow);
    setCurrentPrice(result.priceTry);
    setPromoMessage(result.message);
    setIsPromoApplied(result.success);
  };

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
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 px-4 backdrop-blur-sm">
      <div className="w-full max-w-[540px] overflow-hidden rounded-[24px] bg-white shadow-2xl">
        <div className="flex items-center justify-between bg-slate-50 px-6 py-4">
          <h2 className="text-xl font-bold text-slate-800">Abonelik Özeti</h2>
          <button
            aria-label="Kapat"
            className="flex size-8 items-center justify-center rounded-full bg-slate-200 text-slate-600 transition hover:bg-slate-300"
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
                {isPromoApplied && (
                  <div className="text-sm font-bold text-slate-400 line-through">
                    {formatTryPrice(basePriceTry)}
                  </div>
                )}
                <div className="text-2xl font-black text-emerald-600">
                  {formatTryPrice(currentPrice)}
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

          <div className="mb-6">
            <label className="mb-2 block text-sm font-bold text-slate-700">Promosyon Kodu</label>
            <div className="flex gap-2">
              <input
                className="flex-1 rounded-xl border border-slate-300 px-4 py-2.5 text-slate-800 outline-none focus:border-[#1f4e9a] focus:ring-1 focus:ring-[#1f4e9a] disabled:bg-slate-100"
                disabled={isPromoApplied}
                onChange={(e) => setPromoCode(e.target.value)}
                placeholder="Örn: ZIGO50"
                type="text"
                value={promoCode}
              />
              <button
                className="rounded-xl bg-slate-800 px-6 py-2.5 font-bold text-white transition hover:bg-slate-700 disabled:opacity-50"
                disabled={isPromoApplied || !promoCode}
                onClick={handleApplyPromo}
                type="button"
              >
                Uygula
              </button>
            </div>
            {promoMessage && (
              <p className={`mt-2 text-sm font-bold ${isPromoApplied ? "text-emerald-600" : "text-rose-500"}`}>
                {promoMessage}
              </p>
            )}
          </div>

          <p className="mb-6 text-center text-xs text-slate-500">
            Aboneliğiniz, seçtiğiniz dönemin sonunda otomatik olarak yenilenecektir. İstediğiniz zaman iptal edebilirsiniz.
          </p>

          <button
            className="w-full rounded-xl bg-[#1f4e9a] py-4 text-lg font-bold text-white shadow-md transition hover:bg-[#173f80]"
            onClick={() => onConfirm?.(isPromoApplied)}
            type="button"
          >
            {formatTryPrice(currentPrice)} ile Abone Ol
          </button>
        </div>
      </div>
    </div>
  );
}
