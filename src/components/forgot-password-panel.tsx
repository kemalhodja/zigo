"use client";

import Link from "next/link";
import { useRef, useState } from "react";

import { useMessages } from "@/lib/i18n/locale-context";

type Status = "idle" | "loading" | "success" | "error";

export function ForgotPasswordPanel() {
  const m = useMessages();
  const a = m.auth;
  const submittingRef = useRef(false);
  const [status, setStatus] = useState<Status>("idle");
  const [message, setMessage] = useState(a.forgotPasswordDesc);

  async function submitForgotPassword(formData: FormData) {
    if (submittingRef.current || status === "loading") return;

    submittingRef.current = true;
    setStatus("loading");
    setMessage(a.sendingResetEmail);

    const email = String(formData.get("email") ?? "").trim();

    try {
      const response = await fetch("/api/auth/forgot-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      const result = (await response.json()) as {
        error?: string;
        message?: string;
        code?: string;
        retryAfterSeconds?: number;
      };

      if (!response.ok) {
        setStatus("error");
        if (result.code === "RATE_LIMITED" && result.retryAfterSeconds) {
          const minutes = Math.max(1, Math.ceil(result.retryAfterSeconds / 60));
          setMessage(`${result.error ?? a.forgotPasswordFailed} (${minutes} dk sonra tekrar dene)`);
        } else if (result.code === "ACCOUNT_NOT_FOUND") {
          setMessage(result.error ?? a.forgotPasswordAccountNotFound);
        } else {
          setMessage(result.error ?? a.forgotPasswordFailed);
        }
        return;
      }

      setStatus("success");
      setMessage(result.message ?? a.forgotPasswordSuccess);
    } catch {
      setStatus("error");
      setMessage(a.connectionFailed);
    } finally {
      submittingRef.current = false;
    }
  }

  return (
    <div className="-mx-4 space-y-4 bg-white px-4 pb-4">
      <p className="rounded-lg bg-violet-50 px-4 py-3 text-sm font-bold leading-6 text-crystal">{a.forgotPasswordDesc}</p>

      <form action={submitForgotPassword} className="space-y-4">
        <div>
          <label className="text-xs font-black uppercase tracking-[0.2em] text-slate-500">{a.email}</label>
          <input
            autoComplete="email"
            className="zigo-input mt-2 w-full rounded-xl px-4 py-3 text-sm outline-none"
            name="email"
            placeholder="sen@ornek.com"
            required
            type="email"
          />
        </div>

        <button
          className="tap-scale w-full rounded-lg bg-gradient-to-r from-crystal via-berry to-aqua px-4 py-3.5 text-sm font-black text-white disabled:opacity-60"
          disabled={status === "loading"}
          type="submit"
        >
          {status === "loading" ? a.sendingResetEmail : a.sendResetLink}
        </button>
      </form>

      <p
        className={`rounded-lg px-4 py-3 text-sm font-bold ${
          status === "error" ? "bg-red-50 text-red-600" : status === "success" ? "bg-emerald-50 text-emerald-600" : "bg-slate-50 text-slate-600"
        }`}
      >
        {message}
      </p>

      <Link className="inline-block text-sm font-black text-crystal" href="/auth">
        {a.backToAuth}
      </Link>
    </div>
  );
}
