import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

export async function middleware(request: NextRequest) {
  let supabaseResponse = NextResponse.next({
    request,
  });

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseAnonKey) {
    return supabaseResponse;
  }

  const supabase = createServerClient(
    supabaseUrl,
    supabaseAnonKey,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) => request.cookies.set(name, value));
          supabaseResponse = NextResponse.next({
            request,
          });
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          );
        },
      },
    }
  );

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const url = request.nextUrl.clone();
  const path = url.pathname;

  if (!user && (path.startsWith('/teacher') || path.startsWith('/parent') || path.startsWith('/student') || path.startsWith('/profile'))) {
    url.pathname = '/auth';
    return NextResponse.redirect(url);
  }

  if (user && (path.startsWith('/teacher') || path.startsWith('/parent') || path.startsWith('/student'))) {
    const { data: profile } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", user.id)
      .single();

    const role = profile?.role;

    if (path.startsWith('/teacher') && role !== 'teacher') {
      url.pathname = '/';
      return NextResponse.redirect(url);
    }

    if (path.startsWith('/parent') && role !== 'parent') {
      url.pathname = '/';
      return NextResponse.redirect(url);
    }
    
    if (path.startsWith('/student') && role !== 'student') {
       url.pathname = '/';
       return NextResponse.redirect(url);
    }
  }

  return supabaseResponse;
}

export const config = {
  matcher: [
    '/teacher/:path*',
    '/parent/:path*',
    '/student/:path*',
    '/profile/:path*'
  ],
};
