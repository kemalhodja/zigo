import { NextResponse } from "next/server";
import webpush from "web-push";

import { isCurrentUserPlatformAdmin } from "@/lib/domain/admin";
import { getCurrentProfile } from "@/lib/domain/profiles";
import { createClient } from "@/lib/supabase/server";

export async function POST(request: Request) {
  try {
    // Configure web-push with VAPID keys if available
    if (process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY && process.env.VAPID_PRIVATE_KEY) {
      webpush.setVapidDetails(
        "mailto:destek@zigo.app",
        process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY,
        process.env.VAPID_PRIVATE_KEY
      );
    }

    const supabase = await createClient();
    const profile = await getCurrentProfile(supabase);

    if (!profile) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const isAdmin = await isCurrentUserPlatformAdmin(supabase);
    if (!isAdmin) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const body = await request.json();
    const { userId, title, message, url } = body;

    if (!userId || !title || !message) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    // Fetch user's subscriptions
    // @ts-ignore
    const { data: subs, error: subsError } = await supabase
      .from("push_subscriptions")
      .select("*")
      .eq("user_id", userId);

    if (subsError || !subs || subs.length === 0) {
      return NextResponse.json({ success: false, message: "No subscriptions found" });
    }

    const payload = JSON.stringify({
      title,
      body: message,
      url: url || "/",
    });

    // @ts-ignore
    const sendPromises = subs.map(async (sub: any) => {
      try {
        await webpush.sendNotification(
          {
            endpoint: sub.endpoint,
            keys: {
              auth: sub.auth,
              p256dh: sub.p256dh,
            },
          },
          payload
        );
      } catch (err: any) {
        if (err.statusCode === 410) {
          // @ts-ignore
          await supabase.from("push_subscriptions").delete().eq("id", sub.id);
        }
      }
    });

    await Promise.all(sendPromises);

    return NextResponse.json({ success: true, count: subs.length }, { status: 200 });
  } catch (error) {
    console.error("[PUSH_SEND_ERROR]", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
