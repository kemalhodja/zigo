import { NextResponse } from "next/server";

import { createClient } from "@/lib/supabase/server";

export async function GET(request: Request) {
  const requestUrl = new URL(request.url);
  const code = requestUrl.searchParams.get("code");
  const nextParam = requestUrl.searchParams.get("next") ?? "/onboarding";
  const next = nextParam.startsWith("/") ? nextParam : "/onboarding";

  if (code) {
    const supabase = await createClient();
    const { error } = await supabase.auth.exchangeCodeForSession(code);

    if (error) {
      const authUrl = new URL("/auth", requestUrl.origin);
      authUrl.searchParams.set("error", error.message);
      return NextResponse.redirect(authUrl);
    }
  }

  return NextResponse.redirect(new URL(next, requestUrl.origin));
}
