import type { SupabaseClient } from "@supabase/supabase-js";

import type { SocialNotification } from "@/lib/domain/social";
import {
  getNotifications,
  getUnreadNotificationCount,
  markNotificationsRead,
} from "@/lib/domain/social/feed";
import type { Database } from "@/lib/supabase/database.types";

export type { SocialNotification as AppNotification };

export async function getUserNotifications(
  supabase: SupabaseClient<Database>,
  userId: string,
  options: { limit?: number; unreadOnly?: boolean } = {},
) {
  const notifications = await getNotifications(supabase, userId);
  const filtered = options.unreadOnly
    ? notifications.filter((item) => !item.is_read)
    : notifications;

  if (options.limit) {
    return filtered.slice(0, options.limit);
  }

  return filtered;
}

export { getUnreadNotificationCount };

export async function markAllNotificationsRead(
  supabase: SupabaseClient<Database>,
  userId: string,
) {
  return markNotificationsRead(supabase, userId);
}

export async function markNotificationRead(
  supabase: SupabaseClient<Database>,
  userId: string,
  notificationId: string,
) {
  const { data, error } = await supabase
    .from("notifications")
    .update({ is_read: true })
    .eq("id", notificationId)
    .eq("user_id", userId)
    .select("id")
    .maybeSingle();

  if (error) throw error;
  if (!data) {
    throw new Error("Notification not found.");
  }

  return data;
}
