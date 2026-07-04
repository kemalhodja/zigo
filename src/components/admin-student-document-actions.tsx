"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";

import { useMessages } from "@/lib/i18n/locale-context";

type AdminStudentDocumentActionsProps = {
  studentId: string;
  documentUrl: string | null;
  fullName: string;
  gradeLevel: string | null;
};

export function AdminStudentDocumentActions({
  studentId,
  documentUrl,
  fullName,
  gradeLevel,
}: AdminStudentDocumentActionsProps) {
  const {
    ops: { admin: a, common: c },
  } = useMessages();
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState("");

  async function review(status: "approved" | "rejected") {
    if (isLoading) return;

    setIsLoading(true);
    setMessage("");

    try {
      const response = await fetch("/api/admin/students/document", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ studentId, status }),
      });
      const payload = (await response.json().catch(() => null)) as { error?: string } | null;

      if (!response.ok) {
        setMessage(payload?.error ?? a.studentDocReviewFailed);
        return;
      }

      setMessage(status === "approved" ? a.studentDocApproved : a.studentDocRejected);
      router.refresh();
    } catch {
      setMessage(c.connectionFailed);
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <div className="space-y-2">
      <div>
        <p className="font-black text-night">{fullName}</p>
        {gradeLevel ? (
          <p className="text-xs font-bold text-crystal">{gradeLevel}</p>
        ) : (
          <p className="text-xs font-bold text-slate-400">{a.studentDocNoGrade}</p>
        )}
      </div>

      {documentUrl ? (
        <Link
          className="inline-block text-xs font-black text-crystal underline"
          href={documentUrl}
          rel="noreferrer"
          target="_blank"
        >
          {a.studentDocOpen}
        </Link>
      ) : null}

      <div className="flex gap-2">
        <button
          className="tap-scale zigo-cta flex-1 rounded-lg px-3 py-2 text-xs font-black text-white disabled:opacity-60"
          disabled={isLoading}
          onClick={() => review("approved")}
          type="button"
        >
          {isLoading ? a.updating : a.studentDocApprove}
        </button>
        <button
          className="tap-scale flex-1 rounded-lg bg-slate-100 px-3 py-2 text-xs font-black text-slate-700 disabled:opacity-60"
          disabled={isLoading}
          onClick={() => review("rejected")}
          type="button"
        >
          {a.studentDocReject}
        </button>
      </div>

      {message ? <p className="rounded-lg bg-slate-50 px-2 py-1 text-[0.65rem] font-bold text-slate-600">{message}</p> : null}
    </div>
  );
}
