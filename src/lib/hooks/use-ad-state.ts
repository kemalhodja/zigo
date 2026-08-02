/**
 * Client hooks for ad-free state and AdGate actions.
 * APIs use the signed-in session — userId only gates whether we call them.
 */

import { useCallback, useEffect, useState } from "react";

export interface AdState {
  isAdFree: boolean;
  reason: "premium" | "trial" | "ad_free_until" | "none";
  adFreeUntil?: Date | null;
  isPremium?: boolean;
}

export interface AdGateResult {
  canProceed: boolean;
  requiresAd: boolean;
  adState: AdState;
}

export function useAdState(userId: string | null | undefined) {
  const [adState, setAdState] = useState<AdState>({
    isAdFree: false,
    reason: "none",
  });
  const [loading, setLoading] = useState(Boolean(userId));
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!userId) {
      setLoading(false);
      return;
    }

    let cancelled = false;

    const fetchAdState = async () => {
      try {
        setLoading(true);
        setError(null);
        const response = await fetch("/api/ads/state");
        if (!response.ok) throw new Error("Failed to fetch ad state");
        const data = (await response.json()) as AdState;
        if (!cancelled) setAdState(data);
      } catch (err) {
        if (!cancelled) setError(err instanceof Error ? err.message : "Unknown error");
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    void fetchAdState();
    return () => {
      cancelled = true;
    };
  }, [userId]);

  return { adState, loading, error };
}

export function useAdGate(userId: string | null | undefined) {
  const [gateResult, setGateResult] = useState<AdGateResult>({
    canProceed: false,
    requiresAd: false,
    adState: {
      isAdFree: false,
      reason: "none",
    },
  });
  const [loading, setLoading] = useState(Boolean(userId));

  const refresh = useCallback(async () => {
    if (!userId) {
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      const response = await fetch("/api/ads/gate");
      if (!response.ok) throw new Error("Failed to check ad gate");
      const data = (await response.json()) as AdGateResult;
      setGateResult(data);
    } catch (err) {
      console.error("Ad gate check failed:", err);
    } finally {
      setLoading(false);
    }
  }, [userId]);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  return { gateResult, loading, refresh };
}

export function useWatchAd(userId: string | null | undefined) {
  const [watching, setWatching] = useState(false);
  const [result, setResult] = useState<{
    success: boolean;
    adFreeUntil?: Date;
    hoursGranted?: number;
    error?: string;
  } | null>(null);

  const watchAd = useCallback(
    async (hoursToAdd: number = 2) => {
      if (!userId || watching) {
        return { success: false, error: "Sign in required." };
      }

      try {
        setWatching(true);
        setResult(null);

        const response = await fetch("/api/ads/watch", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ hoursToAdd }),
        });

        if (!response.ok) {
          const payload = (await response.json().catch(() => null)) as { error?: string } | null;
          throw new Error(payload?.error ?? "Failed to process ad");
        }

        const data = (await response.json()) as {
          success: boolean;
          adFreeUntil?: string;
          hoursGranted?: number;
        };
        const next = {
          success: Boolean(data.success),
          adFreeUntil: data.adFreeUntil ? new Date(data.adFreeUntil) : undefined,
          hoursGranted: data.hoursGranted,
        };
        setResult(next);
        return next;
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : "Unknown error";
        const next = { success: false, error: errorMessage };
        setResult(next);
        return next;
      } finally {
        setWatching(false);
      }
    },
    [userId, watching],
  );

  const resetResult = useCallback(() => {
    setResult(null);
  }, []);

  return { watchAd, watching, result, resetResult };
}
