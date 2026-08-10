"use client";

import { useState } from "react";

import { createClient } from "@/lib/supabase/client";

export function RoleRequestActions({ requestId, status }: { requestId: string, status: string }) {
  const [loading, setLoading] = useState(false);
  const supabase = createClient();

  async function handleApprove() {
    if (!confirm("Bu kullanıcının rol değişimini onaylamak istediğinize emin misiniz?")) return;
    
    setLoading(true);
    try {
      // @ts-ignore
      const { error } = await supabase.rpc("approve_role_change_request", {
        request_id: requestId,
      });
      if (error) throw error;
      window.location.reload();
    } catch (err: any) {
      alert("Hata: " + err.message);
      setLoading(false);
    }
  }

  return (
    <button
      disabled={loading || status === 'pending'}
      onClick={handleApprove}
      title={status === 'pending' ? "Ödeme bekleniyor" : "Onayla"}
      className="px-3 py-1.5 bg-emerald-500 hover:bg-emerald-600 disabled:bg-slate-200 disabled:text-slate-400 disabled:cursor-not-allowed text-white text-xs font-bold rounded-lg transition"
    >
      {loading ? "Onaylanıyor..." : "Onayla"}
    </button>
  );
}
