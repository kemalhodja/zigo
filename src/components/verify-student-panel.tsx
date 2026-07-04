"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

import { useMessages } from "@/lib/i18n/locale-context";
import type { StudentDocumentStatus } from "@/lib/supabase/database.types";

type Status = "idle" | "loading" | "success" | "error";

type VerifyStudentPanelProps = {
  documentStatus: StudentDocumentStatus | null;
  documentUrl: string | null;
};

export function VerifyStudentPanel({ documentStatus, documentUrl }: VerifyStudentPanelProps) {
  const router = useRouter();
  const m = useMessages();
  const a = m.auth;
  const [status, setStatus] = useState<Status>("idle");
  const [message, setMessage] = useState(getInitialMessage(documentStatus, a));

  async function submitDocument(formData: FormData) {
    if (status === "loading") return;

    setStatus("loading");
    setMessage(a.submittingDocument);

    const documentUrlValue = String(formData.get("documentUrl") ?? "").trim();

    try {
      const response = await fetch("/api/profile/student-document", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ documentUrl: documentUrlValue }),
      });
      const result = (await response.json()) as { error?: string };

      if (!response.ok) {
        setStatus("error");
        setMessage(result.error ?? a.documentSubmitFailed);
        return;
      }

      setStatus("success");
      setMessage(a.documentSubmitted);
      router.refresh();
    } catch {
      setStatus("error");
      setMessage(a.connectionFailed);
    }
  }

  const showForm = documentStatus !== "pending";

  return (
    <div className="-mx-4 space-y-4 bg-white px-4 pb-4">
      <p className="rounded-lg bg-violet-50 px-4 py-3 text-sm font-bold leading-6 text-crystal">{a.verifyStudentDesc}</p>

      {documentStatus === "pending" ? (
        <div className="rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm font-bold leading-6 text-amber-700">
          <p>{a.documentPending}</p>
          {documentUrl ? <p className="mt-2 break-all text-xs font-semibold text-amber-600">{documentUrl}</p> : null}
        </div>
      ) : null}

      {documentStatus === "rejected" ? (
        <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm font-bold leading-6 text-red-600">
          {a.documentRejected}
        </div>
      ) : null}

      {showForm ? (
        <form action={submitDocument} className="space-y-4">
          <div>
            <label className="text-xs font-black uppercase tracking-[0.2em] text-slate-500">{a.documentUrl}</label>
            <input
              className="zigo-input mt-2 w-full rounded-xl px-4 py-3 text-sm outline-none"
              defaultValue={documentUrl ?? ""}
              name="documentUrl"
              placeholder="https://..."
              required
              type="url"
            />
          </div>

          <button
            className="tap-scale w-full rounded-lg bg-gradient-to-r from-crystal via-berry to-aqua px-4 py-3.5 text-sm font-black text-white disabled:opacity-60"
            disabled={status === "loading"}
            type="submit"
          >
            {status === "loading" ? a.submittingDocument : a.submitDocument}
          </button>
        </form>
      ) : null}

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

function getInitialMessage(
  documentStatus: StudentDocumentStatus | null,
  a: {
    verifyStudentDesc: string;
    documentPending: string;
    documentRejected: string;
  },
) {
  if (documentStatus === "pending") return a.documentPending;
  if (documentStatus === "rejected") return a.documentRejected;
  return a.verifyStudentDesc;
}
