import { NextResponse } from "next/server";

import { openPremiumPrepUrl } from "@/lib/domain/premium-prep";
import { getCurrentProfile } from "@/lib/domain/profiles";
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

    if (profile.role !== "student" && profile.role !== "parent") {
      return NextResponse.json(
        { error: "Yazılı hazırlık kaynakları yalnızca öğrenci ve veli hesapları için açılır." },
        { status: 403 },
      );
    }

    const url = await openPremiumPrepUrl(supabase, id);
    return NextResponse.json({ data: { url } });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Kaynak açılamadı.";
    const needsSubscription =
      message.toLowerCase().includes("premium subscription") ||
      message.toLowerCase().includes("zigo plus");

    if (needsSubscription) {
      return NextResponse.json(
        {
          error: "Bu yazılı hazırlık kaynağı Zigo Plus aboneliği ile açılır.",
          code: "SUBSCRIPTION_REQUIRED",
        },
        { status: 402 },
      );
    }

    return NextResponse.json({ error: message }, { status: 400 });
  }
}
