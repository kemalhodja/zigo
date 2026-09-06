import { NextResponse } from "next/server";

import { getCurrentProfile } from "@/lib/domain/profiles";
import { createClient } from "@/lib/supabase/server";

export async function GET() {
  const supabase = await createClient();
  const profile = await getCurrentProfile(supabase);
  if (!profile) return NextResponse.json({ error: "Oturum açmanız gerekiyor." }, { status: 401 });
  const admin = await supabase.from("platform_admins").select("user_id").eq("user_id", profile.id).maybeSingle();
  if (!admin.data) return NextResponse.json({ error: "Yönetici yetkisi gerekir." }, { status: 403 });
  const db = supabase as unknown as {
    from: (table: "private_lesson_posts") => {
      select: (columns: string) => {
        eq: (column: string, value: string) => {
          order: (column: string, options: { ascending: boolean }) => Promise<{
            data: unknown[] | null;
            error: { message: string } | null;
          }>;
        };
      };
    };
  };
  const { data, error } = await db.from("private_lesson_posts")
    .select("id, area_id, grade_level, mode, city, district, description, budget_try, created_at, parent:users!parent_id(full_name)")
    .eq("status", "pending_review")
    .order("created_at", { ascending: true });
  if (error) return NextResponse.json({ error: error.message }, { status: 400 });
  return NextResponse.json({ data: data ?? [] });
}
