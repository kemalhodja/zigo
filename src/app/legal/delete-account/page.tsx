"use client";

import { useState } from "react";

import { LegalLayout } from "@/components/legal-layout";
import { useMessages } from "@/lib/i18n/locale-context";

export default function DeleteAccountPage() {
  const l = useMessages().legalPage;
  const [reason, setReason] = useState("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);

  async function exportData() {
    setLoading(true);
    setMessage("");
    try {
      const response = await fetch("/api/account/export");
      const payload = (await response.json().catch(() => null)) as { data?: unknown; error?: string } | null;
      if (!response.ok || !payload?.data) {
        setMessage(payload?.error ?? l.exportFailed);
        return;
      }
      const blob = new Blob([JSON.stringify(payload.data, null, 2)], { type: "application/json" });
      const url = URL.createObjectURL(blob);
      const anchor = document.createElement("a");
      anchor.href = url;
      anchor.download = "zigo-data-export.json";
      anchor.click();
      URL.revokeObjectURL(url);
      setMessage(l.exportDownloaded);
    } catch {
      setMessage(l.connectionFailed);
    } finally {
      setLoading(false);
    }
  }

  async function requestDeletion() {
    setLoading(true);
    setMessage("");
    try {
      const response = await fetch("/api/account/delete-request", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ reason }),
      });
      const payload = (await response.json().catch(() => null)) as { error?: string } | null;
      if (!response.ok) {
        setMessage(payload?.error ?? l.requestFailed);
        return;
      }
      setMessage(l.deletionRecorded);
    } catch {
      setMessage(l.connectionFailed);
    } finally {
      setLoading(false);
    }
  }

  return (
    <LegalLayout title={l.deleteAccount}>
      <p>{l.deleteIntro}</p>
      <div className="space-y-3 pt-2">
        <button
          className="zigo-cta w-full rounded-lg px-4 py-3 text-sm font-black text-white disabled:opacity-60"
          disabled={loading}
          onClick={() => void exportData()}
          type="button"
        >
          {l.downloadData}
        </button>
        <textarea
          className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
          onChange={(event) => setReason(event.target.value)}
          placeholder={l.deleteReason}
          value={reason}
        />
        <button
          className="w-full rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm font-black text-red-700 disabled:opacity-60"
          disabled={loading}
          onClick={() => void requestDeletion()}
          type="button"
        >
          {l.requestDeletion}
        </button>
        {message ? <p className="text-sm font-bold text-slate-600">{message}</p> : null}
      </div>
    </LegalLayout>
  );
}
