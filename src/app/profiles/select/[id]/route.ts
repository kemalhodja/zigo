import { NextResponse } from "next/server";

import { getChildProfiles } from "@/lib/domain/children";
import { getCurrentProfile } from "@/lib/domain/profiles";
import {
  ACTIVE_CHILD_PROFILE_COOKIE,
  activeChildProfileCookieOptions,
} from "@/lib/server/active-child-profile";
import { createClient } from "@/lib/supabase/server";

type RouteContext = {
  params: Promise<{ id: string }>;
};

export async function GET(request: Request, context: RouteContext) {
  const { id: childProfileId } = await context.params;
  const supabase = await createClient();
  const profile = await getCurrentProfile(supabase);

  if (!profile) {
    return NextResponse.redirect(new URL("/auth?next=/profiles", request.url));
  }

  if (profile.role !== "parent") {
    return NextResponse.redirect(new URL("/profiles", request.url));
  }

  const children = await getChildProfiles(supabase);
  const child = children.find((entry) => entry.id === childProfileId);
  if (!child) {
    return NextResponse.redirect(new URL("/profiles", request.url));
  }

  const next = new URL(request.url).searchParams.get("next") ?? "/student";
  const redirectUrl = new URL(next.startsWith("/") ? next : "/student", request.url);
  redirectUrl.searchParams.set("childProfileId", childProfileId);

  const response = NextResponse.redirect(redirectUrl);
  response.cookies.set(
    ACTIVE_CHILD_PROFILE_COOKIE,
    childProfileId,
    activeChildProfileCookieOptions(process.env.NODE_ENV === "production"),
  );

  return response;
}
