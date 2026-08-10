// src/components/SubscribeButton.tsx

"use client";

import { useState } from "react";

import { useToast } from "@/components/ui/toast-system";
import { triggerConfetti } from "@/lib/client/confetti";
import { createClient } from "@/lib/supabase/client";

interface SubscribeButtonProps {
  productId?: string;
  planId?: string;
  className?: string;
  buttonText?: string;
  onSuccess?: () => void;
}

/**
 * SubscribeButton – renders a button that initiates the Google Play
 * subscription purchase flow for the "zigo_plus" product ID.
 *
 * Triggers official Google Play billing dialog on Android devices,
 * sends purchaseToken to backend for Supabase activation, and handles 30-day free trial.
 */
export function SubscribeButton({
  productId = "zigo_plus",
  planId = "student-monthly",
  className = "rounded-xl bg-gradient-to-r from-amber-400 to-orange-500 px-5 py-3 text-sm font-black text-slate-950 shadow-lg hover:brightness-105 disabled:opacity-50 transition-all tap-scale",
  buttonText = "ZigoPlus'a Geç / Abone Ol",
  onSuccess,
}: SubscribeButtonProps) {
  const [loading, setLoading] = useState(false);
  const toast = useToast();

  async function getAccessToken(): Promise<string | null> {
    try {
      const supabase = createClient();
      const { data } = await supabase.auth.getSession();
      return data.session?.access_token ?? null;
    } catch {
      return null;
    }
  }

  async function handlePurchase() {
    setLoading(true);
    try {
      let purchaseToken: string | null = null;
      let orderId: string | null = null;

      // Detect Native / Mobile Android vs Web Environment
      const win = typeof window !== "undefined" ? (window as unknown as { Capacitor?: unknown; Android?: unknown }) : null;
      const isAndroidWindow = Boolean(win?.Capacitor || win?.Android);
      
      if (isAndroidWindow) {
        try {
          const { NativePurchases, PURCHASE_TYPE } = await import("@capgo/native-purchases");
          const isSupported = await NativePurchases.isBillingSupported().then((res) => res.isBillingSupported).catch(() => false);
          
          if (isSupported) {
            const transaction = await NativePurchases.purchaseProduct({
              productIdentifier: productId,
              planIdentifier: planId,
              productType: PURCHASE_TYPE.SUBS,
              quantity: 1,
            });

            purchaseToken = transaction.purchaseToken || null;
            orderId = transaction.transactionId || null;
          }
        } catch (nativeErr) {
          const msg = nativeErr instanceof Error ? nativeErr.message : "Native IAP Error";
          console.warn("Native IAP fallback to API bridge:", msg);
        }
      }

      // If purchaseToken was not acquired through Native SDK (e.g. testing/web interface fallback)
      if (!purchaseToken) {
        if (process.env.NODE_ENV === "production") {
          toast.error("Google Play ödemesi yalnızca Zigo mobil uygulaması üzerinden gerçekleştirilebilir.");
          setLoading(false);
          return;
        }

        // Mock purchaseToken generation for test/web client flow
        purchaseToken = `gplay_token_zigo_plus_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
        orderId = `GPA.${Math.floor(1000 + Math.random() * 9000)}-${Math.floor(1000 + Math.random() * 9000)}-${Math.floor(10000 + Math.random() * 90000)}`;
      }

      const token = await getAccessToken();
      const headers: Record<string, string> = {
        "Content-Type": "application/json",
      };
      if (token) {
        headers["Authorization"] = `Bearer ${token}`;
      }

      // Send purchaseToken to backend verification route
      const response = await fetch("/api/billing/google-play", {
        method: "POST",
        headers,
        body: JSON.stringify({
          planId,
          productId,
          purchaseToken,
          orderId,
          packageName: "com.zigo.app",
        }),
      });

      const result = await response.json().catch(() => ({}));

      if (response.ok) {
        toast.success(
          "30 günlük ücretsiz deneme süreciniz ve ZigoPlus ayrıcalıkları başladı.",
          "🎉 Tebrikler! ZigoPlus Aktif!",
        );
        triggerConfetti();
        if (onSuccess) {
          onSuccess();
        } else {
          setTimeout(() => {
            window.location.reload();
          }, 1200);
        }
      } else {
        const errorMsg = result.error || "Satın alma işlemi tamamlanamadı.";
        toast.error(errorMsg, "Abonelik Hatası");
      }
    } catch (err) {
      console.error("Google Play purchase error:", err);
      const message = err instanceof Error ? err.message : "Ödeme penceresi açılamadı. Lütfen tekrar deneyin.";
      toast.error(
        message,
        "İşlem Başarısız",
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <button
      onClick={() => void handlePurchase()}
      disabled={loading}
      className={className}
      type="button"
    >
      {loading ? (
        <span className="flex items-center justify-center gap-2">
          <svg className="animate-spin size-4 text-slate-950" viewBox="0 0 24 24" fill="none">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
          </svg>
          <span>Google Play Bağlanıyor…</span>
        </span>
      ) : (
        <span>{buttonText}</span>
      )}
    </button>
  );
}

