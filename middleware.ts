import { createServerClient } from "@supabase/ssr";
import { type NextRequest, NextResponse } from "next/server";

import {
  authGateRedirectPath,
  isAuthCheckpointPath,
  isEmailConfirmed,
  requiresEmailConfirmation,
  resolveAuthGate,
} from "@/lib/domain/auth-gates";
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
  "/questions",
  "/micro",
  "/store",
  "/sparks",
  "/reels",
  "/stories",
  "/student",
  "/teacher",
];

const publicPagePrefixes = [
  "/auth",
  "/legal",
  "/onboarding",
  "/profiles",
  "/readiness",
  "/setup",
];

export async function middleware(request: NextRequest) {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseAnonKey) {
    return NextResponse.next({ request });
  }

  let response = NextResponse.next({ request });

  const supabase = createServerClient<Database>(supabaseUrl, supabaseAnonKey, {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(cookiesToSet) {
        cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
        response = NextResponse.next({ request });
        cookiesToSet.forEach(({ name, value, options }) => {
          response.cookies.set(name, value, options);
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

  if (isAuthCheckpointPath(pathname)) {
    if (!user) {
      const authUrl = new URL("/auth", request.url);
      authUrl.searchParams.set("next", pathname);
      return NextResponse.redirect(authUrl);
    }

    if (pathname.startsWith("/auth/verify-email") && isEmailConfirmed(user)) {
      const gate = await resolveAuthGate(supabase, user);
      return NextResponse.redirect(new URL(authGateRedirectPath(gate), request.url));
    }

    if (pathname.startsWith("/auth/verify-student")) {
      const gate = await resolveAuthGate(supabase, user);
      if (gate !== "student-document") {
        return NextResponse.redirect(new URL(authGateRedirectPath(gate), request.url));
      }
    }

    return response;
  }

  if (pathname === "/auth" && user) {
    const gate = await resolveAuthGate(supabase, user);
    if (gate !== "ready") {
      return NextResponse.redirect(new URL(authGateRedirectPath(gate), request.url));
    }

    return NextResponse.redirect(new URL("/", request.url));
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
    return NextResponse.redirect(new URL(authGateRedirectPath(gate), request.url));
  }

  return response;
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
