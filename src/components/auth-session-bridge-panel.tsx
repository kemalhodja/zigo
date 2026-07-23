"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";

import { useMessages } from "@/lib/i18n/locale-context";
import { createClient } from "@/lib/supabase/client";

type Status = "checking" | "error" | "redirecting";

export function AuthSessionBridgePanel() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const m = useMessages();
  const a = m.auth;
  const [status, setStatus] = useState<Status>("checking");
  const [message, setMessage] = useState(a.loadingAuth);

  useEffect(() => {
    let active = true;
    const nextParam = searchParams.get("next");
    const next = nextParam?.startsWith("/") ? nextParam : "/auth/reset-password";

    async function complete() {
      const supabase = createClient();
      const hash = typeof window !== "undefined" ? window.location.hash.replace(/^#/, "") : "";
      const hashParams = new URLSearchParams(hash);
      const accessToken = hashParams.get("access_token");
      const refreshToken = hashParams.get("refresh_token");
      const type = hashParams.get("type");
      const errorDescription = hashParams.get("error_description") ?? hashParams.get("error");

      if (errorDescription) {
        if (!active) return;
        setStatus("error");
        setMessage(decodeURIComponent(errorDescription.replace(/\+/g, " ")));
        return;
      }

      if (accessToken && refreshToken) {
        const { error } = await supabase.auth.setSession({
          access_token: accessToken,
          refresh_token: refreshToken,
        });
        if (!active) return;
        if (error) {
          setStatus("error");
          setMessage(a.resetPasswordSessionMissing);
          return;
        }

        setStatus("redirecting");
        const destination = type === "recovery" ? "/auth/reset-password" : next;
        window.history.replaceState(null, "", window.location.pathname + window.location.search);
        router.replace(destination);
        router.refresh();
        return;
      }

      const { data } = await supabase.auth.getSession();
      if (!active) return;
      if (data.session) {
        setStatus("redirecting");
        router.replace(next);
        router.refresh();
        return;
      }

      setStatus("error");
      setMessage(a.resetPasswordSessionMissing);
    }

    void complete().catch(() => {
      if (!active) return;
      setStatus("error");
      setMessage(a.connectionFailed);
    });

    return () => {
      active = false;
    };
  }, [a.connectionFailed, a.loadingAuth, a.resetPasswordSessionMissing, router, searchParams]);

  return (
    <div className="-mx-4 space-y-4 bg-white px-4 pb-4">
      <p
        className={`rounded-lg px-4 py-3 text-sm font-bold ${
          status === "error" ? "bg-red-50 text-red-600" : "bg-violet-50 text-crystal"
        }`}
      >
        {message}
      </p>

      {status === "error" ? (
        <div className="space-x-4">
          <Link className="inline-block text-sm font-black text-crystal" href="/auth/forgot-password">
            {a.sendResetLink}
          </Link>
          <Link className="inline-block text-sm font-black text-slate-500" href="/auth">
            {a.backToAuth}
          </Link>
        </div>
      ) : null}
    </div>
  );
}
