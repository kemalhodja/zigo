import { NextResponse } from "next/server";
import { z } from "zod";

import { respondWithDomainError } from "@/lib/domain/api-errors";
import {
  createLessonRequestMessage,
  getLessonRequestById,
  getLessonRequestThread,
  markLessonRequestThreadRead,
  updateLessonRequestStatus,
} from "@/lib/domain/lesson-requests";
import { getCurrentProfile } from "@/lib/domain/profiles";
import { getUserSubscription } from "@/lib/domain/subscription";
import { createClient } from "@/lib/supabase/server";

type RouteContext = {
  params: Promise<{ id: string }>;
};

export async function GET(_request: Request, context: RouteContext) {
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

    const thread = await getLessonRequestThread(supabase, id);
    await markLessonRequestThreadRead(supabase, id, profile.id).catch(() => 0);
    return NextResponse.json({ data: { request: requestRow, thread } });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Lesson request could not be loaded.";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}

export async function PATCH(request: Request, context: RouteContext) {
  try {
    const { id } = await context.params;
    const supabase = await createClient();
    const profile = await getCurrentProfile(supabase);

    if (!profile) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    if (profile.role === "student") {
      return NextResponse.json({ error: "Students cannot update lesson requests." }, { status: 403 });
    }

    const body = await request.json();
    const updated = await updateLessonRequestStatus(supabase, {
      requestId: id,
      actorId: profile.id,
      status: body.status,
    });

    return NextResponse.json({ data: updated });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: "Invalid status." }, { status: 400 });
    }

    return respondWithDomainError(error, "Lesson request could not be updated.");
  }
}

export async function POST(request: Request, context: RouteContext) {
  try {
    const { id } = await context.params;
    const supabase = await createClient();
    const profile = await getCurrentProfile(supabase);

    if (!profile) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    if (profile.role === "student") {
      return NextResponse.json({ error: "Students cannot send professional messages." }, { status: 403 });
    }

    if (profile.role === "parent") {
      const subscription = await getUserSubscription(supabase, profile.id);
      if (!subscription.isPremium) {
        return NextResponse.json(
          { error: "Öğretmene mesaj göndermek için Veli Aboneliği (Zigo Plus) gereklidir." },
          { status: 403 },
        );
      }
    }

    const body = await request.json();
    const message = await createLessonRequestMessage(supabase, {
      requestId: id,
      senderId: profile.id,
      content: body.content,
    });

    return NextResponse.json({ data: message }, { status: 201 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: "Message must be between 1 and 2000 characters." }, { status: 400 });
    }

    return respondWithDomainError(error, "Message could not be sent.");
  }
}
