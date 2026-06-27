import { jsonSuccess } from "@/features/shared";
import { withAdminApiHandler } from "@/features/shared/api/rbac";
import { reviewStudentDocument } from "@/lib/domain/admin";

export const POST = withAdminApiHandler(async (request, _context, auth) => {
  const body = await request.json();
  const profile = await reviewStudentDocument(auth.supabase, {
    studentId: body.studentId,
    status: body.status,
  });

  return jsonSuccess(profile);
}, { fallbackMessage: "Student document review failed." });
