"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

import { useMessages } from "@/lib/i18n/locale-context";

type SignOutButtonProps = {
  className?: string;
  variant?: "default" | "icon" | "fullWidth";
};

export function SignOutButton({ className = "", variant = "default" }: SignOutButtonProps) {
  const s = useMessages().signOut;
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState("");

  async function signOut() {
    if (isLoading) return;

    setIsLoading(true);
    setMessage("");

    try {
      const response = await fetch("/api/auth/sign-out", { method: "POST" });
      if (!response.ok) {
        setMessage(s.failed);
        return;
      }

      router.refresh();
      router.push("/auth");
    } catch {
      setMessage(s.connectionFailed);
    } finally {
      setIsLoading(false);
    }
  }

  const label = isLoading ? s.signingOut : s.label;

  if (variant === "icon") {
    return (
      <div className={`relative ${className}`}>
        <button
          aria-label={s.label}
          className="tap-scale flex size-9 items-center justify-center text-night transition hover:text-rose-600 disabled:opacity-60"
          disabled={isLoading}
          onClick={signOut}
          type="button"
        >
          <svg aria-hidden="true" className="size-6" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
            <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
            <path d="M16 17l5-5-5-5" />
            <path d="M21 12H9" />
          </svg>
        </button>
        {message ? (
          <p className="absolute right-0 top-full z-20 mt-1 w-40 rounded-lg bg-rose-50 px-2 py-1 text-right text-[0.65rem] font-bold text-rose-700">
            {message}
          </p>
        ) : null}
      </div>
    );
  }

  const buttonClass =
    variant === "fullWidth"
      ? "tap-scale w-full rounded-lg border border-slate-200 bg-white px-4 py-3 text-center text-sm font-black text-slate-700 disabled:opacity-60"
      : "rounded-lg bg-slate-100 px-4 py-3 text-sm font-black text-slate-600 disabled:opacity-60";

  return (
    <div className={`space-y-1 ${variant === "fullWidth" ? "w-full" : "text-right"} ${className}`}>
      <button className={buttonClass} disabled={isLoading} onClick={signOut} type="button">
        {label}
      </button>
      {message ? <p className="text-xs font-bold text-red-600">{message}</p> : null}
    </div>
  );
}
