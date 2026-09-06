import { NextResponse } from "next/server";
import { z } from "zod";

import { createClient } from "@/lib/supabase/server";

const pathSchema = z.string().trim().min(3).max(500).refine(
  (value) => !value.includes("..") && !value.startsWith("/") && !value.includes("\\"),
  "Invalid media path",
);

/** Redirect an authenticated viewer to a short-lived private Storage URL. */
export async function GET(request: Request) {
  const path = new URL(request.url).searchParams.get("path") ?? "";
  const parsed = pathSchema.safeParse(path);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid media path." }, { status: 400 });
  }

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "Oturum açmanız gerekiyor." }, { status: 401 });
  }

  const { data, error } = await supabase.storage
    .from("social-media")
    .createSignedUrl(parsed.data, 300);
  if (error || !data?.signedUrl) {
    return NextResponse.json({ error: "Medya adresi oluşturulamadı." }, { status: 404 });
  }

  return NextResponse.redirect(data.signedUrl, {
    status: 307,
    headers: { "Cache-Control": "private, no-store" },
  });
}
