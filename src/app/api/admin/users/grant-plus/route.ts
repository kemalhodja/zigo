import { NextResponse } from "next/server";
import { z } from "zod";

import { requirePlatformAdmin } from "@/lib/domain/admin-auth";
import { createAdminClient } from "@/lib/supabase/admin";

const grantPlusSchema = z.object({
  userId: z.string().uuid(),
  durationDays: z.number().int().min(1).max(3650), // Up to 10 years
  note: z.string().max(500).optional(),
});

export async function POST(request: Request) {
  try {
    const auth = await requirePlatformAdmin();
    if ("error" in auth) {
      return auth.error;
    }

    const body = grantPlusSchema.parse(await request.json().catch(() => ({})));
    const adminClient = createAdminClient() ?? auth.supabase;

    const periodEndsAt = new Date(Date.now() + body.durationDays * 24 * 60 * 60 * 1000).toISOString();

    // 1. Insert into admin_billing_grants ledger
    try {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      await (adminClient as any).from("admin_billing_grants").insert({
        admin_id: auth.profile.id,
        user_id: body.userId,
        kind: "plus",
        duration_days: body.durationDays,
        note: body.note || `Admin tarafından +${body.durationDays} gün tanımlandı`,
        period_ends_at: periodEndsAt,
      });
    } catch (e) {
      console.warn("[ADMIN_GRANT_LEDGER_WARN]", e);
    }

    // 2. Update user premium flag
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { error: userUpdateError } = await (adminClient as any)
      .from("users")
      .update({ is_premium: true })
      .eq("id", body.userId);

    if (userUpdateError) {
      return NextResponse.json({ error: userUpdateError.message || "Kullanıcı güncellenemedi." }, { status: 400 });
    }

    // 3. Sync subscription tier RPC
    try {
      await adminClient.rpc("set_user_subscription_tier", {
        p_user_id: body.userId,
        p_tier: "zigo_plus",
      });
    } catch {
      // Fallback is non-fatal
    }

    return NextResponse.json({
      success: true,
      message: `Kullanıcıya başarıyla ${body.durationDays} gün Zigo Plus hediye edildi.`,
      periodEndsAt,
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: "Geçersiz parametreler." }, { status: 400 });
    }
    const message = error instanceof Error ? error.message : "Zigo Plus tanımlanamadı.";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
