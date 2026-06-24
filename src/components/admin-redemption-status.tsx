"use client";

import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";

import { useMessages } from "@/lib/i18n/locale-context";
import type { StoreRedemptionStatus } from "@/lib/supabase/database.types";

type AdminRedemptionStatusProps = {
  redemptionId: string;
  status: StoreRedemptionStatus;
};

const options: StoreRedemptionStatus[] = [
  "pending_parent_approval",
  "approved",
  "fulfilled",
  "cancelled",
];

export function AdminRedemptionStatus({ redemptionId, status }: AdminRedemptionStatusProps) {
  const { ops: { admin: a, common: c } } = useMessages();
  const optionLabels = useMemo(
    () => ({
      approved: a.redemptionApproved,
      cancelled: a.redemptionCancelled,
      fulfilled: a.redemptionFulfilled,
      pending_parent_approval: a.redemptionPendingParent,
    }),
    [a],
  );
  const router = useRouter();
  const [value, setValue] = useState<StoreRedemptionStatus>(status);
  const [isSaving, setIsSaving] = useState(false);
  const [message, setMessage] = useState("");

  async function updateStatus(nextStatus: StoreRedemptionStatus) {
    if (isSaving) return;

    const previousStatus = value;
    setValue(nextStatus);
    setIsSaving(true);
    setMessage("");

    try {
      const response = await fetch("/api/admin/store/redemptions/status", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          redemptionId,
          status: nextStatus,
        }),
      });

      if (!response.ok) {
        const payload = (await response.json().catch(() => null)) as { error?: string } | null;
        setValue(previousStatus);
        setMessage(payload?.error ?? a.statusUpdateFailed);
        return;
      }

      setMessage(c.saved);
      router.refresh();
    } catch {
      setValue(previousStatus);
      setMessage(c.connectionFailed);
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <div className="space-y-1">
      <select
        className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs font-bold text-slate-700 outline-none focus:border-crystal disabled:opacity-60"
        disabled={isSaving}
        onChange={(event) => updateStatus(event.target.value as StoreRedemptionStatus)}
        value={value}
      >
        {options.map((option) => (
          <option key={option} value={option}>
            {optionLabels[option]}
          </option>
        ))}
      </select>
      {message ? <p className="rounded-lg bg-slate-50 px-2 py-1 text-[0.65rem] font-bold text-slate-600">{message}</p> : null}
    </div>
  );
}
