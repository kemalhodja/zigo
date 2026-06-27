"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";

import { useMessages } from "@/lib/i18n/locale-context";
import { createClient } from "@/lib/supabase/client";

type Status = "checking" | "error" | "redirecting";

export function RecoverPasswordPanel() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const m = useMessages();
  const a = m.auth;
  const [status, setStatus] = useState<Status>("checking");
  const [message, setMessage] = useState(a.loadingAuth);

  useEffect(() => {
    let active = true;
    const tokenHash = searchParams.get("token_hash")?.trim();
    const type = searchParams.get("type")?.trim();

    if (!tokenHash || type !== "recovery") {
      setStatus("error");
      setMessage(a.resetPasswordSessionMissing);
      return;
    }

    void createClient()
      .auth.verifyOtp({ token_hash: tokenHash, type: "recovery" })
      .then(({ error }) => {
        if (!active) return;
        if (error) {
          setStatus("error");
          setMessage(a.resetPasswordSessionMissing);
          return;
        }

        setStatus("redirecting");
        setMessage(a.resetPasswordDesc);
        router.replace("/auth/reset-password");
        router.refresh();
      })
      .catch(() => {
        if (!active) return;
        setStatus("error");
        setMessage(a.connectionFailed);
      });

    return () => {
      active = false;
    };
  }, [a.connectionFailed, a.loadingAuth, a.resetPasswordDesc, a.resetPasswordSessionMissing, router, searchParams]);

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
