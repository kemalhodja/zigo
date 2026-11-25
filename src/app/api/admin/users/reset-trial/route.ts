import { NextResponse } from "next/server";
import { z } from "zod";

import { requirePlatformAdmin } from "@/lib/domain/admin-auth";
import { createAdminClient } from "@/lib/supabase/admin";

const resetTrialSchema = z.object({
  userId: z.string().uuid(),
});

export async function POST(request: Request) {
  try {
    const auth = await requirePlatformAdmin();
    if ("error" in auth) {
      return auth.error;
    }

    const body = resetTrialSchema.parse(await request.json().catch(() => ({})));
    const adminClient = createAdminClient() ?? auth.supabase;

    // Resetting created_at to now gives the user a fresh trial (30 days for teacher, 7 days for others) and 50% discount window
    const nowIso = new Date().toISOString();

    const { error } = await adminClient
      .from("users")
      .update({ created_at: nowIso })
      .eq("id", body.userId);

    if (error) {
      return NextResponse.json({ error: error.message || "İndirim süresi sıfırlanamadı." }, { status: 400 });
    }

    let trialDays = 7;
    try {
      const { data: userRow } = await adminClient
        .from("users")
        .select("role")
        .eq("id", body.userId)
        .maybeSingle();
      if (userRow?.role === "teacher") {
        trialDays = 30;
      }
    } catch {
      // best-effort
    }

    return NextResponse.json({
      success: true,
      trialDays,
      message: `${trialDays} günlük deneme ve %50 indirim penceresi sıfırlandı. Kullanıcıya bugünden itibaren ${trialDays} gün indirim tanımlandı.`,
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: "Geçersiz istek." }, { status: 400 });
    }
    const message = error instanceof Error ? error.message : "İndirim süresi sıfırlanamadı.";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
