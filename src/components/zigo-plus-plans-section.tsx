"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

import { isCapacitorAndroidClient } from "@/lib/client/capacitor-runtime";
import type { EducationOrganizationType } from "@/lib/domain/education-organization";
import { buildOrganizationSalesWhatsAppUrl } from "@/lib/domain/organization-sales";
import {
  isSubscriptionCampaignActive,
  SUBSCRIPTION_CAMPAIGN,
} from "@/lib/domain/subscription-campaign";
import type { SubscriptionPlanGroup } from "@/lib/domain/subscription-plans";
import { formatTryPrice } from "@/lib/domain/subscription-plans";
import { useMessages } from "@/lib/i18n/locale-context";

type ZigoPlusPlansSectionProps = {
  groups: SubscriptionPlanGroup[];
  hidePrices?: boolean;
  isPremium?: boolean;
  isTrial?: boolean;
  userCreatedAt?: string | Date | null;
  allowDevActivate?: boolean;
  organizationType?: EducationOrganizationType | null;
  organizationName?: string | null;
};

export function ZigoPlusPlansSection({
  groups,
  hidePrices = false,
  isPremium = false,
  isTrial = false,
  userCreatedAt = null,
  allowDevActivate = false,
  organizationType = null,
  organizationName = null,
}: ZigoPlusPlansSectionProps) {
  const b = useMessages().billingUi;
  const [playStoreOnly, setPlayStoreOnly] = useState(false);
  const [platformMessage, setPlatformMessage] = useState("");
  const campaignActive = isSubscriptionCampaignActive();

  let trialDaysRemaining = 30;
  let isWithinTrial = true;
  if (userCreatedAt) {
    const createdTime = new Date(userCreatedAt).getTime();
    const diffTime = Math.abs(Date.now() - createdTime);
    const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
    trialDaysRemaining = Math.max(0, 30 - diffDays);
    isWithinTrial = diffDays <= 30;
  }

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
        setPlatformMessage(b.androidFallback);
      });
  }, [b.androidFallback]);

  if (groups.length === 0) return null;

  if (isPremium && !isTrial) {
    return (
      <section className="-mx-4 border-t border-amber-200 bg-gradient-to-r from-amber-400 to-orange-500 px-4 py-5 text-night">
        <p className="text-xs font-black uppercase tracking-[0.18em] text-night/70">{b.plusActiveEyebrow}</p>
        <p className="mt-1 text-lg font-black">{b.plusActiveTitle}</p>
      </section>
    );
  }

  return (
    <section
      className="-mx-4 space-y-4 border-t border-slate-200 bg-slate-950 px-4 py-5 text-white"
      id="zigo-plus-plans"
    >
      {!hidePrices ? (
        <div className="rounded-xl border border-amber-300/40 bg-gradient-to-r from-amber-500/20 to-orange-500/20 p-4">
          <div className="flex items-center justify-between gap-2">
            <p className="text-xs font-black uppercase tracking-[0.18em] text-amber-200">
              🎁 30 Gün Ücretsiz Deneme {isWithinTrial ? `· Kalan: ${trialDaysRemaining} Gün` : "· Süre Doldu"}
            </p>
            <span className="rounded-full bg-amber-400 px-2 py-0.5 text-[0.65rem] font-black uppercase tracking-wider text-night">
              {isWithinTrial ? "%50 İNDİRİM FIRSATI" : "STANDART LİSTE FİYATI"}
            </span>
          </div>
          <p className="mt-2 text-sm font-bold leading-snug text-white">
            {isWithinTrial
              ? `Ücretsiz 30 günlük tam deneme sürenizin bitmesine ${trialDaysRemaining} gün kaldı! Şimdi kaydolun ve tüm planlarda %50 indirim avantajını yakalayın.`
              : "30 günlük ücretsiz deneme süreniz doldu. Planlara tam liste fiyatıyla devam edebilirsiniz."}
          </p>
        </div>
      ) : null}

      <div>
        <p className="text-xs font-black uppercase tracking-[0.2em] text-amber-300">
          {hidePrices ? b.salesEyebrow : b.subscribeEyebrow}
        </p>
        <h2 className="mt-1 text-xl font-black leading-tight">
          {hidePrices ? b.salesTitle : b.subscribeTitle}
        </h2>
        <p className="mt-2 text-sm font-semibold text-white/75">
          {hidePrices ? b.salesDesc : b.subscribeDesc}
        </p>
      </div>

      {groups.map((group) => (
        <PlanGroupCard
          allowDevActivate={allowDevActivate}
          campaignActive={campaignActive}
          group={group}
          hidePrices={hidePrices}
          key={group.id}
          organizationName={organizationName}
          organizationType={organizationType}
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
  organizationType,
  organizationName,
}: {
  group: SubscriptionPlanGroup;
  allowDevActivate: boolean;
  hidePrices: boolean;
  playStoreOnly: boolean;
  platformMessage: string;
  campaignActive: boolean;
  organizationType: EducationOrganizationType | null;
  organizationName: string | null;
}) {
  const b = useMessages().billingUi;
  const salesUrl = hidePrices
    ? buildOrganizationSalesWhatsAppUrl({
        organizationType,
        organizationName,
        planTitle: group.title,
      })
    : null;

  return (
    <article className="rounded-xl border border-white/15 bg-white/5 p-4">
      <h3 className="text-lg font-black text-white">{group.title}</h3>
      <p className="mt-1 text-sm font-semibold text-white/70">{group.subtitle}</p>

      {playStoreOnly && !hidePrices ? (
        <div className="mt-3 space-y-1.5 rounded-lg border border-emerald-400/30 bg-emerald-950/30 p-3 text-xs font-bold text-emerald-100">
          <p className="flex items-center gap-1.5 text-amber-300">
            <svg aria-hidden="true" className="size-4 fill-current" viewBox="0 0 24 24">
              <path d="M3.609 1.814L13.792 12 3.61 22.186a1.99 1.99 0 0 1-.61-1.42V3.234c0-.553.224-1.053.609-1.42zM15.206 13.414l2.585 2.585-12.87 7.43 10.285-10.015zM15.206 10.586L4.921 .571l12.87 7.43-2.585 2.585zM19.393 12l2.366-1.366c.64-.37.64-1.63 0-2l-2.366-1.366-2.585 2.585L19.393 12z" />
            </svg>
            <span>Google Play Resmi Fatura & İptal Koşulları</span>
          </p>
          <p className="text-[0.72rem] font-medium leading-relaxed text-white/80">
            Android uygulamasında aboneliğiniz yalnızca Google Play hesabınız üzerinden güvenle gerçekleştirilir. Dilediğiniz zaman Google Play Ödemeler ve Abonelikler menüsünden yönetebilirsiniz.
          </p>
        </div>
      ) : null}

      <ul className="mt-3 space-y-2 text-sm font-semibold leading-6 text-white/85">
        {group.benefits.map((benefit) => (
          <li className="flex gap-2" key={benefit}>
            <span aria-hidden="true">✦</span>
            <span>{benefit}</span>
          </li>
        ))}
      </ul>

      {hidePrices ? (
        <div className="mt-4 space-y-2">
          {salesUrl ? (
            <a
              className="tap-scale inline-flex w-full items-center justify-center rounded-lg bg-[#25D366] px-4 py-3 text-sm font-black text-white"
              href={salesUrl}
              rel="noopener noreferrer"
              target="_blank"
            >
              {b.salesCta}
            </a>
          ) : (
            <p className="rounded-lg bg-white/10 px-3 py-2 text-xs font-bold text-amber-100">{b.salesLineMissing}</p>
          )}
          <p className="text-xs font-semibold text-white/55">{b.salesSelfServeClosed}</p>
        </div>
      ) : (
        <div className="mt-4 grid gap-2">
          {group.plans.map((item) => (
            <PlanPriceRow
              allowDevActivate={allowDevActivate}
              campaignActive={campaignActive}
              compareAtTry={item.compareAtTry}
              intervalLabel={item.intervalLabel}
              key={item.id}
              planId={item.id}
              playStoreOnly={playStoreOnly}
              priceTry={item.priceTry}
            />
          ))}
        </div>
      )}
    </article>
  );
}

function PlanPriceRow({
  planId,
  intervalLabel,
  priceTry,
  compareAtTry,
  allowDevActivate,
  playStoreOnly,
  campaignActive,
}: {
  planId: string;
  intervalLabel: string;
  priceTry: number;
  compareAtTry: number;
  allowDevActivate: boolean;
  playStoreOnly: boolean;
  campaignActive: boolean;
}) {
  const b = useMessages().billingUi;
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");

  async function subscribeGooglePlay() {
    setLoading(true);
    setMessage("");
    
    let purchaseToken: string | null = null;
    let orderId: string | null = null;
    const productId = "zigo_plus";

    // Detect Capacitor environment
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
        console.error("Native Google Play purchase failed:", nativeErr);
        setMessage("Ödeme ekranı açılamadı. Lütfen Play Store ayarlarınızı kontrol edin.");
        setLoading(false);
        return;
      }
    }

    if (!purchaseToken) {
      if (process.env.NODE_ENV === "production") {
        setMessage("Google Play ödemesi yalnızca Zigo mobil uygulaması üzerinden gerçekleştirilebilir.");
        setLoading(false);
        return;
      }
      
      purchaseToken = `gplay_token_${Math.random().toString(36).substring(2, 12)}`;
      orderId = `GPA.${Math.floor(1000 + Math.random() * 9000)}-${Math.floor(1000 + Math.random() * 9000)}-${Math.floor(1000 + Math.random() * 9000)}-${Math.floor(10000 + Math.random() * 90000)}`;
    }

    try {
      const response = await fetch("/api/billing/google-play", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          planId,
          productId,
          purchaseToken,
          packageName: "com.zigo.app",
          orderId,
        }),
      });

      const payload = (await response.json().catch(() => null)) as {
        error?: string;
      } | null;

      if (!response.ok) {
        setMessage(payload?.error ?? b.playVerifyFailed);
        setLoading(false);
        return;
      }

      setMessage(b.playSuccess);
      await new Promise((resolve) => setTimeout(resolve, 800));
      window.location.reload();
    } catch {
      setMessage(b.connectionFailed);
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
          <p className="mt-1 flex flex-wrap items-baseline gap-2">
            <span className="text-xs font-bold text-white/50 line-through">{formatTryPrice(compareAtTry)}</span>
            <span className="text-lg font-black text-amber-300">{formatTryPrice(priceTry)}</span>
          </p>
        </div>
        <div className="flex shrink-0 flex-col gap-2">
          {playStoreOnly ? (
            <button
              className="tap-scale flex items-center justify-center gap-1.5 rounded-lg bg-emerald-500 px-4 py-2.5 text-xs font-black text-white shadow-md transition hover:bg-emerald-600 disabled:opacity-60"
              disabled={loading}
              onClick={() => void subscribeGooglePlay()}
              type="button"
            >
              <svg aria-hidden="true" className="size-4 fill-current" viewBox="0 0 24 24">
                <path d="M3.609 1.814L13.792 12 3.61 22.186a1.99 1.99 0 0 1-.61-1.42V3.234c0-.553.224-1.053.609-1.42zM15.206 13.414l2.585 2.585-12.87 7.43 10.285-10.015zM15.206 10.586L4.921 .571l12.87 7.43-2.585 2.585zM19.393 12l2.366-1.366c.64-.37.64-1.63 0-2l-2.366-1.366-2.585 2.585L19.393 12z" />
              </svg>
              <span>{loading ? b.loading : "Google Play ile Abone Ol"}</span>
            </button>
          ) : (
            <Link
              className="tap-scale rounded-lg bg-gradient-to-r from-amber-400 to-orange-500 px-4 py-2.5 text-xs font-black text-slate-950 shadow-md hover:brightness-105"
              href={`/billing/havale?planId=${encodeURIComponent(planId)}`}
            >
              🏦 Banka Bilgileri & Dekont Gönder ↗
            </Link>
          )}
        </div>
      </div>
      {message ? <p className="mt-2 text-xs font-bold text-amber-300">{message}</p> : null}
    </div>
  );
}
