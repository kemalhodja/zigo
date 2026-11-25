import { NextResponse } from "next/server";
import { z } from "zod";

import { getCurrentProfile } from "@/lib/domain/profiles";
import { redeemChildStoreProduct, redeemStoreProduct } from "@/lib/domain/store";
import { getUserSubscription } from "@/lib/domain/subscription";
import { checkRateLimitAsync } from "@/lib/server/rate-limit";
import { createClient } from "@/lib/supabase/server";

export async function POST(request: Request) {
  try {
    const supabase = await createClient();
    const profile = await getCurrentProfile(supabase);

    if (!profile) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const rateLimit = await checkRateLimitAsync(`store-redeem:${profile.id}`, 10, 60_000);
    if (!rateLimit.allowed) {
      return NextResponse.json(
        { error: "Çok sık ödül talebi gönderildi. Lütfen biraz bekleyin.", code: "RATE_LIMITED" },
        { status: 429, headers: { "Retry-After": String(rateLimit.retryAfterSeconds) } },
      );
    }

    const subscription = await getUserSubscription(supabase, profile.id);
    if (!subscription.isPremium) {
      return NextResponse.json(
        { error: "Mağaza erişimi ve puan harcama için Zigo Plus aboneliği gereklidir." },
        { status: 403 },
      );
    }

    const body = await request.json();

    if (profile.role === "student") {
      const redemption = await redeemStoreProduct(supabase, {
        productId: body.productId,
        note: body.note,
      });

      return NextResponse.json({ data: redemption }, { status: 201 });
    }

    if (profile.role === "parent") {
      const redemption = await redeemChildStoreProduct(supabase, {
        childProfileId: body.childProfileId,
        productId: body.productId,
        note: body.note,
      });

      return NextResponse.json({ data: redemption }, { status: 201 });
    }

    return NextResponse.json({ error: "Teachers cannot redeem student rewards." }, { status: 403 });
  } catch (error) {
    const message = error instanceof z.ZodError
      ? "Choose a valid reward and keep notes under 500 characters."
      : error instanceof Error
        ? error.message
        : "Reward could not be redeemed.";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
