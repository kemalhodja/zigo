"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useState } from "react";

import { useMessages } from "@/lib/i18n/locale-context";

const DEMO_PASSWORD = "ZigoTest123!";

const demoAccounts = [
  { email: "student@zigo.test", role: "student" as const, accent: "from-crystal to-fuchsia-500" },
  { email: "parent@zigo.test", role: "parent" as const, accent: "from-aqua to-mint" },
  { email: "aylin.teacher@zigo.test", role: "teacher" as const, accent: "from-sun to-peach" },
] as const;

type DemoLoginPanelProps = {
  enabled?: boolean;
};

export function DemoLoginPanel({ enabled = true }: DemoLoginPanelProps) {
  const m = useMessages();
  const d = m.demoPanel;
  const r = m.roles;
  const a = m.actions;
  const router = useRouter();
  const searchParams = useSearchParams();
  const [loadingEmail, setLoadingEmail] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  const labels = { student: r.student, parent: r.parent, teacher: r.teacher };

  if (!enabled) return null;

  async function signInAs(email: string) {
    if (loadingEmail) return;

    setLoadingEmail(email);
    setMessage(null);

    try {
      const response = await fetch("/api/auth/sign-in", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password: DEMO_PASSWORD, rememberMe: true }),
      });
      const result = (await response.json()) as { error?: string };

      if (!response.ok) {
        setMessage(result.error ?? a.demoSignInFailed);
        setLoadingEmail(null);
        return;
      }

      const next = searchParams.get("next");
      router.refresh();
      router.push(next?.startsWith("/") ? next : "/");
    } catch {
      setMessage(a.devServerCheck);
      setLoadingEmail(null);
    }
  }

  return (
    <section className="-mx-4 border-y border-violet-100 bg-gradient-to-br from-violet-50 via-white to-pink-50 px-4 py-4" data-testid="demo-login-panel">
      <p className="text-xs font-black uppercase tracking-[0.18em] text-crystal">{d.label}</p>
      <p className="mt-1 text-sm font-bold leading-5 text-slate-500">
        {d.hint}{" "}
        <code className="rounded bg-white px-1.5 py-0.5 text-xs font-black text-night">{DEMO_PASSWORD}</code>
      </p>
      <div className="mt-3 grid grid-cols-2 gap-2">
        {demoAccounts.map((account) => (
          <button
            className={`tap-scale rounded-xl bg-gradient-to-r px-3 py-3 text-left text-white shadow-sm disabled:opacity-60 ${account.accent}`}
            data-testid={`demo-login-${account.role}`}
            disabled={loadingEmail !== null}
            key={account.email}
            onClick={() => signInAs(account.email)}
            type="button"
          >
            <span className="block text-sm font-black">{labels[account.role]}</span>
            <span className="mt-0.5 block zigo-fit-text text-[0.65rem] font-bold leading-tight text-white/80">{account.email}</span>
          </button>
        ))}
      </div>
      {message ? <p className="mt-3 rounded-lg bg-red-50 px-3 py-2 text-xs font-bold text-red-600">{message}</p> : null}
    </section>
  );
}
