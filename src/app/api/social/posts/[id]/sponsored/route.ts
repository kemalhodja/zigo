import { NextResponse } from "next/server";

import { getCurrentProfile } from "@/lib/domain/profiles";
import { openSponsoredAdUrl } from "@/lib/domain/sponsored-ads";
import { createClient } from "@/lib/supabase/server";

type RouteContext = {
  params: Promise<{ id: string }>;
};

export async function GET(_request: Request, context: RouteContext) {
  try {
    const { id } = await context.params;
    const supabase = await createClient();
    const profile = await getCurrentProfile(supabase);

    if (!profile) {
      return NextResponse.json({ error: "Oturum açmanız gerekiyor." }, { status: 401 });
    }

    const url = await openSponsoredAdUrl(supabase, id);
    return NextResponse.json({ data: { url } });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Sponsorlu reklam açılamadı.";
    const inactive =
      message.toLowerCase().includes("not active") ||
      message.toLowerCase().includes("expired");

    if (inactive) {
      return NextResponse.json(
        { error: "Bu sponsorlu reklam artık aktif değil.", code: "SPONSORED_INACTIVE" },
        { status: 410 },
      );
    }

    return NextResponse.json({ error: message }, { status: 400 });
  }
}
