import { NextResponse } from "next/server";

import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

export async function POST(request: Request) {
  try {
    const supabase = await createClient();
    const { data: { user }, error: userError } = await supabase.auth.getUser();

    if (userError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
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
