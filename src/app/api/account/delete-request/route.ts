import { NextResponse } from "next/server";

import { deleteAccountRequestSchema, requestAccountDeletion } from "@/lib/domain/account-compliance";
import { getCurrentProfile } from "@/lib/domain/profiles";
import { createClient } from "@/lib/supabase/server";

export async function POST(request: Request) {
  try {
    const supabase = await createClient();
    const profile = await getCurrentProfile(supabase);
    if (!profile) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = deleteAccountRequestSchema.parse(await request.json().catch(() => ({})));
    const data = await requestAccountDeletion(supabase, body);
    return NextResponse.json({ data });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Deletion request failed.";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
