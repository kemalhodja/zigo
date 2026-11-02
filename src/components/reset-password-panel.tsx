"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useRef, useState } from "react";

import { PasswordField } from "@/components/password-field";
import { useMessages } from "@/lib/i18n/locale-context";
import { createClient } from "@/lib/supabase/client";

type Status = "idle" | "loading" | "success" | "error" | "checking";

export function ResetPasswordPanel() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const m = useMessages();
  const a = m.auth;
  const submittingRef = useRef(false);
  const [status, setStatus] = useState<Status>("checking");
  const [message, setMessage] = useState(a.loadingAuth);
  const [sessionToken, setSessionToken] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    const supabase = createClient();

    // Check for error in query params (e.g. Supabase redirect with error)
    const errorParam = searchParams.get("error");
    const errorDesc = searchParams.get("error_description");
    if (errorParam || errorDesc) {
      setStatus("error");
      setMessage(errorDesc ? decodeURIComponent(errorDesc.replace(/\+/g, " ")) : a.resetPasswordSessionMissing);
      return;
    }

    // 1. Listen for auth state change (especially PASSWORD_RECOVERY event or SIGNED_IN)
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event, session) => {
      if (!active) return;
      if (session) {
        setSessionToken(session.access_token);
        setStatus("idle");
        setMessage(a.resetPasswordDesc);
      }
    });

    async function initRecovery() {
      try {
        // 2. Check if token_hash is in URL query parameters (OTP verify link)
        const tokenHash = searchParams.get("token_hash")?.trim();
        const type = searchParams.get("type")?.trim();
        if (tokenHash && (type === "recovery" || !type)) {
          const { data, error } = await supabase.auth.verifyOtp({
            token_hash: tokenHash,
            type: "recovery",
          });
          if (!active) return;
          if (!error && data.session) {
            setSessionToken(data.session.access_token);
            setStatus("idle");
            setMessage(a.resetPasswordDesc);
            return;
          }
        }

        // 3. Check if PKCE code is in URL query parameters
        const code = searchParams.get("code")?.trim();
        if (code) {
          const { data, error } = await supabase.auth.exchangeCodeForSession(code);
          if (!active) return;
          if (!error && data.session) {
            setSessionToken(data.session.access_token);
            setStatus("idle");
            setMessage(a.resetPasswordDesc);
            return;
          }
        }

        // 4. Check if access_token is in URL hash fragment (#access_token=...&type=recovery)
        if (typeof window !== "undefined" && window.location.hash) {
          const hash = window.location.hash.replace(/^#/, "");
          const hashParams = new URLSearchParams(hash);
          const accessToken = hashParams.get("access_token")?.trim();
          const refreshToken = hashParams.get("refresh_token")?.trim();
          const hashError = hashParams.get("error_description") || hashParams.get("error");

          if (hashError) {
            setStatus("error");
            setMessage(decodeURIComponent(hashError.replace(/\+/g, " ")));
            return;
          }

          if (accessToken && refreshToken) {
            const { data, error } = await supabase.auth.setSession({
              access_token: accessToken,
              refresh_token: refreshToken,
            });
            if (!active) return;
            if (!error && data.session) {
              setSessionToken(data.session.access_token);
              setStatus("idle");
              setMessage(a.resetPasswordDesc);
              return;
            }
          }
        }

        // 5. Check if an active session already exists in cookies/storage
        const { data: sessionData } = await supabase.auth.getSession();
        if (!active) return;
        if (sessionData.session) {
          setSessionToken(sessionData.session.access_token);
          setStatus("idle");
          setMessage(a.resetPasswordDesc);
          return;
        }

        // 6. Give Supabase client 1.5 seconds to parse hash or resolve session in background
        await new Promise((resolve) => setTimeout(resolve, 1500));
        if (!active) return;

        const { data: retrySession } = await supabase.auth.getSession();
        if (!active) return;
        if (retrySession.session) {
          setSessionToken(retrySession.session.access_token);
          setStatus("idle");
          setMessage(a.resetPasswordDesc);
          return;
        }

        setStatus("error");
        setMessage(a.resetPasswordSessionMissing);
      } catch {
        if (!active) return;
        setStatus("error");
        setMessage(a.connectionFailed);
      }
    }

    void initRecovery();

    return () => {
      active = false;
      subscription.unsubscribe();
    };
  }, [a.connectionFailed, a.loadingAuth, a.resetPasswordDesc, a.resetPasswordSessionMissing, searchParams]);

  async function submitResetPassword(formData: FormData) {
    if (submittingRef.current || status === "loading" || status === "checking") return;

    const password = String(formData.get("password") ?? "").trim();
    const confirmPassword = String(formData.get("confirmPassword") ?? "").trim();

    if (!password || password.length < 8) {
      setStatus("error");
      setMessage("Şifre en az 8 karakter olmalıdır.");
      return;
    }

    if (password !== confirmPassword) {
      setStatus("error");
      setMessage("Şifreler eşleşmiyor.");
      return;
    }

    submittingRef.current = true;
    setStatus("loading");
    setMessage(a.updatingPassword);

    try {
      const supabase = createClient();

      // First: update password directly via browser Supabase client
      const { error: clientUpdateError } = await supabase.auth.updateUser({ password });

      if (clientUpdateError) {
        if (typeof navigator !== "undefined" && navigator.vibrate) {
          navigator.vibrate([40, 60, 40]);
        }
        setStatus("error");
        const normalized = clientUpdateError.message.toLowerCase();
        if (normalized.includes("same")) {
          setMessage("Yeni şifre eskisiyle aynı olamaz.");
        } else if (normalized.includes("password")) {
          setMessage("Daha güçlü bir şifre seçmelisin.");
        } else {
          setMessage(clientUpdateError.message || a.resetPasswordFailed);
        }
        return;
      }

      // Second: notify server API to synchronize server-side auth cookies and get gate redirect
      let redirectTo = "/onboarding";
      try {
        const headers: Record<string, string> = { "Content-Type": "application/json" };
        if (sessionToken) {
          headers.Authorization = `Bearer ${sessionToken}`;
        }

        const response = await fetch("/api/auth/reset-password", {
          method: "POST",
          headers,
          body: JSON.stringify({ password, confirmPassword }),
        });
        const result = (await response.json()) as { redirectTo?: string };
        if (response.ok && result.redirectTo?.startsWith("/")) {
          redirectTo = result.redirectTo;
        }
      } catch {
        // Client update already succeeded; continue to redirect
      }

      if (typeof navigator !== "undefined" && navigator.vibrate) {
        navigator.vibrate(60);
      }

      setStatus("success");
      setMessage(a.resetPasswordSuccess);
      router.refresh();
      setTimeout(() => {
        router.push(redirectTo);
      }, 1200);
    } catch {
      setStatus("error");
      setMessage(a.connectionFailed);
    } finally {
      submittingRef.current = false;
    }
  }

  if (status === "checking") {
    return (
      <div className="-mx-4 flex items-center gap-3 bg-white px-4 py-8 text-sm font-bold text-slate-500">
        <svg
          className="h-5 w-5 animate-spin text-crystal"
          fill="none"
          viewBox="0 0 24 24"
          xmlns="http://www.w3.org/2000/svg"
        >
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
          <path
            className="opacity-75"
            d="M4 12a8 8 0 018-8v8H4z"
            fill="currentColor"
          />
        </svg>
        <span>{a.loadingAuth}</span>
      </div>
    );
  }

  if (status === "error" && message === a.resetPasswordSessionMissing) {
    return (
      <div className="-mx-4 space-y-4 bg-white px-4 pb-4">
        <p className="rounded-xl border border-red-100 bg-red-50 px-4 py-3 text-sm font-bold leading-6 text-red-600">
          {message}
        </p>
        <div className="flex flex-wrap items-center gap-4">
          <Link
            className="inline-block rounded-xl bg-crystal px-4 py-2.5 text-sm font-black text-white shadow-sm transition hover:opacity-95"
            href="/auth/forgot-password"
          >
            {a.sendResetLink}
          </Link>
          <Link className="inline-block text-sm font-black text-slate-500 hover:text-slate-800" href="/auth">
            {a.backToAuth}
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="-mx-4 space-y-4 bg-white px-4 pb-4">
      <p className="rounded-xl border border-violet-100 bg-violet-50 px-4 py-3 text-sm font-bold leading-6 text-crystal">
        {a.resetPasswordDesc}
      </p>

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
          className="tap-scale w-full rounded-xl bg-gradient-to-r from-crystal via-berry to-aqua px-4 py-3.5 text-sm font-black text-white shadow-md disabled:opacity-60"
          disabled={status === "loading" || status === "success"}
          type="submit"
        >
          {status === "loading" ? a.updatingPassword : a.saveNewPassword}
        </button>
      </form>

      {message && status !== "idle" ? (
        <p
          className={`rounded-xl px-4 py-3 text-sm font-bold transition-all ${
            status === "error"
              ? "border border-red-100 bg-red-50 text-red-600"
              : status === "success"
                ? "border border-emerald-100 bg-emerald-50 text-emerald-600"
                : "border border-slate-100 bg-slate-50 text-slate-600"
          }`}
        >
          {message}
        </p>
      ) : null}
    </div>
  );
}
