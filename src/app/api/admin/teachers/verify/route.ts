import { jsonSuccess } from "@/features/shared";
import { withAdminApiHandler } from "@/features/shared/api/rbac";
import { verifyTeacher } from "@/lib/domain/admin";

export const POST = withAdminApiHandler(async (request, _context, auth) => {
  const body = await request.json();
  const teacher = await verifyTeacher(auth.supabase, {
    teacherId: body.teacherId,
    verified: body.verified,
  });

  return jsonSuccess(teacher);
}, { fallbackMessage: "Teacher verification failed." });
