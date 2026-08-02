import { NextResponse } from "next/server";

import { DEFAULT_INVITE_MAX_USES, generateInviteCode } from "@/lib/domain/invite-codes";
import { getCurrentProfile } from "@/lib/domain/profiles";
import { createClient } from "@/lib/supabase/server";

export async function GET() {
  const supabase = await createClient();
  const profile = await getCurrentProfile(supabase);
  if (!profile) {
    return NextResponse.json({ error: "Unauthorized", code: "UNAUTHORIZED" }, { status: 401 });
  }

  const { data, error } = await supabase
    .from("invite_codes")
    .select("id, code, use_count, max_uses, is_active, created_at")
    .eq("owner_id", profile.id)
    .order("created_at", { ascending: false })
    .limit(20);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ data: data ?? [] });
}

export async function POST() {
  const supabase = await createClient();
  const profile = await getCurrentProfile(supabase);
  if (!profile) {
    return NextResponse.json({ error: "Unauthorized", code: "UNAUTHORIZED" }, { status: 401 });
  }

  if (profile.role !== "teacher" && profile.role !== "parent") {
    return NextResponse.json({ error: "Only teachers and parents can create invites.", code: "FORBIDDEN" }, { status: 403 });
  }

  const code = generateInviteCode(profile.id.replace(/-/g, "").slice(0, 6));
  const { data, error } = await supabase
    .from("invite_codes")
    .insert({
      code,
      owner_id: profile.id,
      role_hint: profile.role,
      max_uses: DEFAULT_INVITE_MAX_USES,
    })
    .select("id, code, use_count, max_uses, is_active, created_at")
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ data });
}
