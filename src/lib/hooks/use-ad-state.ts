/**
 * useAdState Hook
 * 
 * Client-side hook for managing ad state and checking ad gates.
 * Provides reactive ad-free status and ad watch functionality.
 */

import { useState, useEffect, useCallback } from "react";

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

/**
 * Hook to check if current user is ad-free
 */
export function useAdState(userId: string | null | undefined) {
  const [adState, setAdState] = useState<AdState>({
    isAdFree: false,
    reason: "none",
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!userId) {
      setLoading(false);
      return;
    }

    const fetchAdState = async () => {
      try {
        setLoading(true);
        setError(null);

        const response = await fetch(`/api/ads/state?userId=${userId}`);
        
        if (!response.ok) {
          throw new Error("Failed to fetch ad state");
        }

        const data = await response.json();
        setAdState(data);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Unknown error");
      } finally {
        setLoading(false);
      }
    };

    fetchAdState();
  }, [userId]);

  return { adState, loading, error };
}

/**
 * Hook to check ad gate for specific actions
 */
export function useAdGate(userId: string | null | undefined) {
  const [gateResult, setGateResult] = useState<AdGateResult>({
    canProceed: false,
    requiresAd: false,
    adState: {
      isAdFree: false,
      reason: "none",
    },
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!userId) {
      setLoading(false);
      return;
    }

    const checkGate = async () => {
      try {
        setLoading(true);

        const response = await fetch(`/api/ads/gate?userId=${userId}`);
        
        if (!response.ok) {
          throw new Error("Failed to check ad gate");
        }

        const data = await response.json();
        setGateResult(data);
      } catch (err) {
        console.error("Ad gate check failed:", err);
      } finally {
        setLoading(false);
      }
    };

    checkGate();
  }, [userId]);

  return { gateResult, loading };
}

/**
 * Hook to watch a rewarded ad
 */
export function useWatchAd(userId: string | null | undefined) {
  const [watching, setWatching] = useState(false);
  const [result, setResult] = useState<{
    success: boolean;
    adFreeUntil?: Date;
    hoursGranted?: number;
    error?: string;
  } | null>(null);

  const watchAd = useCallback(async (hoursToAdd: number = 2) => {
    if (!userId || watching) return;

    try {
      setWatching(true);
      setResult(null);

      const response = await fetch("/api/ads/watch", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          userId,
          hoursToAdd,
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to process ad");
      }

      const data = await response.json();
      setResult(data);
      return data;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Unknown error";
      setResult({
        success: false,
        error: errorMessage,
      });
      return { success: false, error: errorMessage };
    } finally {
      setWatching(false);
    }
  }, [userId, watching]);

  const resetResult = useCallback(() => {
    setResult(null);
  }, []);

  return { watchAd, watching, result, resetResult };
}

/**
 * Hook to upgrade to premium
 */
export function useUpgradePremium(userId: string | null | undefined) {
  const [upgrading, setUpgrading] = useState(false);
  const [result, setResult] = useState<{ success: boolean; error?: string } | null>(null);

  const upgrade = useCallback(async () => {
    if (!userId || upgrading) return;

    try {
      setUpgrading(true);
      setResult(null);

      const response = await fetch("/api/ads/upgrade", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ userId }),
      });

      if (!response.ok) {
        throw new Error("Failed to upgrade to premium");
      }

      const data = await response.json();
      setResult({ success: data.success });
      return data;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Unknown error";
      setResult({
        success: false,
        error: errorMessage,
      });
      return { success: false, error: errorMessage };
    } finally {
      setUpgrading(false);
    }
  }, [userId, upgrading]);

  const resetResult = useCallback(() => {
    setResult(null);
  }, []);

  return { upgrade, upgrading, result, resetResult };
}