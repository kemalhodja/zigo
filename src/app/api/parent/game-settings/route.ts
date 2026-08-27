import { NextResponse } from "next/server";
import { z } from "zod";

import { createClient } from "@/lib/supabase/server";
import { untypedFrom } from "@/lib/supabase/untyped-tables";

const settingsSchema = z.object({
  childProfileId: z.string().uuid(),
  dailyLimitMinutes: z.number().int().min(15).max(480),
  nightBanEnabled: z.boolean(),
  nightBanStart: z.string().regex(/^\d{2}:\d{2}$/),
  nightBanEnd: z.string().regex(/^\d{2}:\d{2}$/),
});

/**
 * GET /api/parent/game-settings?childProfileId=xxx
 * Veli, seçili çocuğunun oyun ayarlarını çeker.
 */
export async function GET(request: Request) {
  try {
    const supabase = await createClient();
    const { data: authData } = await supabase.auth.getUser();
    if (!authData.user) {
      return NextResponse.json({ error: "Yetkisiz" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const childProfileId = searchParams.get("childProfileId");
    if (!childProfileId) {
      return NextResponse.json({ error: "childProfileId gerekli" }, { status: 400 });
    }

    const admin = supabase;
    const { data } = await untypedFrom(admin, "parent_game_settings")
      .select("*")
      .eq("parent_user_id", authData.user.id)
      .eq("child_profile_id", childProfileId)
      .maybeSingle();

    // Kayıt yoksa varsayılanları döndür
    return NextResponse.json({
      data: data ?? {
        daily_limit_minutes: 60,
        night_ban_enabled: true,
        night_ban_start: "22:00",
        night_ban_end: "08:00",
      },
    });
  } catch {
    return NextResponse.json({ error: "Sunucu hatası" }, { status: 500 });
  }
}

/**
 * POST /api/parent/game-settings
 * Veli, çocuğunun oyun ayarlarını kaydeder veya günceller.
 */
export async function POST(request: Request) {
  try {
    const supabase = await createClient();
    const { data: authData } = await supabase.auth.getUser();
    if (!authData.user) {
      return NextResponse.json({ error: "Yetkisiz" }, { status: 401 });
    }

    const body = settingsSchema.parse(await request.json());

    // Velinin gerçekten bu child'ın velisi olduğunu doğrula
    const admin = supabase;
    const { data: child } = await admin
      .from("child_profiles")
      .select("id, parent_id")
      .eq("id", body.childProfileId)
      .maybeSingle();

    if (!child || child.parent_id !== authData.user.id) {
      return NextResponse.json({ error: "Bu çocuğa erişim yetkiniz yok" }, { status: 403 });
    }

    const { error } = await untypedFrom(admin, "parent_game_settings").upsert(
      {
        parent_user_id: authData.user.id,
        child_profile_id: body.childProfileId,
        daily_limit_minutes: body.dailyLimitMinutes,
        night_ban_enabled: body.nightBanEnabled,
        night_ban_start: body.nightBanStart,
        night_ban_end: body.nightBanEnd,
        updated_at: new Date().toISOString(),
      },
      { onConflict: "parent_user_id,child_profile_id" }
    );

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: "Geçersiz değerler" }, { status: 400 });
    }
    return NextResponse.json({ error: "Sunucu hatası" }, { status: 500 });
  }
}
