"use client";

import { useNotificationRealtime } from "@/features/notifications/hooks/use-notification-realtime";

type NotificationRealtimeBridgeProps = {
  userId: string | null;
};

/** Supabase Realtime bridge — live badge refresh (no Socket.io; matches Zigo stack). */
export function NotificationRealtimeBridge({ userId }: NotificationRealtimeBridgeProps) {
  useNotificationRealtime(userId);
  return null;
}
