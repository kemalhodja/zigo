import { NextResponse } from "next/server";
import { z } from "zod";

import { requirePlatformAdmin } from "@/lib/domain/admin-auth";

const deleteUserSchema = z.object({
  userId: z.string().uuid(),
});

export async function POST(request: Request) {
  try {
    const auth = await requirePlatformAdmin();
    if ("error" in auth) return auth.error;

    const body = await request.json();
    const { userId } = deleteUserSchema.parse(body);

    const { error } = await auth.supabase.auth.admin.deleteUser(userId);

    if (error) {
      console.error("Error deleting user auth:", error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    const message = error instanceof z.ZodError
      ? "Invalid parameters"
      : error instanceof Error
        ? error.message
        : "Failed to delete user";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
