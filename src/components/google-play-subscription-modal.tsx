"use client";

import { X } from "lucide-react";
import { useMemo, useState } from "react";

type GooglePlaySubscriptionModalProps = {
  isOpen: boolean;
  onClose: () => void;
  onConfirm?: () => void;
  selectedInterval?: "monthly" | "yearly";
};

const tabStyle =
  "flex-1 rounded-xl px-3 py-3 text-center text-lg font-semibold transition-colors duration-150";

export function GooglePlaySubscriptionModal({
  isOpen,
  onClose,
  onConfirm,
  selectedInterval = "monthly",
}: GooglePlaySubscriptionModalProps) {
  const [interval, setInterval] = useState<"monthly" | "yearly">(selectedInterval);

  const options = useMemo(
    () => [
      {
        id: "monthly",
        label: "Aylık",
        selectedClass: interval === "monthly" ? "bg-[#1f4e9a] text-white shadow-sm" : "bg-slate-200 text-slate-700",
      },
      {
        id: "yearly",
        label: "Yıllık",
        selectedClass: interval === "yearly" ? "bg-[#1f4e9a] text-white shadow-sm" : "bg-slate-200 text-slate-700",
      },
    ],
    [interval],
  );

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/45 px-4">
      <div className="w-full max-w-[760px] rounded-[28px] border border-slate-200 bg-white shadow-2xl">
        <div className="flex items-center justify-between border-b border-slate-200 px-6 py-4">
          <div className="flex w-full items-center gap-6">
            {options.map((tab) => (
              <button
                key={tab.id}
                className={`${tabStyle} ${tab.selectedClass}`}
                onClick={() => setInterval(tab.id as "monthly" | "yearly")}
                type="button"
              >
                {tab.label}
              </button>
            ))}
          </div>

          <button
            aria-label="Kapat"
            className="ml-4 flex size-10 items-center justify-center rounded-full border border-slate-200 text-slate-600 transition hover:bg-slate-100"
            onClick={onClose}
            type="button"
          >
            <X className="size-5" strokeWidth={2.8} />
          </button>
        </div>

        <div className="px-6 pb-6 pt-5">
          <h2 className="mb-5 text-[2rem] font-medium tracking-[-0.04em] text-slate-900">Google Play</h2>

          <div className="mb-6 space-y-3">
            <div className="text-[2rem] font-medium leading-tight tracking-[-0.04em] text-slate-900">
              İlk olarak bir ödeme yöntemi ekleyin
            </div>
            <div className="text-[1.05rem] font-medium text-slate-600">ozyurtashe@gmail.com</div>
          </div>

          <p className="mb-8 max-w-[620px] text-[1.06rem] leading-8 text-slate-700">
            Satın alma işleminizi tamamlamak için Google Hesabınıza bir ödeme yöntemi ekleyin. Ödeme
            bilgilerinizi sadece Google&apos;da güvenli şekilde saklanır.
          </p>

          <div className="space-y-4">
            <button
              className="flex w-full items-center gap-4 rounded-xl px-3 py-4 text-left transition hover:bg-slate-50"
              onClick={onConfirm}
              type="button"
            >
              <span className="flex size-7 items-center justify-center rounded-md border border-slate-300 bg-white">
                <span className="block h-3.5 w-4 rounded-[3px] border border-slate-700" />
              </span>
              <span className="text-[1.15rem] font-medium text-slate-800">Kod kullan</span>
            </button>

            <button
              className="flex w-full items-center gap-4 rounded-xl px-3 py-4 text-left transition hover:bg-slate-50"
              onClick={onConfirm}
              type="button"
            >
              <span className="flex size-7 items-center justify-center rounded-md border border-slate-300 bg-white">
                <span className="block h-3.5 w-4 rounded-[3px] border border-slate-700" />
              </span>
              <span className="text-[1.15rem] font-medium text-slate-800">Kart ekle</span>
            </button>
          </div>

          <div className="mt-8 border-t border-slate-200 pt-6">
            <button
              className="flex w-full items-center gap-4 rounded-xl px-3 py-4 text-left transition hover:bg-slate-50"
              onClick={onConfirm}
              type="button"
            >
              <span className="flex size-7 items-center justify-center rounded-md border border-slate-300 bg-white">
                <span className="block h-3.5 w-4 rounded-[3px] border border-slate-700" />
              </span>
              <span className="text-[1.15rem] font-medium text-slate-800">Telefonunuzdan ödeyin</span>
            </button>
          </div>

          <div className="mt-8 flex justify-end">
            <button
              className="rounded-xl bg-[#1f4e9a] px-8 py-3 text-base font-semibold text-white shadow-sm transition hover:bg-[#173f80]"
              onClick={onConfirm}
              type="button"
            >
              Devam et
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
