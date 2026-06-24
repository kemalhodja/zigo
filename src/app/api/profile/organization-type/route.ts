import { NextResponse } from "next/server";

import { parseOrganizationType, setUserOrganizationType } from "@/lib/domain/profiles";
import { createClient } from "@/lib/supabase/server";

export async function PATCH(request: Request) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = (await request.json()) as { organizationType?: string };
    const organizationType = parseOrganizationType(body.organizationType);

    if (!organizationType) {
      return NextResponse.json({ error: "Geçerli bir kurum türü seçin." }, { status: 400 });
    }

    await setUserOrganizationType(supabase, organizationType);
    return NextResponse.json({ data: { organizationType } });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Kurum türü kaydedilemedi.";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
