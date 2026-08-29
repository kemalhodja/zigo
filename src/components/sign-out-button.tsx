"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

import { useMessages } from "@/lib/i18n/locale-context";

export function SignOutButton({
  className = "rounded-lg bg-slate-100 px-4 py-3 text-sm font-black text-slate-600",
}: {
  className?: string;
} = {}) {
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

      // Redirect directly via window.location to force a hard reload
      // and ensure middleware re-evaluates the cleared session cookies
      window.location.href = "/auth";
    } catch {
      setMessage(s.connectionFailed);
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <div className="inline-block w-full">
      <button
        className={`w-full text-center transition tap-scale ${className} disabled:opacity-60`}
        disabled={isLoading}
        onClick={signOut}
        type="button"
      >
        {isLoading ? s.signingOut : s.label}
      </button>
      {message ? <p className="mt-1 text-center text-xs font-bold text-red-600">{message}</p> : null}
    </div>
  );
}
