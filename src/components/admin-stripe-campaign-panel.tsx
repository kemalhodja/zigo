"use client";

import { useEffect, useState } from "react";

import { useMessages } from "@/lib/i18n/locale-context";

type CampaignStatus = {
  campaignActive: boolean;
  stripeKeyConfigured: boolean;
  couponId: string;
  promotionCode: string;
  campaignEndsAt: string;
  discountPercent: number;
};

export function AdminStripeCampaignPanel() {
  const { ops: { admin: a, common: c } } = useMessages();
  const [status, setStatus] = useState<CampaignStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [running, setRunning] = useState(false);
  const [message, setMessage] = useState("");

  useEffect(() => {
    void fetch("/api/admin/stripe/campaign-coupon")
      .then((response) => response.json())
      .then((payload: { data?: CampaignStatus; error?: string }) => {
        if (payload.data) setStatus(payload.data);
        setLoading(false);
      })
      .catch(() => {
        setMessage(c.connectionFailed);
        setLoading(false);
      });
  }, [c.connectionFailed]);

  async function provisionCoupon() {
    setRunning(true);
    setMessage("");
    try {
      const response = await fetch("/api/admin/stripe/campaign-coupon", { method: "POST" });
      const payload = (await response.json().catch(() => null)) as {
        data?: { couponId: string; promotionCode: string; status?: CampaignStatus };
        error?: string;
      } | null;

      if (!response.ok) {
        setMessage(payload?.error ?? a.stripeCampaignFailed);
        return;
      }

      if (payload?.data?.status) setStatus(payload.data.status);
      setMessage(a.stripeCampaignReady.replace("{code}", payload?.data?.promotionCode ?? "YAZ75"));
    } catch {
      setMessage(c.connectionFailed);
    } finally {
      setRunning(false);
    }
  }

  return (
    <section className="-mx-4 border-t border-amber-100 bg-gradient-to-r from-amber-50 via-orange-50 to-yellow-50 px-4 py-4">
      <p className="text-xs font-black uppercase tracking-[0.18em] text-amber-700">{a.stripeCampaignEyebrow}</p>
      <h3 className="mt-1 text-lg font-black text-night">{a.stripeCampaignTitle}</h3>
      <p className="mt-1 text-sm font-semibold leading-6 text-slate-600">{a.stripeCampaignDesc}</p>

      {loading ? <p className="mt-3 text-sm font-bold text-slate-500">{c.loading}</p> : null}

      {status ? (
        <div className="mt-4 grid gap-2 sm:grid-cols-2">
          <StatusChip label={a.stripeCampaignActive} value={status.campaignActive ? c.yes : c.no} />
          <StatusChip label={a.stripeCampaignKey} value={status.stripeKeyConfigured ? c.configured : c.missing} />
          <StatusChip label={a.stripeCampaignCoupon} value={status.couponId} />
          <StatusChip label={a.stripeCampaignCode} value={status.promotionCode} />
        </div>
      ) : null}

      <div className="mt-4 flex flex-wrap gap-2">
        <button
          className="tap-scale rounded-lg bg-gradient-to-r from-amber-500 to-orange-500 px-4 py-2.5 text-xs font-black text-white disabled:opacity-60"
          disabled={running || loading}
          onClick={() => void provisionCoupon()}
          type="button"
        >
          {running ? c.loading : a.stripeCampaignAction}
        </button>
        <a
          className="rounded-lg border border-amber-200 bg-white px-4 py-2.5 text-xs font-black text-night"
          href="https://dashboard.stripe.com/coupons"
          rel="noreferrer"
          target="_blank"
        >
          {a.stripeCampaignOpenStripe}
        </a>
      </div>

      {!status?.stripeKeyConfigured ? (
        <p className="mt-3 rounded-lg border border-amber-200 bg-white px-3 py-2 text-xs font-bold leading-5 text-amber-900">
          {a.stripeCampaignKeyHint}
        </p>
      ) : null}

      {message ? (
        <p className={`mt-3 text-sm font-bold ${message.includes("hata") || message.includes("failed") || message.includes("yapılandır") ? "text-red-600" : "text-emerald-700"}`}>
          {message}
        </p>
      ) : null}
    </section>
  );
}

function StatusChip({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg border border-white/80 bg-white/90 px-3 py-2">
      <p className="text-[0.62rem] font-black uppercase tracking-[0.12em] text-slate-500">{label}</p>
      <p className="mt-0.5 truncate text-sm font-black text-night">{value}</p>
    </div>
  );
}
