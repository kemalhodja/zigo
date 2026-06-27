import { NextResponse } from "next/server";

import { isErrorResponse, requireAuthenticatedProfile } from "@/features/shared/api/require-auth";
import { withApiHandler } from "@/features/shared/api/with-api-handler";
import {
  getProfessionalProfileBundle,
  resolveProfessionalProfileKind,
  upsertEducationPlatformProfileExtras,
  upsertInstitutionProfileExtras,
  upsertInstitutionProfileExtrasSchema,
  upsertPlatformProfileExtrasSchema,
  upsertTeacherProfileExtras,
  upsertTeacherProfileExtrasSchema,
} from "@/lib/domain/professional-profile";
import { updateUserProfile } from "@/lib/domain/profiles";
import { createClient } from "@/lib/supabase/server";

export const GET = withApiHandler(async () => {
  const supabase = await createClient();
  const profile = await requireAuthenticatedProfile(supabase);
  if (isErrorResponse(profile)) return profile;

  const bundle = await getProfessionalProfileBundle(supabase, profile);
  return NextResponse.json({
    data: {
      kind: bundle.kind,
      profile: {
        fullName: profile.full_name,
        bio: profile.bio,
        avatarUrl: profile.avatar_url,
        organizationType: profile.organization_type,
      },
      teacher: bundle.teacher,
      institution: bundle.institution,
      platform: bundle.platform,
    },
  });
});

export const PATCH = withApiHandler(async (request) => {
  const supabase = await createClient();
  const profile = await requireAuthenticatedProfile(supabase);
  if (isErrorResponse(profile)) return profile;

  const body = (await request.json()) as {
    step?: "general" | "expertise" | "financial";
    general?: { bio?: string; avatarUrl?: string };
    teacher?: unknown;
    institution?: unknown;
    platform?: unknown;
  };

  if (body.general?.bio !== undefined || body.general?.avatarUrl !== undefined) {
    await updateUserProfile(supabase, {
      bio: body.general.bio,
      avatarUrl: body.general.avatarUrl,
    });
  }

  const kind = resolveProfessionalProfileKind(profile);
  if (!kind) {
    return NextResponse.json({ data: { updated: "general" } });
  }

  if (kind === "teacher" && body.teacher) {
    const data = await upsertTeacherProfileExtras(supabase, upsertTeacherProfileExtrasSchema.parse(body.teacher));
    return NextResponse.json({ data });
  }

  if (kind === "institution" && body.institution) {
    const data = await upsertInstitutionProfileExtras(
      supabase,
      upsertInstitutionProfileExtrasSchema.parse(body.institution),
    );
    return NextResponse.json({ data });
  }

  if (kind === "platform" && body.platform) {
    const data = await upsertEducationPlatformProfileExtras(
      supabase,
      upsertPlatformProfileExtrasSchema.parse(body.platform),
    );
    return NextResponse.json({ data });
  }

  return NextResponse.json({ data: { updated: "general" } });
});
