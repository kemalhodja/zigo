"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { type FormEvent, useEffect, useMemo, useRef, useState } from "react";

import { PasswordField } from "@/components/password-field";
import { PasswordStrengthHints } from "@/components/password-strength-hints";
import { isCapacitorClient } from "@/lib/client/capacitor-runtime";
import { markRegistrationCampaignAnnouncementPending } from "@/lib/client/registration-campaign-announcement";
import { validateRegistrationPassword } from "@/lib/domain/password-policy";
import {
  REGISTRATION_ACCOUNT_OPTIONS,
  type RegistrationAccountKind,
} from "@/lib/domain/registration-account";
import { useRecaptcha } from "@/lib/hooks/use-recaptcha";
import { useMessages } from "@/lib/i18n/locale-context";

type Mode = "sign-in" | "sign-up";
type Status = "idle" | "loading" | "success" | "error";

const REMEMBER_PREF_KEY = "zigo_remember_me_pref";

function readRememberPref() {
  if (typeof window === "undefined") return true;

  const stored = window.localStorage.getItem(REMEMBER_PREF_KEY);
  if (stored === "0") return false;
  if (stored === "1") return true;

  return isCapacitorClient();
}

function formatRateLimitMessage(message: string, retryAfterSeconds?: number) {
  if (!retryAfterSeconds || retryAfterSeconds <= 0) return message;
  const minutes = Math.max(1, Math.ceil(retryAfterSeconds / 60));
  return `${message} (${minutes} dk sonra tekrar dene)`;
}

