import { NextResponse } from "next/server";

import { createClient } from "@/lib/supabase/server";

export async function GET() {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ authenticated: false, isPlatformAdmin: false });
    }

    const { data: isPlatformAdmin } = await supabase.rpc("current_user_is_platform_admin");

    return NextResponse.json({
      authenticated: true,
      isPlatformAdmin: Boolean(isPlatformAdmin),
    });
  } catch {
    return NextResponse.json(
      { authenticated: false, isPlatformAdmin: false, error: "session_unavailable" },
      { status: 503 },
    );
  }
}
