"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

import { useRealtime } from "@/hooks/use-realtime";

export function RealtimeNotificationsListener({ userId }: { userId?: string }) {
  const router = useRouter();
  const [hasNew, setHasNew] = useState(false);

  // Supabase RLS is expected to protect realtime rows if secure, 
  // but we also explicitly filter by user_id = profile.id
  useRealtime("social_notifications", `user_id=eq.${userId}`, (payload) => {
    // payload represents the new notification row
    if (payload) {
      setHasNew(true);
      // Trigger global event for shell badge
      window.dispatchEvent(new CustomEvent("zigo:new-realtime-notification"));
    }
  });

  useEffect(() => {
    if (hasNew) {
      // In a real app we could toast this, but here we'll just soft refresh
      const timeout = setTimeout(() => {
        router.refresh();
        setHasNew(false);
      }, 1000);
      return () => clearTimeout(timeout);
    }
  }, [hasNew, router]);

  return null;
}
