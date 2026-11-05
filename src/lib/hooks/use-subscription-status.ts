"use client";

import { useEffect, useState } from "react";

export type SubscriptionStatus = {
  isSubscriber: boolean;
  tier: "zigo_plus" | "free" | string;
  isTrial: boolean;
  trialDaysRemaining: number;
  loading: boolean;
};

let cachedStatus: {
  isSubscriber: boolean;
  tier: string;
  isTrial: boolean;
  trialDaysRemaining: number;
} | null = null;

let inflightPromise: Promise<{
  isSubscriber: boolean;
  tier: string;
  isTrial: boolean;
  trialDaysRemaining: number;
}> | null = null;

export function fetchSubscriptionStatus(): Promise<{
  isSubscriber: boolean;
  tier: string;
  isTrial: boolean;
  trialDaysRemaining: number;
}> {
  if (cachedStatus) return Promise.resolve(cachedStatus);
  if (inflightPromise) return inflightPromise;

  inflightPromise = fetch("/api/subscriptions/status")
    .then((res) => (res.ok ? res.json() : null))
    .then((data) => {
      const result = {
        isSubscriber: Boolean(data?.isSubscriber),
        tier: data?.tier || "free",
        isTrial: Boolean(data?.isTrial),
        trialDaysRemaining: Number(data?.trialDaysRemaining || 0),
      };
      cachedStatus = result;
      return result;
    })
    .catch(() => {
      const fallback = {
        isSubscriber: false,
        tier: "free",
        isTrial: false,
        trialDaysRemaining: 0,
      };
      cachedStatus = fallback;
      return fallback;
    })
    .finally(() => {
      inflightPromise = null;
    });

  return inflightPromise;
}

/**
 * Kullanıcının Zigo Plus abonesi olup olmadığını kontrol eden optimize istemci kancası.
 */
export function useSubscriptionStatus(): SubscriptionStatus {
  const [status, setStatus] = useState<SubscriptionStatus>({
    isSubscriber: cachedStatus?.isSubscriber ?? false,
    tier: cachedStatus?.tier ?? "free",
    isTrial: cachedStatus?.isTrial ?? false,
    trialDaysRemaining: cachedStatus?.trialDaysRemaining ?? 0,
    loading: cachedStatus === null,
  });

  useEffect(() => {
    let cancelled = false;

    if (!cachedStatus) {
      void fetchSubscriptionStatus().then((res) => {
        if (!cancelled) {
          setStatus({
            isSubscriber: res.isSubscriber,
            tier: res.tier,
            isTrial: res.isTrial,
            trialDaysRemaining: res.trialDaysRemaining,
            loading: false,
          });
        }
      });
    }

    const handleUpdate = () => {
      cachedStatus = null;
      void fetchSubscriptionStatus().then((res) => {
        if (!cancelled) {
          setStatus({
            isSubscriber: res.isSubscriber,
            tier: res.tier,
            isTrial: res.isTrial,
            trialDaysRemaining: res.trialDaysRemaining,
            loading: false,
          });
        }
      });
    };

    window.addEventListener("zigo:subscription-updated", handleUpdate);
    return () => {
      cancelled = true;
      window.removeEventListener("zigo:subscription-updated", handleUpdate);
    };
  }, []);

  return status;
}
