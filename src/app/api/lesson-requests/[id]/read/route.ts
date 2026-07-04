import { NextResponse } from "next/server";

import { respondWithDomainError } from "@/lib/domain/api-errors";
import { getLessonRequestById, markLessonRequestThreadRead } from "@/lib/domain/lesson-requests";
import { getCurrentProfile } from "@/lib/domain/profiles";
import { createClient } from "@/lib/supabase/server";

type RouteContext = {
  params: Promise<{ id: string }>;
};

export async function POST(_request: Request, context: RouteContext) {
  try {
    const { id } = await context.params;
    const supabase = await createClient();
    const profile = await getCurrentProfile(supabase);

    if (!profile) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    if (profile.role === "student") {
      return NextResponse.json({ error: "Students cannot access lesson requests." }, { status: 403 });
    }

    const requestRow = await getLessonRequestById(supabase, id);
    if (!requestRow) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    const isParticipant =
      requestRow.sender_id === profile.id || requestRow.receiver_id === profile.id;

    if (!isParticipant) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const updated = await markLessonRequestThreadRead(supabase, id, profile.id);
    return NextResponse.json({ updated });
  } catch (error) {
    return respondWithDomainError(error, "Thread could not be marked as read.");
  }
}
