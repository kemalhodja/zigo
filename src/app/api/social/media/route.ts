import { NextResponse } from "next/server";
import { z } from "zod";

const pathSchema = z.string().trim().min(3).max(500).refine(
  (value) => !value.includes("..") && !value.startsWith("/") && !value.includes("\\"),
  "Invalid media path",
);

/** Redirect a media request to the public Storage URL. */
export async function GET(request: Request) {
  const path = new URL(request.url).searchParams.get("path") ?? "";
  const parsed = pathSchema.safeParse(path);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid media path." }, { status: 400 });
  }

  const supabaseUrl = (
    process.env.NEXT_PUBLIC_SUPABASE_URL ||
    "https://fuqnjxcoxopomzgbifve.supabase.co"
  )
    .trim()
    .replace(/\/$/, "");

  const publicUrl = `${supabaseUrl}/storage/v1/object/public/social-media/${parsed.data}`;

  return NextResponse.redirect(publicUrl, {
    status: 302,
    headers: {
      "Cache-Control": "public, max-age=86400, stale-while-revalidate=604800",
    },
  });
}
