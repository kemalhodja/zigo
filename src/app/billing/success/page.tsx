"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";

import { createClient } from "@/lib/supabase/client";

type ActivationStatus = "pending" | "active" | "timeout";

function useActivationPoller(skip: boolean): ActivationStatus {
  const [status, setStatus] = useState<ActivationStatus>("pending");

  useEffect(() => {
    if (skip) {
      setStatus("active");
      return;
    }

    const supabase = createClient();
    let attempts = 0;
    const MAX_ATTEMPTS = 12; // 12 × 5s = 60s max

    const check = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return;

        // Check user_subscriptions (multi-row safe)
        const { data: subs } = await (supabase.from("user_subscriptions") as unknown as {
          select: (cols: string) => {
            eq: (col: string, val: string) => {
              order: (col2: string, opts: { ascending: boolean }) => {
                limit: (n: number) => Promise<{
                  data: Array<{
                    tier?: string | null;
                    status?: string | null;
                    current_period_end?: string | null;
                    expires_at?: string | null;
                  }> | null;
                }>;
              };
            };
          };
        })
          .select("tier, status, current_period_end, expires_at")
          .eq("user_id", user.id)
          .order("updated_at", { ascending: false })
          .limit(5);

        if (Array.isArray(subs) && subs.length > 0) {
          const now = Date.now();
          const isActive = subs.some((s) => {
            const isPlus = s.tier === "zigo_plus" || s.status === "active";
            if (!isPlus) return false;
            const end = s.current_period_end || s.expires_at;
            return !end || new Date(end).getTime() > now;
          });

          if (isActive) {
            setStatus("active");
            return;
          }
        }

        // Fallback: check users.is_premium
        const { data: userData } = await supabase
          .from("users")
          .select("is_premium")
          .eq("id", user.id)
          .maybeSingle();

        if (userData?.is_premium === true) {
          setStatus("active");
          return;
        }
      } catch {
        // silent
      }

      attempts++;
      if (attempts >= MAX_ATTEMPTS) {
        setStatus("timeout");
      }
    };

    // First check immediately
    check();
    const interval = setInterval(check, 5000);
    return () => clearInterval(interval);
  }, [skip]);

  return status;
}

export default function BillingSuccessPage() {
  const searchParams = useSearchParams();
  const kind = searchParams.get("kind");
  const isSponsor = kind === "sponsor";
  const isGooglePlay = kind === "google_play";
  // Google Play activates synchronously; Stripe needs webhook — poll for it
  const activationStatus = useActivationPoller(isSponsor || isGooglePlay);

  const title = isSponsor
    ? "Sponsorluk ödemesi alındı"
    : isGooglePlay
      ? "Google Play aboneliği aktif"
      : "Zigo Plus etkinleştirildi";

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-violet-50 to-fuchsia-50 px-4">
      <div className="w-full max-w-md rounded-2xl bg-white shadow-xl p-8 text-center space-y-5">
        {/* Icon */}
        <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-gradient-to-tr from-violet-500 to-fuchsia-500 text-white text-3xl shadow-lg">
          {isSponsor ? "🎯" : activationStatus === "active" ? "✅" : activationStatus === "timeout" ? "⚠️" : "⏳"}
        </div>

        <h1 className="text-2xl font-black text-slate-900">{title}</h1>

        {/* Status message */}
        {isSponsor || isGooglePlay ? (
          <p className="text-slate-600 font-semibold">
            {isSponsor
              ? "Ödemeniz tamamlandı. Kampanyanız kısa süre içinde aktif görünür."
              : "Google Play aboneliğiniz başarıyla tamamlandı. Premium özellikler açıldı!"}
          </p>
        ) : activationStatus === "active" ? (
          <div className="space-y-2">
            <p className="text-emerald-600 font-black text-lg">🎉 Abonelik aktif!</p>
            <p className="text-slate-600 font-semibold">Zigo Plus'a hoş geldiniz. Tüm premium özellikler açıldı.</p>
          </div>
        ) : activationStatus === "timeout" ? (
          <div className="space-y-2">
            <p className="text-amber-600 font-bold">Aktivasyon bekliyor…</p>
            <p className="text-slate-500 text-sm">
              Ödemeniz alındı ancak aktivasyon biraz zaman alabilir.
              Birkaç dakika sonra sayfayı yenileyin veya{" "}
              <a href="mailto:destek@zigo.app" className="text-violet-600 underline">destek@zigo.app</a>{" "}
              ile iletişime geçin.
            </p>
          </div>
        ) : (
          <div className="space-y-2">
            <div className="flex items-center justify-center gap-2 text-violet-600 font-bold">
              <span className="animate-spin inline-block h-4 w-4 border-2 border-violet-600 border-t-transparent rounded-full" />
              <span>Abonelik aktifleştiriliyor…</span>
            </div>
            <p className="text-slate-500 text-sm">
              Ödemeniz alındı. Stripe webhook bağlantısı senkronize ediliyor.
            </p>
          </div>
        )}

        {/* CTA buttons */}
        <div className="flex flex-col gap-3 pt-2">
          {isSponsor ? (
            <Link
              href="/profile"
              className="w-full py-3 rounded-xl bg-gradient-to-r from-violet-600 to-fuchsia-600 text-white font-black text-sm shadow hover:brightness-105 transition"
            >
              Profile Dön
            </Link>
          ) : (
            <>
              <Link
                href="/student"
                className="w-full py-3 rounded-xl bg-gradient-to-r from-violet-600 to-fuchsia-600 text-white font-black text-sm shadow hover:brightness-105 transition"
              >
                Öğrenci Panelim
              </Link>
              <Link
                href="/learn"
                className="w-full py-3 rounded-xl border border-slate-200 text-slate-700 font-black text-sm hover:bg-slate-50 transition"
              >
                Öğrenmeye Başla
              </Link>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
