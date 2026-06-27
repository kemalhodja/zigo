import { revalidateTag } from "next/cache";
import { NextResponse } from "next/server";

import { withApiHandler } from "@/features/shared/api/with-api-handler";
import { recomputeTeacherStatsEngine,teacherStatsCacheTag } from "@/lib/domain/stats";
import { createClient } from "@/lib/supabase/server";

type RouteContext = { params: Promise<{ teacherId: string }> };

export const POST = withApiHandler(async (_request, context: RouteContext) => {
  const { teacherId } = await context.params;
  const supabase = await createClient();
  const stats = await recomputeTeacherStatsEngine(supabase, teacherId);
  revalidateTag(teacherStatsCacheTag(teacherId), "max");
  return NextResponse.json({ data: stats });
});
