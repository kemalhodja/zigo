import { NextResponse } from "next/server";
import webpush from "web-push";

import { isCurrentUserPlatformAdmin } from "@/lib/domain/admin";
import { getCurrentProfile } from "@/lib/domain/profiles";
import { createClient } from "@/lib/supabase/server";

type PushSubscriptionRecord = {
  id: string;
  user_id: string;
  endpoint: string;
  auth: string;
  p256dh: string;
};

export async function POST(request: Request) {
  try {
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

    const body = (await request.json().catch(() => ({}))) as {
      userId?: string;
      title?: string;
      message?: string;
      url?: string;
    };
    const { userId, title, message, url } = body;

    if (!userId || !title || !message) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    const { data: subsData, error: subsError } = await (supabase
      .from("push_subscriptions" as unknown as "users") as unknown as {
        select: (cols: string) => {
          eq: (col: string, val: string) => Promise<{ data: PushSubscriptionRecord[] | null; error: Error | null }>;
        };
      })
      .select("*")
      .eq("user_id", userId);

    const subs = subsData ?? [];

    if (subsError || subs.length === 0) {
      return NextResponse.json({ success: false, message: "No subscriptions found" });
    }

    const payload = JSON.stringify({
      title,
      body: message,
      url: url || "/",
    });

    const sendPromises = subs.map(async (sub) => {
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
      } catch (err: unknown) {
        const errorStatusCode = (err as { statusCode?: number })?.statusCode;
        if (errorStatusCode === 410) {
          await (supabase
            .from("push_subscriptions" as unknown as "users") as unknown as {
              delete: () => { eq: (col: string, val: string) => Promise<unknown> };
            })
            .delete()
            .eq("id", sub.id);
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
