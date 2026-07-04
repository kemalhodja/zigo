"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

import { isCapacitorAndroidClient } from "@/lib/client/capacitor-runtime";
import {
  isSubscriptionCampaignActive,
  SUBSCRIPTION_CAMPAIGN,
} from "@/lib/domain/subscription-campaign";
import type { SubscriptionPlanGroup } from "@/lib/domain/subscription-plans";
import { formatTryPrice } from "@/lib/domain/subscription-plans";

type ZigoPlusPlansSectionProps = {
  groups: SubscriptionPlanGroup[];
  hidePrices?: boolean;
  isPremium?: boolean;
  allowDevActivate?: boolean;
};

export function ZigoPlusPlansSection({
  groups,
  hidePrices = false,
  isPremium = false,
  allowDevActivate = false,
}: ZigoPlusPlansSectionProps) {
  const [playStoreOnly, setPlayStoreOnly] = useState(false);
  const [platformMessage, setPlatformMessage] = useState("");
  const campaignActive = isSubscriptionCampaignActive();

  useEffect(() => {
    const android = isCapacitorAndroidClient();
    setPlayStoreOnly(android);
    if (!android) return;

    void fetch("/api/billing/platform")
      .then((response) => response.json())
      .then((payload: { data?: { message?: string | null } }) => {
        setPlatformMessage(payload.data?.message ?? "");
      })
      .catch(() => {
        setPlatformMessage(
          "Android uygulamasında abonelik yakında Google Play üzerinden açılacak. Şimdilik tarayıcıdan zigo web sitesinden abone olabilirsiniz.",
        );
      });
  }, []);

  if (groups.length === 0) return null;

  if (isPremium) {
    return (
      <section className="-mx-4 border-t border-amber-200 bg-gradient-to-r from-amber-400 to-orange-500 px-4 py-5 text-night">
        <p className="text-xs font-black uppercase tracking-[0.18em] text-night/70">Zigo Plus aktif</p>
        <p className="mt-1 text-lg font-black">Aboneliğiniz açık — premium özellikler kullanılabilir.</p>
      </section>
    );
  }

  return (
    <section className="-mx-4 space-y-4 border-t border-slate-200 bg-slate-950 px-4 py-5 text-white">
      {campaignActive ? (
        <div className="rounded-xl border border-amber-300/40 bg-gradient-to-r from-amber-500/20 to-orange-500/20 p-4">
          <p className="text-xs font-black uppercase tracking-[0.18em] text-amber-200">
            {SUBSCRIPTION_CAMPAIGN.headline} · {SUBSCRIPTION_CAMPAIGN.badgeLabel}
          </p>
          <p className="mt-1 text-base font-black leading-snug text-white">{SUBSCRIPTION_CAMPAIGN.description}</p>
        </div>
      ) : null}

      <div>
        <p className="text-xs font-black uppercase tracking-[0.2em] text-amber-300">Abone ol</p>
        <h2 className="mt-1 text-xl font-black leading-tight">Zigo Plus planını seç</h2>
        <p className="mt-2 text-sm font-semibold text-white/75">
          Kayıt sonrası profil ekranınızdan abonelik özelliklerini ve güncel fiyatları görebilirsiniz.
        </p>
      </div>

      {groups.map((group) => (
        <PlanGroupCard
          allowDevActivate={allowDevActivate}
          campaignActive={campaignActive}
          group={group}
          hidePrices={hidePrices}
          key={group.id}
          playStoreOnly={playStoreOnly}
          platformMessage={platformMessage}
        />
      ))}
    </section>
  );
}

