import { NextResponse } from "next/server";

import { checkRateLimitAsync } from "@/lib/server/rate-limit";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";

export async function POST() {
  try {
    const supabase = await createClient();
    const { data: { user }, error: userError } = await supabase.auth.getUser();

    if (userError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const rateLimit = await checkRateLimitAsync(`profile-delete:${user.id}`, 3, 15 * 60_000);
    if (!rateLimit.allowed) {
      return NextResponse.json(
        { error: "Çok sık hesap silme denemesi. Lütfen biraz bekleyin.", code: "RATE_LIMITED" },
        { status: 429, headers: { "Retry-After": String(rateLimit.retryAfterSeconds) } },
      );
    }

    const adminClient = createAdminClient();
    if (!adminClient) {
      return NextResponse.json({ error: "Service role missing" }, { status: 500 });
    }

    const { error } = await adminClient.auth.admin.deleteUser(user.id);

    if (error) {
      console.error("Error deleting user auth:", error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    // Call sign out to clear session cookies
    await supabase.auth.signOut();

    return NextResponse.json({ success: true });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to delete user";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
