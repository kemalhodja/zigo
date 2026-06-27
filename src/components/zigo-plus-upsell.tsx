"use client";

import { useState } from "react";

import { ZIGO_PLUS_BENEFITS } from "@/lib/domain/focus-gamification";
import {
  isSubscriptionCampaignActive,
  SUBSCRIPTION_CAMPAIGN,
} from "@/lib/domain/subscription-campaign";

type ZigoPlusUpsellProps = {
  compact?: boolean;
  isPremium?: boolean;
  allowDevActivate?: boolean;
  benefits?: readonly string[];
  headline?: string;
};

export function ZigoPlusUpsell({
  compact = false,
  isPremium = false,
  allowDevActivate = false,
  benefits = ZIGO_PLUS_BENEFITS,
  headline = "Premium çalışma araçlarıyla daha verimli odaklan",
}: ZigoPlusUpsellProps) {
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const campaignActive = isSubscriptionCampaignActive();

  async function startCheckout() {
    setLoading(true);
    setMessage("");
    try {
      const response = await fetch("/api/billing/checkout", { method: "POST" });
      const payload = (await response.json().catch(() => null)) as { data?: { url?: string }; error?: string } | null;
      if (!response.ok || !payload?.data?.url) {
        setMessage(payload?.error ?? "Ödeme başlatılamadı.");
        setLoading(false);
        return;
      }
      window.location.href = payload.data.url;
    } catch {
      setMessage("Bağlantı hatası.");
      setLoading(false);
    }
  }

  async function devActivate() {
    setLoading(true);
    setMessage("");
    try {
      const response = await fetch("/api/billing/dev-activate", { method: "POST" });
      const payload = (await response.json().catch(() => null)) as { error?: string } | null;
      if (!response.ok) {
        setMessage(payload?.error ?? "Aktivasyon başarısız.");
        setLoading(false);
        return;
      }
      setMessage("Zigo Plus yerel demo için etkinleştirildi.");
      window.location.reload();
    } catch {
      setMessage("Bağlantı hatası.");
      setLoading(false);
    }
  }

  if (isPremium) {
    return (
      <section className="-mx-4 bg-gradient-to-r from-amber-400 to-orange-500 px-4 py-4 text-night">
        <p className="text-xs font-black uppercase tracking-[0.18em] text-night/70">Zigo Plus aktif</p>
        <p className="mt-1 text-sm font-black">Gelişmiş analitik, kişisel planlar ve reklamsız odak açık.</p>
      </section>
    );
  }

  const stripeReady = process.env.NEXT_PUBLIC_STRIPE_CHECKOUT_ENABLED === "true";
  const devReady = allowDevActivate && (process.env.NEXT_PUBLIC_SUPABASE_URL?.includes("127.0.0.1") || process.env.NEXT_PUBLIC_ZIGO_BILLING_DEV_BYPASS === "true");

  return (
    <section className={`-mx-4 ${compact ? "px-4 py-3" : "px-4 py-4"} bg-slate-950 text-white`}>
      {campaignActive ? (
        <p className="mb-2 inline-flex rounded-full bg-amber-400 px-3 py-1 text-[0.65rem] font-black uppercase tracking-wide text-night">
          {SUBSCRIPTION_CAMPAIGN.headline} · {SUBSCRIPTION_CAMPAIGN.badgeLabel}
        </p>
      ) : null}
      <p className="text-xs font-black uppercase tracking-[0.18em] text-amber-300">Zigo Plus</p>
      <h2 className="mt-1 text-lg font-black leading-tight">{headline}</h2>
      {campaignActive && !compact ? (
        <p className="mt-2 text-sm font-bold text-amber-100">{SUBSCRIPTION_CAMPAIGN.description}</p>
      ) : null}
      {!compact ? (
        <ul className="mt-3 space-y-2 text-sm font-semibold leading-6 text-white/85">
          {benefits.map((benefit) => (
            <li className="flex gap-2" key={benefit}>
              <span aria-hidden="true">✦</span>
              <span>{benefit}</span>
            </li>
          ))}
        </ul>
      ) : (
        <p className="mt-2 text-sm font-bold text-white/80">
          Analitik, kişisel planlar ve reklamsız odak — aylık abonelik.
          {campaignActive ? ` ${SUBSCRIPTION_CAMPAIGN.description}` : ""}
        </p>
      )}
      <div className="mt-3 flex flex-wrap gap-2">
        {stripeReady ? (
          <button
            className="tap-scale rounded-lg bg-white px-4 py-2.5 text-xs font-black text-night disabled:opacity-60"
            disabled={loading}
            onClick={() => void startCheckout()}
            type="button"
          >
            {campaignActive ? "Kampanyayla abone ol" : "Stripe ile abone ol"}
          </button>
        ) : null}
        {devReady ? (
          <button
            className="rounded-lg border border-white/30 px-4 py-2.5 text-xs font-black text-white disabled:opacity-60"
            disabled={loading}
            onClick={() => void devActivate()}
            type="button"
          >
            Demo Plus'ı etkinleştir
          </button>
        ) : null}
        {!stripeReady && !devReady ? (
          <p className="text-xs font-bold text-white/70">Stripe anahtarlarını ekleyin veya yerel demo billing bypass'ı açın.</p>
        ) : null}
      </div>
      {message ? <p className="mt-2 text-sm font-bold text-amber-200">{message}</p> : null}
    </section>
  );
}
