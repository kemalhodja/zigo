import type { SupabaseClient } from "@supabase/supabase-js";

import type { Database } from "@/lib/supabase/database.types";

const ONESIGNAL_APP_ID = process.env.ONESIGNAL_APP_ID || "";
const ONESIGNAL_REST_API_KEY = process.env.ONESIGNAL_REST_API_KEY || "";
const ONESIGNAL_API_URL = "https://api.onesignal.com";

type OneSignalNotificationPayload = {
  title: string;
  message: string;
  url?: string;
  data?: Record<string, string>;
};

function isConfigured(): boolean {
  return !!(ONESIGNAL_APP_ID && ONESIGNAL_REST_API_KEY);
}

/**
 * Send a push notification to a specific user via OneSignal External User ID.
 * The userId maps to the Zigo profile.id that was set via OneSignal.login(userId).
 */
export async function sendPushToUser(
  userId: string,
  payload: OneSignalNotificationPayload,
): Promise<{ success: boolean; id?: string; error?: string }> {
  if (!isConfigured()) {
    console.warn("[ONESIGNAL] Not configured – skipping push to user:", userId);
    return { success: false, error: "OneSignal not configured" };
  }

  try {
    const response = await fetch(`${ONESIGNAL_API_URL}/notifications`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Key ${ONESIGNAL_REST_API_KEY}`,
      },
      body: JSON.stringify({
        app_id: ONESIGNAL_APP_ID,
        include_aliases: { external_id: [userId] },
        target_channel: "push",
        headings: { en: payload.title, tr: payload.title },
        contents: { en: payload.message, tr: payload.message },
        url: payload.url || undefined,
        data: payload.data || undefined,
        chrome_web_icon: "/icon-192.png",
        chrome_web_badge: "/icon.svg",
      }),
    });

    const result = await response.json();

    if (!response.ok) {
      console.error("[ONESIGNAL] API error:", result);
      return { success: false, error: result.errors?.[0] || "Unknown error" };
    }

    return { success: true, id: result.id };
  } catch (error) {
    console.error("[ONESIGNAL] Network error:", error);
    return { success: false, error: error instanceof Error ? error.message : "Network error" };
  }
}

/**
 * Send a push notification to multiple users by their Zigo user IDs.
 */
export async function sendPushToUsers(
  userIds: string[],
  payload: OneSignalNotificationPayload,
): Promise<{ success: boolean; id?: string; error?: string }> {
  if (!isConfigured() || userIds.length === 0) {
    return { success: false, error: "OneSignal not configured or no users" };
  }

  try {
    const response = await fetch(`${ONESIGNAL_API_URL}/notifications`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Key ${ONESIGNAL_REST_API_KEY}`,
      },
      body: JSON.stringify({
        app_id: ONESIGNAL_APP_ID,
        include_aliases: { external_id: userIds },
        target_channel: "push",
        headings: { en: payload.title, tr: payload.title },
        contents: { en: payload.message, tr: payload.message },
        url: payload.url || undefined,
        data: payload.data || undefined,
        chrome_web_icon: "/icon-192.png",
        chrome_web_badge: "/icon.svg",
      }),
    });

    const result = await response.json();

    if (!response.ok) {
      console.error("[ONESIGNAL] API error:", result);
      return { success: false, error: result.errors?.[0] || "Unknown error" };
    }

    return { success: true, id: result.id };
  } catch (error) {
    console.error("[ONESIGNAL] Network error:", error);
    return { success: false, error: error instanceof Error ? error.message : "Network error" };
  }
}

/**
 * Send a push notification filtered by tag (e.g., role-based).
 * Tags are set on the client via OneSignal.User.addTag("role", "student").
 */
export async function sendPushByTag(
  tagKey: string,
  tagValue: string,
  payload: OneSignalNotificationPayload,
): Promise<{ success: boolean; id?: string; error?: string }> {
  if (!isConfigured()) {
    return { success: false, error: "OneSignal not configured" };
  }

  try {
    const response = await fetch(`${ONESIGNAL_API_URL}/notifications`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Key ${ONESIGNAL_REST_API_KEY}`,
      },
      body: JSON.stringify({
        app_id: ONESIGNAL_APP_ID,
        filters: [{ field: "tag", key: tagKey, relation: "=", value: tagValue }],
        headings: { en: payload.title, tr: payload.title },
        contents: { en: payload.message, tr: payload.message },
        url: payload.url || undefined,
        data: payload.data || undefined,
        chrome_web_icon: "/icon-192.png",
        chrome_web_badge: "/icon.svg",
      }),
    });

    const result = await response.json();

    if (!response.ok) {
      console.error("[ONESIGNAL] API error:", result);
      return { success: false, error: result.errors?.[0] || "Unknown error" };
    }

    return { success: true, id: result.id };
  } catch (error) {
    console.error("[ONESIGNAL] Network error:", error);
    return { success: false, error: error instanceof Error ? error.message : "Network error" };
  }
}

/**
 * Convenience: Send a social interaction notification (like, comment, follow).
 */
export async function sendSocialNotification(
  supabase: SupabaseClient<Database>,
  targetUserId: string,
  actorId: string,
  kind: "like" | "comment" | "follow" | "post",
  postId?: string,
): Promise<void> {
  const messages: Record<string, string> = {
    like: "gönderini beğendi ❤️",
    comment: "gönderine yorum yaptı 💬",
    follow: "seni takip etti 🔔",
    post: "yeni bir gönderi paylaştı 📸",
  };

  const msg = messages[kind] || "yeni bir bildirim";

  const { data: actor } = await supabase
    .from("users")
    .select("full_name")
    .eq("id", actorId)
    .single();

  const actorName = actor?.full_name || "Birisi";
  const url = postId ? `/post/${postId}` : "/notifications";

  await sendPushToUser(targetUserId, {
    title: "Zigo",
    message: `${actorName} ${msg}`,
    url,
    data: { kind, postId: postId || "", actorId },
  });
}
