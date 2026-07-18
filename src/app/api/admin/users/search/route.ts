import { NextResponse } from "next/server";

import { searchUsers } from "@/lib/domain/admin";
import { requirePlatformAdmin } from "@/lib/domain/admin-auth";

export async function GET(request: Request) {
  try {
    const auth = await requirePlatformAdmin();
    if ("error" in auth) return auth.error;

    const { searchParams } = new URL(request.url);
    const query = searchParams.get("q") || "";

    if (!query || query.length < 2) {
      return NextResponse.json({ data: [] });
    }

    const users = await searchUsers(auth.supabase, query);
    return NextResponse.json({ data: users });
  } catch (error) {
    return NextResponse.json({ error: "Failed to search users" }, { status: 500 });
  }
}
