"use client";

import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";

import {
  REGISTRATION_ACCOUNT_OPTIONS,
  type RegistrationAccountKind,
} from "@/lib/domain/registration-account";
import { useMessages } from "@/lib/i18n/locale-context";

type Status = "idle" | "saving" | "saved" | "error";

export function ProfileForm({ redirectTo }: { redirectTo?: string } = {}) {
  const m = useMessages();
  const p = m.profileForm;
  const auth = m.auth;
  const onboarding = m.onboarding;
  const router = useRouter();
  const [accountKind, setAccountKind] = useState<RegistrationAccountKind>("student");
  const [status, setStatus] = useState<Status>("idle");
  const [message, setMessage] = useState(p.chooseRole);

  const roleOptions = useMemo(() => REGISTRATION_ACCOUNT_OPTIONS, []);

  async function submitProfile(formData: FormData) {
    if (status === "saving") return;

    setStatus("saving");
    setMessage(p.creating);

    try {
      const response = await fetch("/api/profile", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          fullName: formData.get("fullName"),
          accountKind,
        }),
      });

      const payload = (await response.json().catch(() => null)) as { error?: string } | null;

      if (!response.ok) {
        setStatus("error");
        setMessage(payload?.error ?? p.createFailed);
        return;
      }

      setStatus("saved");
      setMessage(p.created);
      router.refresh();
      
      if (redirectTo) {
        setTimeout(() => {
          router.push(redirectTo);
        }, 500);
      }
    } catch {
      setStatus("error");
      setMessage(p.setupCheck);
    }
  }

  return (
    <form action={submitProfile} className="-mx-4 space-y-5 bg-white px-4 py-4">
      <div>
        <p className="text-xs font-black uppercase tracking-[0.2em] text-slate-500">{onboarding.createProfile}</p>
        <h3 className="mt-1 text-2xl font-black leading-tight text-night">{onboarding.chooseFeed}</h3>
      </div>
      <div>
        <label htmlFor="full-name" className="text-xs font-black uppercase tracking-[0.2em] text-slate-500">{auth.fullName}</label>
        <input
          id="full-name"
          className="mt-2 w-full rounded-lg border border-slate-200 px-4 py-3 text-sm outline-none transition focus:border-night focus:ring-2 focus:ring-crystal focus:ring-offset-2"
          name="fullName"
          placeholder={p.namePlaceholder}
          required
          aria-describedby={status === "error" ? "profile-message" : undefined}
          aria-invalid={status === "error"}
        />
      </div>

      <div className="space-y-2" role="radiogroup" aria-label={p.chooseRole}>
        <p className="text-xs font-black uppercase tracking-[0.2em] text-slate-500" id="role-legend">{p.chooseRole}</p>
        {roleOptions.map((option) => (
          <button
            className={`tap-scale w-full rounded-lg border p-4 text-left transition focus:outline-none focus:ring-2 focus:ring-crystal focus:ring-offset-2 ${
              accountKind === option.id
                ? "border-crystal bg-violet-50"
                : "border-slate-200 bg-white hover:border-slate-300"
            }`}
            key={option.id}
            onClick={() => setAccountKind(option.id)}
            type="button"
            role="radio"
            aria-checked={accountKind === option.id}
            aria-labelledby={`role-${option.id}`}
          >
            <div className="flex items-start justify-between gap-3">
              <div>
                <p id={`role-${option.id}`} className="font-black text-night">{option.label}</p>
                <p className="mt-1 text-sm leading-5 text-slate-600">{option.description}</p>
              </div>
              <span className={`mt-0.5 flex size-5 shrink-0 items-center justify-center rounded-lg border ${
                accountKind === option.id ? "border-crystal bg-crystal text-white" : "border-slate-300"
              }`} aria-hidden="true">
                {accountKind === option.id ? <span className="size-2 rounded-sm bg-white" /> : null}
              </span>
            </div>
          </button>
        ))}
      </div>

      <button
        className="tap-scale w-full zigo-cta tap-scale rounded-lg px-4 py-3.5 text-sm font-black text-white disabled:opacity-60 focus:outline-none focus:ring-2 focus:ring-crystal focus:ring-offset-2"
        disabled={status === "saving"}
        type="submit"
        aria-busy={status === "saving"}
      >
        {status === "saving" ? p.creating : p.createProfile}
      </button>

      <p
        id="profile-message"
        className={`rounded-lg px-4 py-3 text-sm font-bold ${
          status === "error" ? "bg-red-50 text-red-600" : "bg-slate-50 text-slate-600"
        }`}
        role="status"
        aria-live="polite"
      >
        {message}
      </p>
    </form>
  );
}
