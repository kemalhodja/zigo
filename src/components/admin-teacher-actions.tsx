"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

import { useMessages } from "@/lib/i18n/locale-context";

type AdminTeacherActionsProps = {
  teacherId: string;
  isVerified: boolean;
};

export function AdminTeacherActions({ teacherId, isVerified }: AdminTeacherActionsProps) {
  const { ops: { admin: a, common: c } } = useMessages();
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState("");

  async function toggleVerification() {
    if (isLoading) return;

    setIsLoading(true);
    setMessage("");

    try {
      const response = await fetch("/api/admin/teachers/verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          teacherId,
          verified: !isVerified,
        }),
      });

      if (!response.ok) {
        const payload = (await response.json().catch(() => null)) as { error?: string } | null;
        setMessage(payload?.error ?? a.teacherUpdateFailed);
        return;
      }

      setMessage(isVerified ? a.teacherRevoked : a.teacherVerified);
      router.refresh();
    } catch {
      setMessage(c.connectionFailed);
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <div className="w-32 space-y-1 text-right">
      <button
        aria-label={isVerified ? a.revokeVerification : a.verifyTeacher}
        className={`w-full rounded-lg px-4 py-2 text-sm font-black disabled:opacity-60 ${
          isVerified ? "bg-slate-100 text-slate-700" : "zigo-cta text-white"
        }`}
        disabled={isLoading}
        onClick={toggleVerification}
        type="button"
      >
        {isLoading ? a.updating : isVerified ? a.revoke : a.verify}
      </button>
      {message ? <p className="rounded-lg bg-slate-50 px-2 py-1 text-[0.65rem] font-bold text-slate-600">{message}</p> : null}
    </div>
  );
}
