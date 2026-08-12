import webPush from "web-push";

const publicVapidKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY || "";
const privateVapidKey = process.env.VAPID_PRIVATE_KEY || "";
const contactEmail = "mailto:hello@zigo.app";

if (publicVapidKey && privateVapidKey) {
  webPush.setVapidDetails(contactEmail, publicVapidKey, privateVapidKey);
}

export async function sendWebPush(
  subscription: webPush.PushSubscription,
  payload: { title: string; body: string; url?: string }
) {
  if (!publicVapidKey || !privateVapidKey) {
    console.warn("[WEB_PUSH] VAPID keys not configured, skipping push.");
    return;
  }

  try {
    await webPush.sendNotification(subscription, JSON.stringify(payload));
  } catch (error) {
    console.error("[WEB_PUSH] Error sending push:", error);
  }
}
