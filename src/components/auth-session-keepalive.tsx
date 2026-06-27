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

  useEffect(() => {
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
  }, [pathname, router]);

  useEffect(() => {
    if (!isCapacitorClient()) return;

    void createClient().auth.getSession();

    function handleResume() {
      if (document.visibilityState === "visible") {
        void createClient().auth.getSession();
      }
    }

    document.addEventListener("visibilitychange", handleResume);
    return () => document.removeEventListener("visibilitychange", handleResume);
  }, []);

  return null;
}
