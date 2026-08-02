/**
 * AdGateModal — rewarded ad or Zigo Plus upgrade for gated actions.
 */

"use client";

import Link from "next/link";
import { useState } from "react";

import { useWatchAd } from "@/lib/hooks/use-ad-state";
import { useMessages } from "@/lib/i18n/locale-context";

interface AdGateModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  actionName: string;
  userId: string | null | undefined;
}

export function AdGateModal({ isOpen, onClose, onSuccess, actionName, userId }: AdGateModalProps) {
  const b = useMessages().billingUi;
  const [mode, setMode] = useState<"watch" | "upgrade">("watch");
  const { watchAd, watching, result } = useWatchAd(userId);

  const handleWatchAd = async () => {
    const adResult = await watchAd(2);

    if (adResult?.success) {
      onSuccess();
      onClose();
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="w-full max-w-md space-y-6 rounded-2xl bg-white p-6 shadow-2xl">
        <div className="text-center">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-gradient-to-br from-amber-400 to-orange-500">
            <svg className="h-8 w-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z"
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
              />
              <path
                d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
              />
            </svg>
          </div>
          <h2 className="mb-2 text-2xl font-bold text-gray-900">
            {b.adGateTitle.replace("{action}", actionName)}
          </h2>
          <p className="text-gray-600">{b.adGateDesc}</p>
        </div>

        <div className="space-y-3">
          {mode === "watch" ? (
            <>
              <button
                className="flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-violet-600 to-fuchsia-600 px-6 py-3 font-semibold text-white transition-all hover:from-violet-700 hover:to-fuchsia-700 disabled:cursor-not-allowed disabled:opacity-50"
                disabled={watching || !userId}
                onClick={() => void handleWatchAd()}
                type="button"
              >
                {watching ? (
                  <>
                    <div className="h-5 w-5 animate-spin rounded-full border-2 border-white border-t-transparent" />
                    {b.adGateWatching}
                  </>
                ) : (
                  b.adGateWatch
                )}
              </button>

              <button
                className="w-full rounded-xl bg-gray-100 px-6 py-3 font-semibold text-gray-700 transition-all hover:bg-gray-200"
                onClick={() => setMode("upgrade")}
                type="button"
              >
                {b.adGateUpgrade}
              </button>
            </>
          ) : (
            <>
              <Link
                className="block w-full rounded-xl bg-gradient-to-r from-amber-400 to-orange-500 px-6 py-3 text-center font-semibold text-night transition-all hover:from-amber-500 hover:to-orange-600"
                href="/profile#zigo-plus-plans"
                onClick={onClose}
              >
                {b.adGateOpenPlans}
              </Link>

              <button
                className="w-full rounded-xl bg-gray-100 px-6 py-3 font-semibold text-gray-700 transition-all hover:bg-gray-200"
                onClick={() => setMode("watch")}
                type="button"
              >
                {b.adGateBack}
              </button>
            </>
          )}
        </div>

        {result?.error ? (
          <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{result.error}</div>
        ) : null}

        <button
          className="w-full py-2 text-sm font-medium text-gray-500 transition-colors hover:text-gray-700"
          onClick={onClose}
          type="button"
        >
          {b.adGateCancel}
        </button>
      </div>
    </div>
  );
}
