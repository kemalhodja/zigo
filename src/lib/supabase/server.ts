import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

import {
  getAuthCookieMaxAge,
  isSupabaseAuthCookie,
  readRememberMePreference,
  withAuthPersistence,
  ZIGO_REMEMBER_ME_COOKIE,
} from "./auth-cookies";
import type { Database } from "./database.types";

function getSupabaseEnv() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseAnonKey) {
    throw new Error("Missing NEXT_PUBLIC_SUPABASE_URL or NEXT_PUBLIC_SUPABASE_ANON_KEY");
  }

  return { supabaseUrl, supabaseAnonKey };
}

export async function createClient() {
  const cookieStore = await cookies();
  const { supabaseUrl, supabaseAnonKey } = getSupabaseEnv();
  const rememberMe = readRememberMePreference(cookieStore.get(ZIGO_REMEMBER_ME_COOKIE)?.value);

  return createServerClient<Database>(supabaseUrl, supabaseAnonKey, {
    cookies: {
      getAll() {
        return cookieStore.getAll();
      },
      setAll(cookiesToSet) {
        try {
          cookiesToSet.forEach(({ name, value, options }) => {
            cookieStore.set(
              name,
              value,
              isSupabaseAuthCookie(name) ? withAuthPersistence(options, rememberMe) : options,
            );
          });
        } catch {
          // Server Components cannot always write cookies; route handlers can.
        }
      },
    },
  });
}

export async function createAuthActionClient(rememberMe = true) {
  const cookieStore = await cookies();
  const { supabaseUrl, supabaseAnonKey } = getSupabaseEnv();

  return createServerClient<Database>(supabaseUrl, supabaseAnonKey, {
    cookies: {
      getAll() {
        return cookieStore.getAll();
      },
      setAll(cookiesToSet) {
        cookiesToSet.forEach(({ name, value, options }) => {
          cookieStore.set(
            name,
            value,
            isSupabaseAuthCookie(name) ? withAuthPersistence(options, rememberMe) : options,
          );
        });
      },
    },
  });
}

export async function persistRememberMePreference(rememberMe: boolean) {
  const cookieStore = await cookies();

  cookieStore.set(ZIGO_REMEMBER_ME_COOKIE, rememberMe ? "1" : "0", {
    maxAge: 60 * 60 * 24 * 365,
    path: "/",
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
  });
}

export function getRememberMeMaxAge(requestCookies: { name: string; value: string }[]) {
  const value = requestCookies.find((cookie) => cookie.name === ZIGO_REMEMBER_ME_COOKIE)?.value;
  return getAuthCookieMaxAge(readRememberMePreference(value));
}
