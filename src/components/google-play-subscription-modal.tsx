"use client";

import { X } from "lucide-react";

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
              <p className="text-sm font-bold text-emerald-700">🎉 İlk 30 güne özel %50 indirim uygulandı!</p>
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
