import { NextResponse } from "next/server";

import { getClassGroupInfo } from "@/lib/domain/class-groups";
import { getCurrentProfile } from "@/lib/domain/profiles";
import { createClient } from "@/lib/supabase/server";

export async function GET(request: Request) {
  try {
    const supabase = await createClient();
    const profile = await getCurrentProfile(supabase);

    if (!profile) {
      return NextResponse.json({ error: "Oturum açmanız gerekiyor." }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const childProfileId = searchParams.get("childProfileId") || null;

    const info = await getClassGroupInfo(supabase, profile.id, childProfileId);
    return NextResponse.json({ data: info });
  } catch (error) {
    console.error("Error fetching class group info:", error);
    return NextResponse.json({ error: "Sınıf grubu bilgisi alınamadı." }, { status: 500 });
  }
}
