"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";

import { PasswordField } from "@/components/password-field";
import { useMessages } from "@/lib/i18n/locale-context";
import { createClient } from "@/lib/supabase/client";

type Status = "idle" | "loading" | "success" | "error" | "checking";

export function ResetPasswordPanel() {
  const router = useRouter();
  const m = useMessages();
  const a = m.auth;
  const submittingRef = useRef(false);
  const [status, setStatus] = useState<Status>("checking");
  const [message, setMessage] = useState(a.resetPasswordDesc);

  useEffect(() => {
    let active = true;

    void createClient()
      .auth.getSession()
      .then(({ data }) => {
        if (!active) return;
        if (data.session) {
          setStatus("idle");
          setMessage(a.resetPasswordDesc);
          return;
        }
        setStatus("error");
        setMessage(a.resetPasswordSessionMissing);
      })
      .catch(() => {
        if (!active) return;
        setStatus("error");
        setMessage(a.connectionFailed);
      });

    return () => {
      active = false;
    };
  }, [a.connectionFailed, a.resetPasswordDesc, a.resetPasswordSessionMissing]);

  async function submitResetPassword(formData: FormData) {
    if (submittingRef.current || status === "loading" || status === "checking" || status === "error") return;

    submittingRef.current = true;
    setStatus("loading");
    setMessage(a.updatingPassword);

    const password = String(formData.get("password") ?? "");
    const confirmPassword = String(formData.get("confirmPassword") ?? "");

    try {
      const response = await fetch("/api/auth/reset-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password, confirmPassword }),
      });
      const result = (await response.json()) as {
        error?: string;
        message?: string;
        isPlatformAdmin?: boolean;
        redirectTo?: string;
        code?: string;
        retryAfterSeconds?: number;
      };

      if (!response.ok) {
        setStatus("error");
        if (result.code === "RATE_LIMITED" && result.retryAfterSeconds) {
          const minutes = Math.max(1, Math.ceil(result.retryAfterSeconds / 60));
          setMessage(`${result.error ?? a.resetPasswordFailed} (${minutes} dk sonra tekrar dene)`);
        } else {
          setMessage(result.error ?? a.resetPasswordFailed);
        }
        return;
      }

      setStatus("success");
      setMessage(result.message ?? a.resetPasswordSuccess);
      router.refresh();
      router.push(result.redirectTo?.startsWith("/") ? result.redirectTo : "/onboarding");
    } catch {
      setStatus("error");
      setMessage(a.connectionFailed);
    } finally {
      submittingRef.current = false;
    }
  }

  if (status === "checking") {
    return (
      <div className="-mx-4 bg-white px-4 py-8 text-sm font-bold text-slate-500">{a.loadingAuth}</div>
    );
  }

  if (status === "error" && message === a.resetPasswordSessionMissing) {
    return (
      <div className="-mx-4 space-y-4 bg-white px-4 pb-4">
        <p className="rounded-lg bg-red-50 px-4 py-3 text-sm font-bold leading-6 text-red-600">{message}</p>
        <Link className="inline-block text-sm font-black text-crystal" href="/auth/forgot-password">
          {a.sendResetLink}
        </Link>
        <Link className="ml-4 inline-block text-sm font-black text-slate-500" href="/auth">
          {a.backToAuth}
        </Link>
      </div>
    );
  }

  return (
    <div className="-mx-4 space-y-4 bg-white px-4 pb-4">
      <p className="rounded-lg bg-violet-50 px-4 py-3 text-sm font-bold leading-6 text-crystal">{a.resetPasswordDesc}</p>

      <form action={submitResetPassword} className="space-y-4">
        <PasswordField
          autoComplete="new-password"
          hideLabel={a.hidePassword}
          label={a.newPassword}
          minLength={8}
          name="password"
          placeholder={a.passwordHint}
          showLabel={a.showPassword}
        />

        <PasswordField
          autoComplete="new-password"
          hideLabel={a.hidePassword}
          label={a.confirmPassword}
          minLength={8}
          name="confirmPassword"
          placeholder={a.passwordHint}
          showLabel={a.showPassword}
        />

        <button
          className="tap-scale w-full rounded-lg bg-gradient-to-r from-crystal via-berry to-aqua px-4 py-3.5 text-sm font-black text-white disabled:opacity-60"
          disabled={status === "loading"}
          type="submit"
        >
          {status === "loading" ? a.updatingPassword : a.saveNewPassword}
        </button>
      </form>

      <p
        className={`rounded-lg px-4 py-3 text-sm font-bold ${
          status === "error" ? "bg-red-50 text-red-600" : status === "success" ? "bg-emerald-50 text-emerald-600" : "bg-slate-50 text-slate-600"
        }`}
      >
        {message}
      </p>
    </div>
  );
}
