"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

import { useMessages } from "@/lib/i18n/locale-context";
import { AdminMessageDialog } from "./admin-message-dialog";
import type { AccountStatus } from "@/lib/supabase/database.types";

type AdminUserActionsProps = {
  userId: string;
  userName: string;
  isVerified: boolean;
  accountStatus: AccountStatus;
};

export function AdminUserActions({ userId, userName, isVerified, accountStatus }: AdminUserActionsProps) {
  const { ops: { admin: a, common: c } } = useMessages();
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [showMessageDialog, setShowMessageDialog] = useState(false);

  async function toggleVerification() {
    if (isLoading) return;
    setIsLoading(true);
    setMessage("");

    try {
      const response = await fetch("/api/admin/users/verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId, verified: !isVerified }),
      });

      if (!response.ok) {
        const payload = (await response.json().catch(() => null)) as { error?: string } | null;
        setMessage(payload?.error ?? "Doğrulama başarısız.");
        return;
      }

      setMessage(isVerified ? "İptal Edildi" : "Onaylandı");
      router.refresh();
    } catch {
      setMessage(c.connectionFailed);
    } finally {
      setIsLoading(false);
    }
  }

  async function updateStatus(newStatus: AccountStatus) {
    if (isLoading || newStatus === accountStatus) return;
    setIsLoading(true);
    setMessage("");

    try {
      const response = await fetch("/api/admin/users/status", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId, status: newStatus }),
      });

      if (!response.ok) {
        const payload = (await response.json().catch(() => null)) as { error?: string } | null;
        setMessage(payload?.error ?? "Durum güncellenemedi.");
        return;
      }

      setMessage("Durum Güncellendi");
      router.refresh();
    } catch {
      setMessage(c.connectionFailed);
    } finally {
      setIsLoading(false);
    }
  }

  const btnText = isLoading ? a.updating : isVerified ? "İptal Et" : a.verify;
  const ariaLabel = isVerified ? a.revokeVerification : a.verifyTeacher;

  return (
    <div className="flex flex-col items-end gap-2 text-right">
      <div className="flex flex-col gap-1.5 w-40">
        <button
          aria-label={ariaLabel}
          className={`w-full rounded-lg px-3 py-1.5 text-xs font-black transition disabled:opacity-60 ${
            isVerified ? "bg-slate-100 text-slate-700 hover:bg-slate-200" : "zigo-cta text-white"
          }`}
          disabled={isLoading}
          onClick={toggleVerification}
          type="button"
        >
          {btnText}
        </button>
        
        <select
          value={accountStatus || "active"}
          onChange={(e) => updateStatus(e.target.value as AccountStatus)}
          disabled={isLoading}
          className="w-full rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-bold text-slate-700 focus:border-crystal focus:outline-none focus:ring-1 focus:ring-crystal"
        >
          <option value="active">🟢 Aktif</option>
          <option value="limited">🟡 Sınırlandırıldı</option>
          <option value="suspended">🟠 Askıya Alındı</option>
          <option value="closed">🔴 Kapatıldı</option>
        </select>

        <button
          onClick={() => setShowMessageDialog(true)}
          disabled={isLoading}
          type="button"
          className="w-full rounded-lg border border-crystal/30 bg-violet-50 px-3 py-1.5 text-xs font-black text-crystal transition hover:bg-violet-100 disabled:opacity-60"
        >
          ✉️ Mesaj At
        </button>
      </div>

      {message ? <p className="rounded-lg bg-slate-50 px-2 py-1 text-[0.65rem] font-bold text-slate-600">{message}</p> : null}

      {showMessageDialog && (
        <AdminMessageDialog
          userId={userId}
          userName={userName}
          onClose={() => setShowMessageDialog(false)}
        />
      )}
    </div>
  );
}
