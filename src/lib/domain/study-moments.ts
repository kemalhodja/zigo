import type { SupabaseClient } from "@supabase/supabase-js";
import type { z } from "zod";

import { shareStudyMomentSchema } from "@/lib/domain/learning/schemas";
import { assertSafeStudentTextAsync } from "@/lib/domain/moderation";
import type { Database } from "@/lib/supabase/database.types";

export async function shareStudyMoment(
  supabase: SupabaseClient<Database>,
  input: z.infer<typeof shareStudyMomentSchema>,
) {
  const parsed = shareStudyMomentSchema.parse(input);
  const safeCaption = parsed.caption ? await assertSafeStudentTextAsync(parsed.caption) : undefined;

  const { data, error } = await supabase.rpc("share_study_moment", {
    p_session_id: parsed.sessionId,
    p_caption: safeCaption,
  });

  if (error) throw error;
  return data;
}