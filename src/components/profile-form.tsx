"use client";

import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";

import {
  REGISTRATION_ACCOUNT_OPTIONS,
  type RegistrationAccountKind,
} from "@/lib/domain/registration-account";
import { useMessages } from "@/lib/i18n/locale-context";

type Status = "idle" | "saving" | "saved" | "error";

export function ProfileForm() {
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
        <label className="text-xs font-black uppercase tracking-[0.2em] text-slate-500">{auth.fullName}</label>
        <input
          className="mt-2 w-full rounded-lg border border-slate-200 px-4 py-3 text-sm outline-none transition focus:border-night"
          name="fullName"
          placeholder={p.namePlaceholder}
          required
        />
      </div>

      <div className="space-y-2">
        <p className="text-xs font-black uppercase tracking-[0.2em] text-slate-500">{p.chooseRole}</p>
        {roleOptions.map((option) => (
          <button
            className={`tap-scale w-full rounded-lg border p-4 text-left transition ${
              accountKind === option.id
                ? "border-crystal bg-violet-50"
                : "border-slate-200 bg-white hover:border-slate-300"
            }`}
            key={option.id}
            onClick={() => setAccountKind(option.id)}
            type="button"
          >
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="font-black text-night">{option.label}</p>
                <p className="mt-1 text-sm leading-5 text-slate-600">{option.description}</p>
              </div>
              <span className={`mt-0.5 flex size-5 shrink-0 items-center justify-center rounded-lg border ${
                accountKind === option.id ? "border-crystal bg-crystal text-white" : "border-slate-300"
              }`}>
                {accountKind === option.id ? <span className="size-2 rounded-sm bg-white" /> : null}
              </span>
            </div>
          </button>
        ))}
      </div>

      <button
        className="tap-scale w-full zigo-cta tap-scale rounded-lg px-4 py-3.5 text-sm font-black text-white disabled:opacity-60"
        disabled={status === "saving"}
        type="submit"
      >
        {status === "saving" ? p.creating : p.createProfile}
      </button>

      <p
        className={`rounded-lg px-4 py-3 text-sm font-bold ${
          status === "error" ? "bg-red-50 text-red-600" : "bg-slate-50 text-slate-600"
        }`}
      >
        {message}
      </p>
    </form>
  );
}
