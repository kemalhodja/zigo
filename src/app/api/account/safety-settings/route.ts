import { NextResponse } from "next/server";
import { z } from "zod";

import { getCurrentProfile } from "@/lib/domain/profiles";
import { createClient } from "@/lib/supabase/server";

const settingsSchema = z.object({
  allowComments: z.boolean(),
  allowStoryReplies: z.boolean(),
  allowFollowRequests: z.boolean(),
  profileDiscoverable: z.boolean(),
  requireGuardianPostApproval: z.boolean(),
});

type SafetySettingsTable = {
  from: (table: "user_safety_settings") => {
    select: (columns: string) => {
      eq: (column: string, value: string) => {
        maybeSingle: () => Promise<{ data: unknown; error: { message: string } | null }>;
      };
    };
    upsert: (value: Record<string, unknown>) => Promise<{ error: { message: string } | null }>;
  };
};

export async function GET() {
  const supabase = await createClient();
  const profile = await getCurrentProfile(supabase);
  if (!profile) return NextResponse.json({ error: "Oturum açmanız gerekiyor." }, { status: 401 });
  const settings = supabase as unknown as SafetySettingsTable;
  const { data, error } = await settings.from("user_safety_settings").select("*").eq("user_id", profile.id).maybeSingle();
  if (error) return NextResponse.json({ error: error.message }, { status: 400 });
  return NextResponse.json({ data });
}

export async function PUT(request: Request) {
  try {
    const supabase = await createClient();
    const profile = await getCurrentProfile(supabase);
    if (!profile) return NextResponse.json({ error: "Oturum açmanız gerekiyor." }, { status: 401 });
    const body = settingsSchema.parse(await request.json());
    const settings = supabase as unknown as SafetySettingsTable;
    const { error } = await settings.from("user_safety_settings").upsert({
      user_id: profile.id, allow_comments: body.allowComments, allow_story_replies: body.allowStoryReplies,
      allow_follow_requests: body.allowFollowRequests, profile_discoverable: body.profileDiscoverable,
      require_guardian_post_approval: body.requireGuardianPostApproval, updated_at: new Date().toISOString(),
    });
    if (error) return NextResponse.json({ error: error.message }, { status: 400 });
    return NextResponse.json({ data: { saved: true } });
  } catch {
    return NextResponse.json({ error: "Güvenlik ayarları geçersiz." }, { status: 400 });
  }
}
