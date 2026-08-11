"use client";

import { useState } from "react";

import { createClient } from "@/lib/supabase/client";

export function RoleRequestActions({ requestId, status }: { requestId: string; status: string }) {
  const [loading, setLoading] = useState(false);
  const supabase = createClient();

  async function handleApprove() {
    if (!confirm("Bu kullanıcının rol değişimini onaylamak istediğinize emin misiniz?")) return;
    
    setLoading(true);
    try {
      const rpcCaller = supabase.rpc as unknown as (
        fn: string,
        args: Record<string, unknown>,
      ) => Promise<{ error: Error | null }>;
      const { error } = await rpcCaller("approve_role_change_request", {
        request_id: requestId,
      });
      if (error) throw error;
      window.location.reload();
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Bilinmeyen bir hata oluştu";
      alert("Hata: " + message);
      setLoading(false);
    }
  }

  return (
    <button
      className="rounded-lg bg-emerald-500 px-3 py-1.5 text-xs font-bold text-white transition hover:bg-emerald-600 disabled:cursor-not-allowed disabled:bg-slate-200 disabled:text-slate-400"
      disabled={loading || status === 'pending'}
      onClick={handleApprove}
      title={status === 'pending' ? "Ödeme bekleniyor" : "Onayla"}
    >
      {loading ? "Onaylanıyor..." : "Onayla"}
    </button>
  );
}
