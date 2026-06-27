import { jsonSuccess } from "@/features/shared";
import { withAdminApiHandler } from "@/features/shared/api/rbac";
import { setTeacherAreas, setTeacherAreasSchema } from "@/lib/domain/admin";

/** requirePlatformAdmin — enforced by withAdminApiHandler for /api/admin/* routes. */

export const POST = withAdminApiHandler(async (request, _context, auth) => {
  const body = setTeacherAreasSchema.parse(await request.json());
  await setTeacherAreas(auth.supabase, body);
  return jsonSuccess({ saved: true });
}, { fallbackMessage: "Teacher areas could not be saved." });
