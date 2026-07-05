"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

import {
  REGISTRATION_ACCOUNT_OPTIONS,
  type RegistrationAccountKind,
} from "@/lib/domain/registration-account";
import { useMessages } from "@/lib/i18n/locale-context";

export function RoleSelectionPanel() {
  const router = useRouter();
  const m = useMessages();
  const rs = m.roleSelection;
  const [accountKind, setAccountKind] = useState<RegistrationAccountKind>("student");
  const [status, setStatus] = useState<"idle" | "loading" | "error">("idle");
  const [message, setMessage] = useState("");

  async function submit() {
    setStatus("loading");
    setMessage("");

    const selected = REGISTRATION_ACCOUNT_OPTIONS.find((option) => option.id === accountKind)!;

    try {
      const response = await fetch("/api/profile/role", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          accountKind: selected.id,
          role: selected.role,
          organizationType: selected.organizationType,
        }),
      });
      const payload = (await response.json()) as { error?: string };

      if (!response.ok) {
        throw new Error(payload.error ?? rs.failed);
      }

      router.push("/onboarding");
      router.refresh();
    } catch (error) {
      setStatus("error");
      setMessage(error instanceof Error ? error.message : rs.failed);
    } finally {
      setStatus((current) => (current === "loading" ? "idle" : current));
    }
  }

  return (
    <div className="space-y-4">
      <p className="text-xs font-black uppercase tracking-[0.2em] text-slate-500">{rs.eyebrow}</p>
      <h2 className="text-2xl font-black text-night">{rs.title}</h2>
      <p className="text-sm leading-6 text-slate-500">{rs.desc}</p>
      <p className="rounded-lg bg-violet-50 px-3 py-2 text-xs font-bold leading-5 text-crystal">{rs.trialNote}</p>

      <div className="space-y-2">
        {REGISTRATION_ACCOUNT_OPTIONS.map((option) => (
          <button
            className={`tap-scale w-full rounded-lg border p-3 text-left transition ${
              accountKind === option.id
                ? `border-transparent bg-gradient-to-r text-white ${option.accent}`
                : "border-slate-200 bg-white text-slate-600"
            }`}
            data-testid={`role-onboarding-pick-${option.id}`}
            key={option.id}
            onClick={() => setAccountKind(option.id)}
            type="button"
          >
            <span className="block text-sm font-black">{option.label}</span>
            <span className={`mt-1 block text-xs font-bold leading-5 ${accountKind === option.id ? "text-white/80" : "text-slate-500"}`}>
              {option.description}
            </span>
          </button>
        ))}
      </div>

      {message ? <p className="text-sm font-bold text-rose-600">{message}</p> : null}

      <button
        className="tap-scale w-full rounded-lg bg-gradient-to-r from-crystal via-berry to-aqua px-4 py-3.5 text-sm font-black text-white disabled:opacity-60"
        data-testid="role-onboarding-continue"
        disabled={status === "loading"}
        onClick={() => void submit()}
        type="button"
      >
        {status === "loading" ? rs.saving : rs.continue}
      </button>
    </div>
  );
}