export function AuthPanel() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const m = useMessages();
  const a = m.auth;
  const submittingRef = useRef(false);

  const roleOptions = useMemo(() => REGISTRATION_ACCOUNT_OPTIONS, []);

  const [mode, setMode] = useState<Mode>("sign-in");
  const [accountKind, setAccountKind] = useState<RegistrationAccountKind>("student");
  const [rememberMe, setRememberMe] = useState(true);
  const [email, setEmail] = useState("");
  const [fullName, setFullName] = useState("");
  const [password, setPassword] = useState("");
  const [status, setStatus] = useState<Status>("idle");
  const [message, setMessage] = useState(searchParams.get("error") ?? a.defaultMessage);
  const recaptcha = useRecaptcha(mode === "sign-up" ? "signup" : "signin");

  useEffect(() => {
    setRememberMe(readRememberPref());
  }, []);

  async function submitAuth(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (submittingRef.current || status === "loading") return;

    submittingRef.current = true;
    setStatus("loading");
    setMessage(mode === "sign-up" ? a.creatingAccount : a.signingYouIn);

    try {
      let recaptchaToken: string | undefined;
      if (recaptcha.enabled) {
        if (!recaptcha.ready) {
          setStatus("error");
          setMessage(a.recaptchaLoading);
          return;
        }

        recaptchaToken = (await recaptcha.getToken()) ?? undefined;
        if (!recaptchaToken) {
          setStatus("error");
          setMessage(a.recaptchaFailed);
          return;
        }
      }

      const selectedAccount = roleOptions.find((option) => option.id === accountKind) ?? roleOptions[0];
      const isMobileClient = isCapacitorClient();
      const rememberMeChecked = isMobileClient ? true : rememberMe;
      const trimmedEmail = email.trim();
      const trimmedFullName = fullName.trim();

      if (mode === "sign-up") {
        if (trimmedFullName.length < 2) {
          setStatus("error");
          setMessage("Ad soyad en az 2 karakter olmalı.");
          return;
        }

        const passwordValidation = validateRegistrationPassword(password);
        if (!passwordValidation.ok) {
          setStatus("error");
          setMessage(passwordValidation.message);
          return;
        }
      }

      const payload =
        mode === "sign-up"
          ? {
              email: trimmedEmail,
              fullName: trimmedFullName,
              password,
              accountKind,
              role: selectedAccount.role,
              ...(selectedAccount.organizationType
                ? { organizationType: selectedAccount.organizationType }
                : {}),
              recaptchaToken,
            }
          : {
              email: trimmedEmail,
              password,
              rememberMe: rememberMeChecked,
              recaptchaToken,
            };

      if (mode === "sign-in") {
        window.localStorage.setItem(REMEMBER_PREF_KEY, rememberMeChecked ? "1" : "0");
      }

      let response: Response;
      let result: {
        error?: string;
        message?: string;
        needsEmailConfirmation?: boolean;
        isPlatformAdmin?: boolean;
        code?: string;
        retryAfterSeconds?: number;
      } = {};

      try {
        response = await fetch(`/api/auth/${mode}`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          credentials: "include",
          body: JSON.stringify(payload),
        });
        result = (await response.json()) as typeof result;
      } catch {
        setStatus("error");
        setMessage(a.connectionFailed);
        return;
      }

      if (!response.ok) {
        setStatus("error");
        const errorMessage =
          result.code === "RATE_LIMITED"
            ? formatRateLimitMessage(result.error ?? a.authFailed, result.retryAfterSeconds)
            : (result.error ?? a.authFailed);
        setMessage(errorMessage);

        if (result.needsEmailConfirmation) {
          router.push(`/auth/verify-email?email=${encodeURIComponent(trimmedEmail)}`);
        }
        return;
      }

      setStatus("success");
      setMessage(mode === "sign-up" ? (result.message ?? a.accountCreated) : a.signedIn);

      if (mode === "sign-up") {
        setPassword("");
        markRegistrationCampaignAnnouncementPending();
      }

      router.refresh();

      if (mode === "sign-up" && result.needsEmailConfirmation) {
        setMessage(result.message ?? a.checkEmail);
        router.push(`/auth/verify-email?email=${encodeURIComponent(trimmedEmail)}`);
        return;
      }

      const next = searchParams.get("next");
      if (mode === "sign-in" && result.isPlatformAdmin) {
        router.push(next?.startsWith("/admin") ? next : "/admin");
        return;
      }

      router.push(next?.startsWith("/") ? next : mode === "sign-up" ? "/onboarding" : "/");
    } finally {
      submittingRef.current = false;
    }
  }

  return (
    <div className="-mx-4 space-y-5 bg-white px-4 pb-4">
      <div className="grid grid-cols-2 rounded-lg bg-slate-100 p-1 text-sm font-black">
        <button
          className={`tap-scale rounded-lg px-4 py-2.5 ${
            mode === "sign-in"
              ? "bg-white text-crystal shadow-sm ring-1 ring-crystal/25"
              : "text-slate-500"
          }`}
          data-testid="auth-mode-sign-in"
          onClick={() => {
            setMode("sign-in");
            setStatus("idle");
            setMessage(a.signInContinue);
          }}
          type="button"
        >
          {a.signIn}
        </button>
        <button
          className={`tap-scale rounded-lg px-4 py-2.5 ${
            mode === "sign-up"
              ? "bg-gradient-to-r from-crystal to-berry text-white shadow-sm"
              : "text-slate-500"
          }`}
          data-testid="auth-mode-sign-up"
          onClick={() => {
            setMode("sign-up");
            setStatus("idle");
            setMessage(a.signUpContinue);
          }}
          type="button"
        >
          {a.signUp}
        </button>
      </div>

      <form className="space-y-4" onSubmit={submitAuth}>
        {mode === "sign-up" ? (
          <div>
            <label className="text-xs font-black uppercase tracking-[0.2em] text-slate-500">{a.fullName}</label>
            <input
              className="zigo-input mt-2 w-full rounded-xl px-4 py-3 text-sm outline-none"
              name="fullName"
              onChange={(event) => setFullName(event.target.value)}
              placeholder="Zigo Kullanıcı"
              required
              value={fullName}
            />
          </div>
        ) : null}

        <div>
          <label className="text-xs font-black uppercase tracking-[0.2em] text-slate-500">{a.email}</label>
          <input
            className="zigo-input mt-2 w-full rounded-xl px-4 py-3 text-sm outline-none"
            name="email"
            onChange={(event) => setEmail(event.target.value)}
            placeholder="sen@ornek.com"
            required
            type="email"
            value={email}
          />
        </div>

        <PasswordField
          autoComplete={mode === "sign-up" ? "new-password" : "current-password"}
          hideLabel={a.hidePassword}
          label={a.password}
          minLength={mode === "sign-up" ? 10 : 8}
          onChange={setPassword}
          placeholder={a.passwordHint}
          showLabel={a.showPassword}
          value={password}
        />

        {mode === "sign-up" ? <PasswordStrengthHints password={password} /> : null}

        {mode === "sign-in" ? (
          <label className="flex items-start gap-3 rounded-xl bg-slate-50 px-3 py-3">
            <input
              checked={rememberMe}
              className="mt-0.5 size-4 rounded border-slate-300 text-crystal"
              disabled={isCapacitorClient()}
              name="rememberMe"
              onChange={(event) => setRememberMe(event.target.checked)}
              type="checkbox"
            />
            <span>
              <span className="block text-sm font-black text-slate-700">{a.rememberMe}</span>
              <span className="mt-0.5 block text-xs font-semibold leading-5 text-slate-500">
                {isCapacitorClient() ? a.rememberMeMobileHint : a.rememberMeHint}
              </span>
            </span>
          </label>
        ) : null}

        {mode === "sign-in" ? (
          <p className="text-right">
            <a className="text-sm font-black text-crystal" href="/auth/forgot-password">
              {a.forgotPassword}
            </a>
          </p>
        ) : null}

        {mode === "sign-up" ? (
          <div className="space-y-2">
            <p className="text-xs font-black uppercase tracking-[0.2em] text-slate-500">{a.chooseRole}</p>
            {roleOptions.map((option) => (
              <button
                className={`tap-scale w-full rounded-lg border p-3 text-left transition ${
                  accountKind === option.id
                    ? "border-transparent bg-gradient-to-r text-white " + option.accent
                    : "border-slate-200 bg-white text-slate-600"
                }`}
                data-testid={`registration-account-${option.id}`}
                key={option.id}
                onClick={() => setAccountKind(option.id)}
                type="button"
              >
                <span className="flex items-start justify-between gap-3">
                  <span>
                    <span className="block text-sm font-black">{option.label}</span>
                    <span className={`mt-1 block text-xs font-bold leading-5 ${accountKind === option.id ? "text-white/80" : "text-slate-500"}`}>
                      {option.description}
                    </span>
                  </span>
                  <span className={`mt-0.5 flex size-5 shrink-0 items-center justify-center rounded-lg border ${accountKind === option.id ? "border-white/60 bg-white/25" : "border-slate-300"}`}>
                    {accountKind === option.id ? <span className="size-2 rounded-sm bg-white" /> : null}
                  </span>
                </span>
              </button>
            ))}
          </div>
        ) : null}

        {recaptcha.enabled ? (
          <p className="rounded-lg bg-slate-50 px-3 py-2 text-xs font-bold leading-5 text-slate-500">{a.recaptchaNotice}</p>
        ) : null}

        <button
          className="tap-scale w-full rounded-lg bg-gradient-to-r from-crystal via-berry to-aqua px-4 py-3.5 text-sm font-black text-white disabled:opacity-60"
          disabled={
            status === "loading" ||
            (mode === "sign-up" && password.length > 0 && !validateRegistrationPassword(password).ok)
          }
          type="submit"
        >
          {status === "loading" ? (mode === "sign-in" ? a.signingIn : a.creating) : mode === "sign-in" ? a.signIn : a.createAccount}
        </button>
      </form>

      <p
        className={`rounded-lg px-4 py-3 text-sm font-bold ${
          status === "error" ? "bg-red-50 text-red-600" : status === "success" ? "bg-emerald-50 text-emerald-600" : "bg-violet-50 text-crystal"
        }`}
      >
        {message}
      </p>

      <section className="rounded-lg bg-slate-50 px-4 py-3">
        <p className="text-xs font-black uppercase tracking-[0.18em] text-slate-400">{a.nextStep}</p>
        <p className="mt-1 text-sm font-semibold leading-6 text-slate-600">
          {mode === "sign-up"
            ? accountKind === "teacher" || accountKind === "institution" || accountKind === "platform"
              ? a.teacherNext
              : a.learnerNext
            : a.signInNext}
        </p>
      </section>
    </div>
  );
}
