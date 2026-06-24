"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useMemo, useState } from "react";

import {
  REGISTRATION_ACCOUNT_OPTIONS,
  type RegistrationAccountKind,
} from "@/lib/domain/registration-account";
import { useRecaptcha } from "@/lib/hooks/use-recaptcha";
import { useMessages } from "@/lib/i18n/locale-context";

type Mode = "sign-in" | "sign-up";
type Status = "idle" | "loading" | "success" | "error";

export function AuthPanel() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const m = useMessages();
  const a = m.auth;

  const roleOptions = useMemo(() => REGISTRATION_ACCOUNT_OPTIONS, []);

  const [mode, setMode] = useState<Mode>("sign-in");
  const [accountKind, setAccountKind] = useState<RegistrationAccountKind>("student");
  const [status, setStatus] = useState<Status>("idle");
  const [message, setMessage] = useState(searchParams.get("error") ?? a.defaultMessage);
  const recaptcha = useRecaptcha(mode === "sign-up" ? "signup" : "signin");

  async function submitAuth(formData: FormData) {
    if (status === "loading") return;

    setStatus("loading");
    setMessage(mode === "sign-up" ? a.creatingAccount : a.signingYouIn);

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
    const payload =
      mode === "sign-up"
        ? {
            email: formData.get("email"),
            fullName: formData.get("fullName"),
            password: formData.get("password"),
            accountKind,
            role: selectedAccount.role,
            organizationType: selectedAccount.organizationType,
            recaptchaToken,
          }
        : {
            email: formData.get("email"),
            password: formData.get("password"),
            recaptchaToken,
          };

    let response: Response;
    let result: {
      error?: string;
      message?: string;
      needsEmailConfirmation?: boolean;
    } = {};

    try {
      response = await fetch(`/api/auth/${mode}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
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
      setMessage(result.error ?? a.authFailed);
      return;
    }

    setStatus("success");
    setMessage(mode === "sign-up" ? (result.message ?? a.accountCreated) : a.signedIn);

    router.refresh();

    if (mode === "sign-up" && result.needsEmailConfirmation) {
      setMessage(result.message ?? a.checkEmail);
      return;
    }

    const next = searchParams.get("next");
    router.push(next?.startsWith("/") ? next : mode === "sign-up" ? "/onboarding" : "/");
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

      <form action={submitAuth} className="space-y-4">
        {mode === "sign-up" ? (
          <div>
            <label className="text-xs font-black uppercase tracking-[0.2em] text-slate-500">{a.fullName}</label>
            <input
              className="zigo-input mt-2 w-full rounded-xl px-4 py-3 text-sm outline-none"
              name="fullName"
              placeholder="Zigo Kullanıcı"
              required
            />
          </div>
        ) : null}

        <div>
          <label className="text-xs font-black uppercase tracking-[0.2em] text-slate-500">{a.email}</label>
          <input
            className="zigo-input mt-2 w-full rounded-xl px-4 py-3 text-sm outline-none"
            name="email"
            placeholder="sen@ornek.com"
            required
            type="email"
          />
        </div>

        <div>
          <label className="text-xs font-black uppercase tracking-[0.2em] text-slate-500">{a.password}</label>
          <input
            className="zigo-input mt-2 w-full rounded-xl px-4 py-3 text-sm outline-none"
            minLength={8}
            name="password"
            placeholder={a.passwordHint}
            required
            type="password"
          />
        </div>

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
          disabled={status === "loading"}
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
