import { NextResponse } from "next/server";

import { withApiHandler } from "@/features/shared/api/with-api-handler";
import { getTeacherReviewStats,listTeacherReviews } from "@/lib/domain/trust/trust-safety";
import { createClient } from "@/lib/supabase/server";

type RouteContext = { params: Promise<{ teacherId: string }> };

export const GET = withApiHandler(async (_request, context: RouteContext) => {
  const { teacherId } = await context.params;
  const supabase = await createClient();
  const [reviews, stats] = await Promise.all([
    listTeacherReviews(supabase, teacherId),
    getTeacherReviewStats(supabase, teacherId),
  ]);

  return NextResponse.json({ data: { reviews, stats } });
});
