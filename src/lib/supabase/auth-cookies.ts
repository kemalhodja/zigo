export const ZIGO_REMEMBER_ME_COOKIE = "zigo_remember_me";

/** Stay signed in until explicit sign-out (mobile-friendly). */
export const AUTH_REMEMBER_MAX_AGE_SECONDS = 60 * 60 * 24 * 365;

/** Shorter session when the user opts out of remember-me. */
export const AUTH_SESSION_MAX_AGE_SECONDS = 60 * 60 * 24;

export function getAuthCookieMaxAge(rememberMe: boolean) {
  return rememberMe ? AUTH_REMEMBER_MAX_AGE_SECONDS : AUTH_SESSION_MAX_AGE_SECONDS;
}

export function readRememberMePreference(cookieValue: string | undefined) {
  return cookieValue !== "0";
}

export function withAuthPersistence<T extends Record<string, unknown>>(
  options: T,
  rememberMe: boolean,
): T {
  return {
    ...options,
    maxAge: getAuthCookieMaxAge(rememberMe),
    path: (options.path as string | undefined) ?? "/",
    sameSite: (options.sameSite as "lax" | "strict" | "none" | undefined) ?? "lax",
    secure: (options.secure as boolean | undefined) ?? process.env.NODE_ENV === "production",
  };
}

export function isSupabaseAuthCookie(name: string) {
  return name.startsWith("sb-") || name.includes("auth-token");
}
