"use client";

import { useEffect, useRef } from "react";

import { createClient } from "@/lib/supabase/client";

import confetti from "canvas-confetti";

export function useStreakTracker() {
  const trackedRef = useRef(false);

  useEffect(() => {
    if (trackedRef.current) return;
    trackedRef.current = true;

    async function trackStreak() {
      try {
        const supabase = createClient();
        const { data: session } = await supabase.auth.getSession();
        if (!session?.session) return;

        // Call the RPC function
        const { data, error } = await supabase.rpc("update_user_streak" as any);

        if (error) {
          console.error("Streak tracking error:", error);
          return;
        }

        const result = data as {
          success: boolean;
          streakIncreased: boolean;
          streak: number;
          pointsAwarded: number;
        };

        if (result?.success && result.streakIncreased) {
          // Fire confetti!
          confetti({
            particleCount: 100,
            spread: 70,
            origin: { y: 0.6 },
            colors: ["#fbbf24", "#f59e0b", "#d97706"], // amber/orange tones
            zIndex: 9999,
          });

          // Trigger an event so UI can update reactively
          window.dispatchEvent(
            new CustomEvent("zigo:streak-updated", {
              detail: result,
            })
          );
        }
      } catch (err) {
        console.error("Failed to track streak:", err);
      }
    }

    // Delay the tracking slightly to not block initial render
    const timer = setTimeout(() => {
      void trackStreak();
    }, 2000);

    return () => clearTimeout(timer);
  }, []);
}
