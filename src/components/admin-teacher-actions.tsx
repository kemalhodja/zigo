"use client";

import { useState } from "react";

type AdminTeacherActionsProps = {
  teacherId: string;
  isVerified: boolean;
  onStatusChange?: () => void;
};

export function AdminTeacherActions({
  teacherId,
  isVerified,
  onStatusChange,
}: AdminTeacherActionsProps) {
  const [loading, setLoading] = useState(false);

  async function toggleVerify() {
    setLoading(true);
    try {
      const response = await fetch("/api/admin/teachers/verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId: teacherId, verified: !isVerified }),
      });
      if (response.ok) {
        onStatusChange?.();
      }
    } finally {
      setLoading(false);
    }
  }

  return (
    <button
      className="rounded-lg bg-crystal px-3 py-1.5 text-xs font-bold text-night disabled:opacity-50"
      disabled={loading}
      onClick={() => void toggleVerify()}
      type="button"
    >
      {loading ? "İşleniyor..." : isVerified ? "Doğrulamayı Kaldır" : "Öğretmeni Doğrula (Verify)"}
    </button>
  );
}
