import { createServerClient } from "@supabase/ssr";
import { type NextRequest, NextResponse } from "next/server";

import {
  authGateRedirectPath,
  isEmailConfirmed,
  isPublicAuthCheckpointPath,
  isSessionRequiredAuthCheckpointPath,
  requiresEmailConfirmation,
  resolveAuthGate,
} from "@/lib/domain/auth-gates";
import {
  isSupabaseAuthCookie,
  readRememberMePreference,
  withAuthPersistence,
  ZIGO_REMEMBER_ME_COOKIE,
} from "@/lib/supabase/auth-cookies";
import type { Database } from "@/lib/supabase/database.types";

const protectedPagePrefixes = [
  "/",
  "/admin",
  "/avatar",
  "/collections",
  "/create",
  "/explore",
  "/family",
  "/feed",
  "/learn",
  "/moderation",
  "/notifications",
  "/parent",
  "/post",
  "/profile",
  "/profiles",
  "/questions",
  "/micro",
  "/store",
  "/sparks",
  "/student",
  "/teacher",
];

const publicPagePrefixes = [
  "/auth",
  "/kampanya",
  "/legal",
  "/onboarding",
  "/readiness",
  "/setup",
];

export async function proxy(request: NextRequest) {
  if (request.nextUrl.pathname === "/api/posts") {
    return NextResponse.json(
      {
        error: "Legacy posts API retired. Use GET/POST /api/social/posts instead.",
        code: "LEGACY_POSTS_RETIRED",
        replacement: "/api/social/posts",
      },
      { status: 410 },
    );
  }

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseAnonKey) {
    return NextResponse.next({ request });
  }

  let response = NextResponse.next({ request });
  const rememberMe = readRememberMePreference(request.cookies.get(ZIGO_REMEMBER_ME_COOKIE)?.value);

  const supabase = createServerClient<Database>(supabaseUrl, supabaseAnonKey, {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(cookiesToSet) {
        cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
        response = NextResponse.next({ request });
        cookiesToSet.forEach(({ name, value, options }) => {
          response.cookies.set(
            name,
            value,
            isSupabaseAuthCookie(name) ? withAuthPersistence(options, rememberMe) : options,
          );
        });
      },
    },
  });

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const pathname = request.nextUrl.pathname;

  if (shouldSkipRoute(pathname)) {
    return response;
  }

  if (isPublicAuthCheckpointPath(pathname)) {
    if (user && isEmailConfirmed(user)) {
      const gate = await resolveAuthGate(supabase, user);
      const adminOptions = await getPlatformAdminRedirectOptions(supabase);
      return NextResponse.redirect(new URL(authGateRedirectPath(gate, adminOptions), request.url));
    }

    return response;
  }

  if (isSessionRequiredAuthCheckpointPath(pathname)) {
    if (!user) {
      const authUrl = new URL("/auth", request.url);
      authUrl.searchParams.set("next", pathname);
      return NextResponse.redirect(authUrl);
    }

    const gate = await resolveAuthGate(supabase, user);
    if (gate !== "student-document") {
      const adminOptions = await getPlatformAdminRedirectOptions(supabase);
      return NextResponse.redirect(new URL(authGateRedirectPath(gate, adminOptions), request.url));
    }

    return response;
  }

  if (pathname === "/auth" && user) {
    const gate = await resolveAuthGate(supabase, user);
    const adminOptions = await getPlatformAdminRedirectOptions(supabase);
    if (gate !== "ready") {
      return NextResponse.redirect(new URL(authGateRedirectPath(gate, adminOptions), request.url));
    }

    const next = request.nextUrl.searchParams.get("next");
    const destination =
      next?.startsWith("/") ? next : authGateRedirectPath("ready", adminOptions);
    return NextResponse.redirect(new URL(destination, request.url));
  }

  if ((pathname === "/onboarding" || pathname.startsWith("/onboarding/")) && user && requiresEmailConfirmation(user)) {
    return NextResponse.redirect(new URL("/auth/verify-email", request.url));
  }

  if (!isProtectedPage(pathname)) {
    return response;
  }

  if (!user) {
    const authUrl = new URL("/auth", request.url);
    authUrl.searchParams.set("next", pathname);
    return NextResponse.redirect(authUrl);
  }

  const gate = await resolveAuthGate(supabase, user);

  if (gate !== "ready") {
    const adminOptions = await getPlatformAdminRedirectOptions(supabase);
    return NextResponse.redirect(new URL(authGateRedirectPath(gate, adminOptions), request.url));
  }

  // Role-based Route Guard
  if (pathname.startsWith('/teacher') || pathname.startsWith('/parent') || pathname.startsWith('/student')) {
    const { data: userRow } = await supabase
      .from("users")
      .select("role")
      .eq("id", user.id)
      .maybeSingle();

    const role = (userRow as any)?.role;

    const isCreatorRole =
      role === "teacher" ||
      role === "education_institution" ||
      role === "education_platform" ||
      role === "publisher";

    // Teacher & Studio routes accessible to all creator roles
    if (pathname.startsWith('/teacher') && !isCreatorRole && role !== 'student' && role !== 'parent') {
      return NextResponse.redirect(new URL('/', request.url));
    }
    if (pathname.startsWith('/parent') && role !== 'parent') {
      return NextResponse.redirect(new URL('/', request.url));
    }
    if (pathname.startsWith('/student') && role !== 'student') {
      return NextResponse.redirect(new URL('/', request.url));
    }
  }

  return response;
}

async function getPlatformAdminRedirectOptions(
  supabase: ReturnType<typeof createServerClient<Database>>,
) {
  const { data: isPlatformAdmin } = await supabase.rpc("current_user_is_platform_admin");
  return { isPlatformAdmin: Boolean(isPlatformAdmin) };
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|manifest.json).*)"],
};

function shouldSkipRoute(pathname: string) {
  return (
    pathname.startsWith("/api") ||
    pathname.startsWith("/_next") ||
    pathname === "/favicon.ico" ||
    pathname === "/manifest.json" ||
    pathname === "/privacy-policy.html" ||
    pathname === "/terms-of-use.html" ||
    pathname === "/offline.html" ||
    pathname === "/sw.js" ||
    pathname.startsWith("/auth/callback")
  );
}

function isProtectedPage(pathname: string) {
  if (publicPagePrefixes.some((prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`))) {
    return false;
  }

  return protectedPagePrefixes.some((prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`));
}
