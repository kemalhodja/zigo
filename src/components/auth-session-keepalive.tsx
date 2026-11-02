"use client";

import { usePathname, useRouter } from "next/navigation";
import { useEffect } from "react";

import { isCapacitorClient } from "@/lib/client/capacitor-runtime";
import { createClient } from "@/lib/supabase/client";

async function resolveSignedInPath() {
  try {
    const response = await fetch("/api/auth/session", { cache: "no-store" });
    if (!response.ok) return null;

    const payload = (await response.json()) as { authenticated?: boolean; isPlatformAdmin?: boolean };
    if (!payload.authenticated) return null;
    return payload.isPlatformAdmin ? "/admin" : "/";
  } catch {
    return null;
  }
}

export function AuthSessionKeepAlive() {
  const pathname = usePathname();
  const router = useRouter();

  // NEVER run keepalive or initialize Supabase on password reset or recovery pages.
  // This prevents GoTrueClient._initialize() from clearing window.location.hash
  // or throwing PKCE mismatch errors before ResetPasswordPanel can consume the token.
  const isRecoveryPage =
    pathname === "/auth/reset-password" ||
    pathname.startsWith("/auth/reset-password") ||
    pathname === "/auth/recover" ||
    pathname.startsWith("/auth/recover");

  useEffect(() => {
    if (isRecoveryPage) return;

    let active = true;
    const supabase = createClient();

    async function syncSession() {
      if (!active) return;

      try {
        await supabase.auth.getSession();

        if (pathname === "/auth" || pathname.startsWith("/auth?")) {
          const destination = await resolveSignedInPath();
          if (destination) {
            router.replace(destination);
            router.refresh();
          }
        }
      } catch {
        // Supabase env may be missing in preview mode.
      }
    }

    void syncSession();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      if (!active || !session) return;
      void syncSession();
    });

    function handleResume() {
      void syncSession();
    }

    document.addEventListener("visibilitychange", handleResume);
    window.addEventListener("focus", handleResume);
    window.addEventListener("pageshow", handleResume);

    return () => {
      active = false;
      subscription.unsubscribe();
      document.removeEventListener("visibilitychange", handleResume);
      window.removeEventListener("focus", handleResume);
      window.removeEventListener("pageshow", handleResume);
    };
  }, [isRecoveryPage, pathname, router]);

  useEffect(() => {
    if (isRecoveryPage || !isCapacitorClient()) return;

    void createClient().auth.getSession();

    function handleResume() {
      if (document.visibilityState === "visible") {
        void createClient().auth.getSession();
      }
    }

    document.addEventListener("visibilitychange", handleResume);
    return () => document.removeEventListener("visibilitychange", handleResume);
  }, [isRecoveryPage]);

  return null;
}
