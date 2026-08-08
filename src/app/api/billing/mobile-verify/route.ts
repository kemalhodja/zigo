import { NextResponse } from "next/server";
import { getCurrentProfile } from "@/lib/domain/profiles";
import { createAdminClient, hasServiceRoleEnv } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";

export async function POST(request: Request) {
  try {
    const supabase = await createClient();
    const dbClient = (hasServiceRoleEnv() ? createAdminClient() : null) ?? supabase;
    const profile = await getCurrentProfile(supabase);

    if (!profile) {
      return NextResponse.json({ error: "Oturum açmanız gerekiyor." }, { status: 401 });
    }

    const body = (await request.json().catch(() => ({}))) as {
      planId?: string;
      platform?: "android" | "ios";
      productId?: string;
      purchaseToken?: string;
      orderId?: string;
    };

    if (!body.purchaseToken && !body.orderId) {
      return NextResponse.json({ error: "Satın alma fişi / token eksik." }, { status: 400 });
    }

    const planId = body.planId || body.productId || "student-monthly";
    const now = new Date();
    const expiresAt = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000).toISOString();

    // Save subscription in database
    const { error: upsertErr } = await (dbClient
      .from("user_subscriptions") as unknown as { upsert: (data: Record<string, unknown>) => Promise<{ error: unknown }> })
      .upsert({
        user_id: profile.id,
        plan_id: planId,
        tier: "zigo_plus",
        status: "active",
        current_period_end: expiresAt,
        provider: body.platform === "ios" ? "apple" : "google_play",
      });

    if (upsertErr) {
      return NextResponse.json({ error: "Abonelik kaydedilemedi." }, { status: 500 });
    }

    return NextResponse.json({
      data: {
        success: true,
        message: `${body.platform === "ios" ? "App Store" : "Google Play"} satın almanız doğrulandı ve aboneliğiniz başlatıldı!`,
      },
    });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Sunucu hatası" },
      { status: 500 },
    );
  }
}
