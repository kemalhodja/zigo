import { processDueLessonReminders } from "@/features/live-lessons/services/reminder.service";
import { jsonSuccess } from "@/features/shared";
import { withApiHandler } from "@/features/shared/api/with-api-handler";
import { createAdminClient } from "@/lib/supabase/admin";

export const POST = withApiHandler(async (request: Request) => {
  const secret = process.env.CRON_SECRET?.trim() ?? process.env.ZIGO_CRON_SECRET?.trim();
  const authHeader = request.headers.get("authorization") ?? "";
  const token = authHeader.startsWith("Bearer ") ? authHeader.slice(7) : "";

  if (!secret || token !== secret) {
    return jsonSuccess({ error: "Unauthorized" }, 401);
  }

  const admin = createAdminClient();
  if (!admin) {
    return jsonSuccess({ error: "Service role required." }, 503);
  }

  const sent = await processDueLessonReminders(admin, 60);
  return jsonSuccess({ sent });
}, { fallbackMessage: "Lesson reminders could not be processed." });
