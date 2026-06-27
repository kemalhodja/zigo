"use client";

import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect } from "react";

import { createClient } from "@/lib/supabase/client";

async function fetchUnreadCount(): Promise<number> {
  const response = await fetch("/api/notifications/unread-count");
  const payload = (await response.json()) as { data?: { count?: number }; count?: number };
  if (!response.ok) return 0;
  return payload.data?.count ?? payload.count ?? 0;
}

export function useNotificationUnreadCount(enabled = true) {
  return useQuery({
    queryKey: ["notification-unread-count"],
    queryFn: fetchUnreadCount,
    enabled,
    staleTime: 20_000,
    refetchInterval: 60_000,
  });
}

export function useNotificationRealtime(userId: string | null) {
  const queryClient = useQueryClient();

  useEffect(() => {
    if (!userId || !process.env.NEXT_PUBLIC_SUPABASE_URL) return;

    const supabase = createClient();
    const channel = supabase
      .channel(`notifications:${userId}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "notifications",
          filter: `user_id=eq.${userId}`,
        },
        () => {
          void queryClient.invalidateQueries({ queryKey: ["notification-unread-count"] });
          window.dispatchEvent(new Event("zigo:notification-changed"));
        },
      )
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "notifications",
          filter: `user_id=eq.${userId}`,
        },
        () => {
          void queryClient.invalidateQueries({ queryKey: ["notification-unread-count"] });
          window.dispatchEvent(new Event("zigo:notification-changed"));
        },
      )
      .subscribe();

    return () => {
      void supabase.removeChannel(channel);
    };
  }, [queryClient, userId]);
}
