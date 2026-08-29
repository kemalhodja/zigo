import { NextResponse } from "next/server";

import { createAuthActionClient } from "@/lib/supabase/server";

export async function POST() {
  try {
    const supabase = await createAuthActionClient();
    const { error } = await supabase.auth.signOut({ scope: "local" });

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    return NextResponse.json({ data: true });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Sign out failed.";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
