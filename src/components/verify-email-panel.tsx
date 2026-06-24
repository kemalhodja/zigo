"use client";

import { useState } from "react";

import { useMessages } from "@/lib/i18n/locale-context";

type Status = "idle" | "loading" | "success" | "error";

export function VerifyEmailPanel() {
  const m = useMessages();
  const a = m.auth;
  const [status, setStatus] = useState<Status>("idle");
  const [message, setMessage] = useState(a.verifyEmailDesc);

  async function resendVerification(formData: FormData) {
    if (status === "loading") return;

    setStatus("loading");
    setMessage(a.sendingVerification);

    const email = String(formData.get("email") ?? "").trim();

    try {
      const response = await fetch("/api/auth/resend-verification", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      const result = (await response.json()) as { error?: string; message?: string };

      if (!response.ok) {
        setStatus("error");
        setMessage(result.error ?? a.resendFailed);
        return;
      }

      setStatus("success");
      setMessage(result.message ?? a.resendSuccess);
    } catch {
      setStatus("error");
      setMessage(a.connectionFailed);
    }
  }

  return (
    <div className="-mx-4 space-y-4 bg-white px-4 pb-4">
      <p className="rounded-lg bg-violet-50 px-4 py-3 text-sm font-bold leading-6 text-crystal">{a.verifyEmailDesc}</p>

      <form action={resendVerification} className="space-y-4">
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

        <button
          className="tap-scale w-full rounded-lg bg-gradient-to-r from-crystal via-berry to-aqua px-4 py-3.5 text-sm font-black text-white disabled:opacity-60"
          disabled={status === "loading"}
          type="submit"
        >
          {status === "loading" ? a.sendingVerification : a.resendVerification}
        </button>
      </form>

      <p
        className={`rounded-lg px-4 py-3 text-sm font-bold ${
          status === "error" ? "bg-red-50 text-red-600" : status === "success" ? "bg-emerald-50 text-emerald-600" : "bg-slate-50 text-slate-600"
        }`}
      >
        {message}
      </p>
    </div>
  );
}
