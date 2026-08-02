import { NextResponse } from "next/server";
import { z } from "zod";

import { validateInviteCodeFormat } from "@/lib/domain/invite-codes";
import { getCurrentProfile } from "@/lib/domain/profiles";
import { createClient } from "@/lib/supabase/server";

const bodySchema = z.object({
  code: z.string().trim().min(4).max(32),
});

export async function POST(request: Request) {
  const supabase = await createClient();
  const profile = await getCurrentProfile(supabase);
  if (!profile) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = bodySchema.parse(await request.json());
    const validated = validateInviteCodeFormat(body.code);
    if (!validated.ok) {
      return NextResponse.json({ error: "Invalid invite code." }, { status: 400 });
    }

    const { data, error } = await supabase.rpc("redeem_invite_code", {
      raw_code: validated.code,
      redeemer: profile.id,
    });

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    return NextResponse.json({ data: { inviteId: data } });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Redeem failed." },
      { status: 400 },
    );
  }
}
