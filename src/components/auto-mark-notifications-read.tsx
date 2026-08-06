"use client";

import { useRouter } from "next/navigation";
import { useEffect } from "react";

export function AutoMarkNotificationsRead({ unreadCount }: { unreadCount: number }) {
  const router = useRouter();

  useEffect(() => {
    // Immediately dispatch 0 unread event to clear badge in UI shell
    if (typeof window !== "undefined") {
      window.dispatchEvent(new CustomEvent("zigo:unread-count-updated", { detail: { count: 0 } }));
    }

    if (unreadCount <= 0) return;

    let active = true;

    async function triggerMarkRead() {
      try {
        const response = await fetch("/api/social/notifications/read", {
          method: "POST",
        });
        if (response.ok && active) {
          window.dispatchEvent(new CustomEvent("zigo:unread-count-updated", { detail: { count: 0 } }));
          router.refresh();
        }
      } catch {
        // fail silently for background action
      }
    }

    void triggerMarkRead();

    return () => {
      active = false;
    };
  }, [unreadCount, router]);

  return null;
}
