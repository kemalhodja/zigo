import type { cookies } from "next/headers";

export const ACTIVE_CHILD_PROFILE_COOKIE = "zigo_active_child_profile";

export function readActiveChildProfileId(
  cookieStore: Awaited<ReturnType<typeof cookies>>,
): string | null {
  const value = cookieStore.get(ACTIVE_CHILD_PROFILE_COOKIE)?.value?.trim();
  if (!value) return null;
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(value)
    ? value
    : null;
}

export function activeChildProfileCookieOptions(isProduction: boolean) {
  return {
    httpOnly: true,
    sameSite: "lax" as const,
    path: "/",
    secure: isProduction,
    maxAge: 60 * 60 * 24 * 30,
  };
}