function PlanGroupCard({
  group,
  allowDevActivate,
  hidePrices,
  playStoreOnly,
  platformMessage,
  campaignActive,
}: {
  group: SubscriptionPlanGroup;
  allowDevActivate: boolean;
  hidePrices: boolean;
  playStoreOnly: boolean;
  platformMessage: string;
  campaignActive: boolean;
}) {
  return (
    <article className="rounded-xl border border-white/15 bg-white/5 p-4">
      <h3 className="text-lg font-black text-white">{group.title}</h3>
      <p className="mt-1 text-sm font-semibold text-white/70">{group.subtitle}</p>

      {playStoreOnly && platformMessage ? (
        <p className="mt-3 rounded-lg border border-amber-300/30 bg-amber-400/10 px-3 py-2 text-xs font-bold leading-5 text-amber-100">
          {platformMessage}
        </p>
      ) : null}

      <ul className="mt-3 space-y-2 text-sm font-semibold leading-6 text-white/85">
        {group.benefits.map((benefit) => (
          <li className="flex gap-2" key={benefit}>
            <span aria-hidden="true">✦</span>
            <span>{benefit}</span>
          </li>
        ))}
      </ul>

      <div className="mt-4 grid gap-2">
        {group.plans.map((item) => (
          <PlanPriceRow
            allowDevActivate={allowDevActivate}
            campaignActive={campaignActive}
            compareAtTry={item.compareAtTry}
            hidePrices={hidePrices}
            intervalLabel={item.intervalLabel}
            key={item.id}
            planId={item.id}
            playStoreOnly={playStoreOnly}
            priceTry={item.priceTry}
          />
        ))}
      </div>
    </article>
  );
}

function PlanPriceRow({
  planId,
  intervalLabel,
  priceTry,
  compareAtTry,
  allowDevActivate,
  hidePrices,
  playStoreOnly,
  campaignActive,
}: {
  planId: string;
  intervalLabel: string;
  priceTry: number;
  compareAtTry: number;
  allowDevActivate: boolean;
  hidePrices: boolean;
  playStoreOnly: boolean;
  campaignActive: boolean;
}) {
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");

  async function subscribe() {
    if (playStoreOnly) {
      setMessage("Abonelik için tarayıcıdan zigo web sitesini kullanın.");
      return;
    }

    setLoading(true);
    setMessage("");
    try {
      const response = await fetch("/api/billing/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ planId }),
      });
      const payload = (await response.json().catch(() => null)) as {
        data?: { url?: string };
        error?: string;
      } | null;

      if (response.status === 503 && allowDevActivate) {
        await devActivate();
        return;
      }

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
    try {
      const response = await fetch("/api/billing/dev-activate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ planId }),
      });
      const payload = (await response.json().catch(() => null)) as { error?: string } | null;
      if (!response.ok) {
        setMessage(payload?.error ?? "Demo aktivasyon başarısız.");
        setLoading(false);
        return;
      }
      window.location.reload();
    } catch {
      setMessage("Bağlantı hatası.");
      setLoading(false);
    }
  }

  return (
    <div className="rounded-lg bg-white/10 px-3 py-3">
      <div className="flex items-center justify-between gap-3">
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <p className="text-sm font-black text-white">{intervalLabel}</p>
            {campaignActive ? (
              <span className="rounded-full bg-amber-400 px-2 py-0.5 text-[0.62rem] font-black uppercase tracking-wide text-night">
                {SUBSCRIPTION_CAMPAIGN.badgeLabel}
              </span>
            ) : null}
          </div>
          {hidePrices ? null : (
            <p className="mt-1 flex flex-wrap items-baseline gap-2">
              <span className="text-xs font-bold text-white/50 line-through">{formatTryPrice(compareAtTry)}</span>
              <span className="text-lg font-black text-amber-300">{formatTryPrice(priceTry)}</span>
            </p>
          )}
        </div>
        <div className="flex shrink-0 flex-col gap-2">
          <button
            className="tap-scale rounded-lg bg-white px-4 py-2.5 text-xs font-black text-night disabled:opacity-60"
            disabled={loading || playStoreOnly}
            onClick={() => void subscribe()}
            type="button"
          >
            {playStoreOnly ? "Kart (web)" : loading ? "..." : "Kart ile öde"}
          </button>
          {playStoreOnly ? null : (
            <Link
              className="tap-scale rounded-lg border border-white/30 px-4 py-2.5 text-center text-xs font-black text-white"
              href={`/billing/havale?planId=${encodeURIComponent(planId)}`}
            >
              Havale / EFT
            </Link>
          )}
        </div>
      </div>
      {message ? <p className="mt-2 text-xs font-bold text-amber-200">{message}</p> : null}
    </div>
  );
}
