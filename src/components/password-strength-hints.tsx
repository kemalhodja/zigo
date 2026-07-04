"use client";

import { useMemo } from "react";

import { isCommonPassword } from "@/lib/domain/password-policy";
import { useLocale, useMessages } from "@/lib/i18n/locale-context";

export function PasswordStrengthHints({ password }: { password: string }) {
  const auth = useMessages().auth;
  const locale = useLocale();
  const copy =
    locale === "en"
      ? {
          title: "Password tips",
          unique: "Avoid common passwords",
          ready: "Password looks good",
        }
      : {
          title: "Şifre ipuçları",
          unique: "Yaygın şifrelerden kaçın",
          ready: "Şifre uygun görünüyor",
        };

  const checks = useMemo(
    () => [
      { ok: password.length >= 8, label: auth.passwordHint },
      { ok: password.length >= 8 && !isCommonPassword(password), label: copy.unique },
    ],
    [auth.passwordHint, copy.unique, password],
  );

  const allOk = checks.every((check) => check.ok);

  return (
    <div className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2" data-testid="password-strength-hints">
      <p className="text-xs font-black uppercase tracking-[0.12em] text-slate-500">{copy.title}</p>
      <ul className="mt-2 space-y-1">
        {checks.map((check) => (
          <li className={`text-xs font-semibold ${check.ok ? "text-emerald-700" : "text-slate-500"}`} key={check.label}>
            {check.ok ? "✓" : "•"} {check.label}
          </li>
        ))}
      </ul>
      {allOk ? <p className="mt-2 text-xs font-bold text-emerald-700">{copy.ready}</p> : null}
    </div>
  );
}
