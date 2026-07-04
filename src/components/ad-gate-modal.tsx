/**
 * AdGateModal Component
 * 
 * Modal that appears when user tries to perform a gated action
 * (e.g., share reel, create post) without ad-free access.
 * Prompts user to watch a rewarded ad or upgrade to premium.
 */

"use client";

import { useState } from "react";
import { useWatchAd } from "@/lib/hooks/use-ad-state";

interface AdGateModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  actionName: string;
}

export function AdGateModal({ isOpen, onClose, onSuccess, actionName }: AdGateModalProps) {
  const [mode, setMode] = useState<"watch" | "upgrade">("watch");
  const { watchAd, watching, result } = useWatchAd(null);

  const handleWatchAd = async () => {
    const adResult = await watchAd(2); // Grant 2 hours of ad-free time
    
    if (adResult?.success) {
      onSuccess();
      onClose();
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6 space-y-6">
        <div className="text-center">
          <div className="mx-auto w-16 h-16 bg-gradient-to-br from-purple-500 to-pink-500 rounded-full flex items-center justify-center mb-4">
            <svg
              className="w-8 h-8 text-white"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z"
              />
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">
            Reklam İzle ve {actionName}
          </h2>
          <p className="text-gray-600">
            Bu işlemi yapmak için 2 saatlik reklamsız erişim kazanmak için
            kısa bir reklam izleyebilir veya Premium'a geçebilirsiniz.
          </p>
        </div>

        <div className="space-y-3">
          {mode === "watch" ? (
            <>
              <button
                onClick={handleWatchAd}
                disabled={watching}
                className="w-full bg-gradient-to-r from-purple-600 to-pink-600 text-white font-semibold py-3 px-6 rounded-xl hover:from-purple-700 hover:to-pink-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {watching ? (
                  <>
                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    İzleniyor...
                  </>
                ) : (
                  <>
                    <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                      <path d="M6.3 2.841A1.5 1.5 0 004 4.11V15.89a1.5 1.5 0 002.3 1.269l9.344-5.89a1.5 1.5 0 000-2.538L6.3 2.84z" />
                    </svg>
                    Reklam İzle (2 Saat Reklamsız)
                  </>
                )}
              </button>

              <button
                onClick={() => setMode("upgrade")}
                className="w-full bg-gray-100 text-gray-700 font-semibold py-3 px-6 rounded-xl hover:bg-gray-200 transition-all"
              >
                Premium'a Geç (Reklamsız)
              </button>
            </>
          ) : (
            <>
              <button
                onClick={() => {
                  // TODO: Implement premium upgrade flow
                  alert("Premium upgrade flow will be implemented here");
                }}
                className="w-full bg-gradient-to-r from-yellow-500 to-orange-500 text-white font-semibold py-3 px-6 rounded-xl hover:from-yellow-600 hover:to-orange-600 transition-all"
              >
                Premium'a Geç
              </button>

              <button
                onClick={() => setMode("watch")}
                className="w-full bg-gray-100 text-gray-700 font-semibold py-3 px-6 rounded-xl hover:bg-gray-200 transition-all"
              >
                Geri Dön
              </button>
            </>
          )}
        </div>

        {result?.error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">
            {result.error}
          </div>
        )}

        <button
          onClick={onClose}
          className="w-full text-gray-500 hover:text-gray-700 text-sm font-medium py-2 transition-colors"
        >
          İptal
        </button>
      </div>
    </div>
  );
}