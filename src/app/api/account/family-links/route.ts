import { NextResponse } from "next/server";
import { z } from "zod";

import { getCurrentProfile } from "@/lib/domain/profiles";
import { createClient } from "@/lib/supabase/server";

const invitationSchema = z.object({ studentEmail: z.string().trim().email() });
const revokeSchema = z.object({ linkId: z.string().uuid() });

export async function GET() {
  const supabase = await createClient();
  const profile = await getCurrentProfile(supabase);
  if (!profile) return NextResponse.json({ error: "Oturum açmanız gerekiyor." }, { status: 401 });

  const links = supabase as unknown as {
    from: (table: "family_student_links") => {
      select: (columns: string) => {
        or: (filter: string) => Promise<{ data: unknown[] | null; error: { message: string } | null }>;
      };
    };
  };
  const { data, error } = await links.from("family_student_links")
    .select("id, guardian_id, student_id, relationship, status, created_at, revoked_at")
    .or(`guardian_id.eq.${profile.id},student_id.eq.${profile.id}`);
  if (error) return NextResponse.json({ error: error.message }, { status: 400 });
  return NextResponse.json({ data: data ?? [] });
}

export async function POST(request: Request) {
  try {
    const supabase = await createClient();
    const profile = await getCurrentProfile(supabase);
    if (!profile) return NextResponse.json({ error: "Oturum açmanız gerekiyor." }, { status: 401 });
    const { studentEmail } = invitationSchema.parse(await request.json());
    const rpc = supabase.rpc as unknown as (name: string, args: Record<string, unknown>) => Promise<{
      data: { invitation_id: string; invitation_token: string; expires_at: string }[] | null;
      error: { message: string } | null;
    }>;
    const { data, error } = await rpc("create_family_link_invitation", { target_student_email: studentEmail });
    if (error || !data?.[0]) return NextResponse.json({ error: error?.message ?? "Davet oluşturulamadı." }, { status: 400 });
    return NextResponse.json({ data: data[0] }, { status: 201 });
  } catch (error) {
    return NextResponse.json({ error: error instanceof z.ZodError ? "Geçerli bir öğrenci e-postası girin." : "Davet oluşturulamadı." }, { status: 400 });
  }
}

export async function DELETE(request: Request) {
  try {
    const supabase = await createClient();
    const profile = await getCurrentProfile(supabase);
    if (!profile) return NextResponse.json({ error: "Oturum açmanız gerekiyor." }, { status: 401 });
    const { linkId } = revokeSchema.parse(await request.json());
    const rpc = supabase.rpc as unknown as (name: string, args: Record<string, unknown>) => Promise<{ error: { message: string } | null }>;
    const { error } = await rpc("revoke_family_student_link", { target_link_id: linkId });
    if (error) return NextResponse.json({ error: error.message }, { status: 400 });
    return NextResponse.json({ data: { revoked: true } });
  } catch {
    return NextResponse.json({ error: "Geçerli bir aile bağı seçin." }, { status: 400 });
  }
}
