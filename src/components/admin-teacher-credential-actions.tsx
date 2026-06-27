"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";

type AdminTeacherCredentialActionsProps = {
  submissionId: string;
  teacherName: string;
  teacherEmail: string;
  credentialType: "diploma" | "e_devlet";
  documentUrl: string;
};

export function AdminTeacherCredentialActions({
  submissionId,
  teacherName,
  teacherEmail,
  credentialType,
  documentUrl,
}: AdminTeacherCredentialActionsProps) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");

  async function review(status: "approved" | "rejected") {
    setBusy(true);
    setMessage("");
    try {
      const response = await fetch("/api/admin/teachers/credential", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ submissionId, status }),
      });
      const payload = (await response.json().catch(() => null)) as { error?: string } | null;
      if (!response.ok) {
        setMessage(payload?.error ?? "İşlem başarısız.");
        return;
      }
      setMessage(status === "approved" ? "Onaylandı — öğretmen doğrulandı." : "Reddedildi.");
      router.refresh();
    } catch {
      setMessage("Bağlantı hatası.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="space-y-2">
      <div>
        <p className="font-black text-night">{teacherName}</p>
        <p className="text-xs font-bold text-slate-500">{teacherEmail}</p>
        <p className="mt-1 text-xs font-black text-indigo-700">
          {credentialType === "e_devlet" ? "e-Devlet belgesi" : "Diploma"}
        </p>
      </div>
      <Link className="text-xs font-black text-crystal underline" href={documentUrl} rel="noreferrer" target="_blank">
        Belgeyi aç
      </Link>
      <div className="flex gap-2">
        <button
          className="tap-scale flex-1 rounded-lg bg-indigo-600 px-3 py-2 text-xs font-black text-white disabled:opacity-60"
          disabled={busy}
          onClick={() => void review("approved")}
          type="button"
        >
          Onayla + doğrula
        </button>
        <button
          className="tap-scale flex-1 rounded-lg bg-slate-100 px-3 py-2 text-xs font-black text-slate-700 disabled:opacity-60"
          disabled={busy}
          onClick={() => void review("rejected")}
          type="button"
        >
          Reddet
        </button>
      </div>
      {message ? <p className="text-xs font-bold text-slate-600">{message}</p> : null}
    </div>
  );
}
