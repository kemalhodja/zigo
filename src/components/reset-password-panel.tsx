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
  const [refreshToken, setRefreshToken] = useState<string | null>(null);

  useEffect(() => {
    let active = true;

    // 0. Capture URL hash parameters synchronously BEFORE createClient() initializes
    let hashAccessToken: string | null = null;
    let hashRefreshToken: string | null = null;
    let hashError: string | null = null;

    if (typeof window !== "undefined" && window.location.hash) {
      const hash = window.location.hash.replace(/^#/, "");
      const hashParams = new URLSearchParams(hash);
      hashAccessToken = hashParams.get("access_token")?.trim() || null;
      hashRefreshToken = hashParams.get("refresh_token")?.trim() || null;
      hashError = hashParams.get("error_description") || hashParams.get("error");
    }

    // Check for error in query params or hash (e.g. expired recovery link)
    const errorParam = searchParams.get("error");
    const errorDesc = searchParams.get("error_description") || hashError;
    if (errorParam || errorDesc) {
      setStatus("error");
      const decoded = errorDesc ? decodeURIComponent(errorDesc.replace(/\+/g, " ")) : "";
      if (decoded.toLowerCase().includes("expired") || decoded.toLowerCase().includes("invalid")) {
        setMessage("Şifre sıfırlama bağlantısının süresi dolmuş veya daha önce kullanılmış. Lütfen yeni bir bağlantı isteyin.");
      } else {
        setMessage(decoded || a.resetPasswordSessionMissing);
      }
      return;
    }

    // If implicit flow provided access_token in the URL hash, unlock the form immediately
    if (hashAccessToken) {
      setSessionToken(hashAccessToken);
      if (hashRefreshToken) {
        setRefreshToken(hashRefreshToken);
      }
      setStatus("idle");
      setMessage(a.resetPasswordDesc);
    }

    const supabase = createClient();

    // 1. Listen for auth state change (PASSWORD_RECOVERY or SIGNED_IN)
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      if (!active) return;
      if (session) {
        setSessionToken(session.access_token);
        if (session.refresh_token) {
          setRefreshToken(session.refresh_token);
        }
        setStatus("idle");
        setMessage(a.resetPasswordDesc);
      }
    });

    async function initRecovery() {
      try {
        // Hydrate browser client session in background if hash tokens were present
        if (hashAccessToken && hashRefreshToken) {
          await supabase.auth
            .setSession({
              access_token: hashAccessToken,
              refresh_token: hashRefreshToken,
            })
            .catch(() => null);
          return;
        }

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
            if (data.session.refresh_token) {
              setRefreshToken(data.session.refresh_token);
            }
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
            if (data.session.refresh_token) {
              setRefreshToken(data.session.refresh_token);
            }
            setStatus("idle");
            setMessage(a.resetPasswordDesc);
            return;
          }
        }

        // 4. Check if an active session already exists in cookies/storage
        const { data: sessionData } = await supabase.auth.getSession();
        if (!active) return;
        if (sessionData.session) {
          setSessionToken(sessionData.session.access_token);
          if (sessionData.session.refresh_token) {
            setRefreshToken(sessionData.session.refresh_token);
          }
          setStatus("idle");
          setMessage(a.resetPasswordDesc);
          return;
        }

        // 5. Give Supabase client 1.2 seconds to resolve session in background
        await new Promise((resolve) => setTimeout(resolve, 1200));
        if (!active) return;

        const { data: retrySession } = await supabase.auth.getSession();
        if (!active) return;
        if (retrySession.session) {
          setSessionToken(retrySession.session.access_token);
          if (retrySession.session.refresh_token) {
            setRefreshToken(retrySession.session.refresh_token);
          }
          setStatus("idle");
          setMessage(a.resetPasswordDesc);
          return;
        }

        if (!hashAccessToken) {
          setStatus("error");
          setMessage(a.resetPasswordSessionMissing);
        }
      } catch {
        if (!active) return;
        if (!hashAccessToken) {
          setStatus("error");
          setMessage(a.connectionFailed);
        }
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
      const headers: Record<string, string> = { "Content-Type": "application/json" };
      if (sessionToken) {
        headers.Authorization = `Bearer ${sessionToken}`;
      }

      const response = await fetch("/api/auth/reset-password", {
        method: "POST",
        headers,
        body: JSON.stringify({
          password,
          confirmPassword,
          ...(refreshToken ? { refreshToken } : {}),
        }),
      });

      const result = (await response.json().catch(() => ({}))) as {
        error?: string;
        message?: string;
        redirectTo?: string;
      };

      if (!response.ok) {
        // Fallback: try direct browser client update if server API rejected
        const supabase = createClient();
        const { error: clientUpdateError } = await supabase.auth.updateUser({ password });
        if (clientUpdateError) {
          if (typeof navigator !== "undefined" && navigator.vibrate) {
            navigator.vibrate([40, 60, 40]);
          }
          setStatus("error");
          setMessage(result.error || clientUpdateError.message || a.resetPasswordFailed);
          return;
        }
      }

      if (typeof navigator !== "undefined" && navigator.vibrate) {
        navigator.vibrate(60);
      }

      const redirectTo = result.redirectTo?.startsWith("/") ? result.redirectTo : "/onboarding";
      setStatus("success");
      setMessage(result.message || a.resetPasswordSuccess);
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

  if (status === "error" && (message === a.resetPasswordSessionMissing || message.includes("süresi dolmuş"))) {
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
