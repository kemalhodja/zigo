"use client";

import { useEffect, useState, useCallback } from "react";

/**
 * Hook to manage offline-resilient local state with automatic sync queue.
 * Persists data to localStorage and detects online/offline status.
 */
export function useOfflineState<T>(
  storageKey: string,
  initialValue: T
): [T, (val: T | ((prev: T) => T)) => void, { isOnline: boolean; pendingSyncCount: number; syncPending: () => Promise<void> }] {
  const [isOnline, setIsOnline] = useState(
    typeof navigator !== "undefined" ? navigator.onLine : true
  );

  const [state, setStateInternal] = useState<T>(() => {
    if (typeof window === "undefined") return initialValue;
    try {
      const saved = localStorage.getItem(storageKey);
      return saved ? JSON.parse(saved) : initialValue;
    } catch {
      return initialValue;
    }
  });

  const [pendingSyncCount, setPendingSyncCount] = useState<number>(() => {
    if (typeof window === "undefined") return 0;
    try {
      const queue = localStorage.getItem(`${storageKey}:sync_queue`);
      return queue ? JSON.parse(queue).length : 0;
    } catch {
      return 0;
    }
  });

  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);

    // Register service worker if supported
    if ("serviceWorker" in navigator && process.env.NODE_ENV === "production") {
      navigator.serviceWorker.register("/sw.js").catch(() => {});
    }

    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
    };
  }, []);

  const setValue = useCallback(
    (valueOrFn: T | ((prev: T) => T)) => {
      setStateInternal((prev) => {
        const next =
          typeof valueOrFn === "function"
            ? (valueOrFn as (prev: T) => T)(prev)
            : valueOrFn;

        if (typeof window !== "undefined") {
          try {
            localStorage.setItem(storageKey, JSON.stringify(next));

            // If offline, append to sync queue
            if (!navigator.onLine) {
              const queueKey = `${storageKey}:sync_queue`;
              const queueRaw = localStorage.getItem(queueKey);
              const queue = queueRaw ? JSON.parse(queueRaw) : [];
              queue.push({ data: next, timestamp: Date.now() });
              localStorage.setItem(queueKey, JSON.stringify(queue));
              setPendingSyncCount(queue.length);
            }
          } catch (err) {
            console.error("Local storage update error:", err);
          }
        }
        return next;
      });
    },
    [storageKey]
  );

  const syncPending = useCallback(async () => {
    if (typeof window === "undefined" || !navigator.onLine) return;
    const queueKey = `${storageKey}:sync_queue`;
    const queueRaw = localStorage.getItem(queueKey);
    if (!queueRaw) return;

    try {
      const queue = JSON.parse(queueRaw);
      if (!Array.isArray(queue) || queue.length === 0) return;

      const res = await fetch("/api/games/sync-offline", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ key: storageKey, items: queue }),
      });

      if (res.ok) {
        localStorage.removeItem(queueKey);
        setPendingSyncCount(0);
      }
    } catch (err) {
      console.error("Offline sync error:", err);
    }
  }, [storageKey]);

  useEffect(() => {
    if (isOnline && pendingSyncCount > 0) {
      syncPending();
    }
  }, [isOnline, pendingSyncCount, syncPending]);

  return [state, setValue, { isOnline, pendingSyncCount, syncPending }];
}
