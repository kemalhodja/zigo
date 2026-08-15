"use client";

import { useEffect, useRef } from "react";

const HEARTBEAT_SECONDS = 30;

/**
 * Tracks active play time and reports increments to /api/games/track-time.
 * Used for student daily limit enforcement (60 min default).
 */
export function useGameSessionTimer(userId: string | undefined, enabled = true) {
  const lastSentRef = useRef(0);

  useEffect(() => {
    if (!enabled || !userId || userId === "guest") return;

    const startedAt = Date.now();
    lastSentRef.current = 0;

    async function sendSeconds(seconds: number) {
      if (seconds <= 0) return;
      try {
        await fetch("/api/games/track-time", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ played_seconds: seconds }),
        });
      } catch {
        // Non-blocking; limit check runs on next heartbeat
      }
    }

    const interval = window.setInterval(() => {
      const elapsed = Math.floor((Date.now() - startedAt) / 1000);
      const delta = elapsed - lastSentRef.current;
      if (delta >= HEARTBEAT_SECONDS) {
        lastSentRef.current = elapsed;
        void sendSeconds(delta);
      }
    }, HEARTBEAT_SECONDS * 1000);

    return () => {
      window.clearInterval(interval);
      const elapsed = Math.floor((Date.now() - startedAt) / 1000);
      const remaining = elapsed - lastSentRef.current;
      if (remaining > 0) {
        void sendSeconds(remaining);
      }
    };
  }, [userId, enabled]);
}
