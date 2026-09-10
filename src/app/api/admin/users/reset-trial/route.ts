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

    // Resetting created_at to now gives the user a fresh 7-day trial and 50% discount window
    const nowIso = new Date().toISOString();

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { error } = await (adminClient as any)
      .from("users")
      .update({ created_at: nowIso })
      .eq("id", body.userId);

    if (error) {
      return NextResponse.json({ error: error.message || "İndirim süresi sıfırlanamadı." }, { status: 400 });
    }

    return NextResponse.json({
      success: true,
      message: "7 günlük deneme ve %50 indirim penceresi sıfırlandı. Kullanıcıya bugünden itibaren 7 gün indirim tanımlandı.",
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: "Geçersiz istek." }, { status: 400 });
    }
    const message = error instanceof Error ? error.message : "İndirim süresi sıfırlanamadı.";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
