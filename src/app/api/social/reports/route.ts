import { NextResponse } from "next/server";
import { z } from "zod";

import { isCurrentUserPlatformAdmin } from "@/lib/domain/admin";
import { RateLimitExceededError, respondWithDomainError } from "@/lib/domain/api-errors";
import { getCurrentProfile } from "@/lib/domain/profiles";
import { reportSocialPost, updateContentReportStatus } from "@/lib/domain/social";
import { checkRateLimit } from "@/lib/server/rate-limit";
import { createClient } from "@/lib/supabase/server";

export async function POST(request: Request) {
  try {
    const supabase = await createClient();
    const profile = await getCurrentProfile(supabase);

    if (!profile) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const rateLimit = checkRateLimit(`report:${profile.id}`, 5, 60 * 60_000);
    if (!rateLimit.allowed) {
      throw new RateLimitExceededError(
        "Çok fazla bildirim gönderdin. Bir süre bekleyip tekrar dene.",
        rateLimit.retryAfterSeconds,
      );
    }

    const body = await request.json();
    const data = await reportSocialPost(supabase, {
      postId: body.postId,
      reporterId: profile.id,
      reason: body.reason,
      details: body.details,
    });

    return NextResponse.json({ data });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: "Choose a valid post and report reason." }, { status: 400 });
    }

    return respondWithDomainError(error, "Report could not be submitted.");
  }
}

export async function PATCH(request: Request) {
  try {
    const supabase = await createClient();
    const profile = await getCurrentProfile(supabase);

    if (!profile) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const isPlatformAdmin = await isCurrentUserPlatformAdmin(supabase);
    if (profile.role !== "teacher" && !isPlatformAdmin) {
      return NextResponse.json(
        { error: "Only verified teachers or platform admins can update report status." },
        { status: 403 },
      );
    }

    const body = await request.json();
    const data = await updateContentReportStatus(supabase, {
      reportId: body.reportId,
      status: body.status,
      moderatorId: profile.id,
      isPlatformAdmin,
    });

    return NextResponse.json({ data, meta: { action: "update-content-report" } });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: "Choose a valid report and status." }, { status: 400 });
    }

    return respondWithDomainError(error, "Report status could not be updated.");
  }
}
