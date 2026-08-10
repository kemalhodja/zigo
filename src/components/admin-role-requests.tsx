"use client";

import { AlertCircle, Check, Clock, RefreshCw } from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "react-hot-toast";

import { createClient } from "@/lib/supabase/client";

type RoleRequest = {
  id: string;
  user_id: string;
  old_role: string;
  requested_role: string;
  requested_organization_type: string | null;
  fee_amount: number;
  status: "pending" | "paid" | "approved" | "rejected";
  created_at: string;
  users: {
    full_name: string;
    email: string;
  };
};

export function AdminRoleRequests() {
  const [requests, setRequests] = useState<RoleRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const supabase = createClient();

  const fetchRequests = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("role_change_requests")
      .select("*, users(full_name, email)")
      .order("created_at", { ascending: false })
      .limit(20);

    if (error) {
      toast.error("Rol istekleri yüklenirken hata oluştu");
    } else {
      setRequests((data as any[]) || []);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchRequests();
  }, []);

  const handleApprove = async (id: string) => {
    setActionLoading(id);
    try {
      // @ts-ignore - The RPC exists in the migration but types are not updated yet
      const { error } = await supabase.rpc("approve_role_change_request", { request_id: id });
      if (error) throw error;
      toast.success("Rol yükseltme işlemi onaylandı!");
      await fetchRequests();
    } catch (err: any) {
      toast.error(err.message || "Onaylanırken hata oluştu.");
    } finally {
      setActionLoading(null);
    }
  };

  if (loading) {
    return (
      <div className="flex h-32 items-center justify-center">
        <RefreshCw className="h-6 w-6 animate-spin text-slate-400" />
      </div>
    );
  }

  if (requests.length === 0) {
    return (
      <div className="rounded-2xl border-2 border-dashed border-slate-200 bg-slate-50 p-6 text-center">
        <AlertCircle className="mx-auto h-8 w-8 text-slate-400" />
        <p className="mt-2 text-sm font-bold text-slate-500">Bekleyen rol yükseltme talebi yok.</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {requests.map((req) => (
        <div key={req.id} className="flex flex-col gap-4 rounded-xl border border-slate-100 bg-white p-4 shadow-sm sm:flex-row sm:items-center sm:justify-between">
          <div>
            <div className="flex items-center gap-2">
              <span className="font-black text-night">{req.users?.full_name}</span>
              <span className="text-xs text-slate-500">({req.users?.email})</span>
            </div>
            <div className="mt-1 flex items-center gap-2 text-sm">
              <span className="rounded bg-slate-100 px-2 py-0.5 font-bold text-slate-600">
                {req.old_role}
              </span>
              <span className="text-slate-400">→</span>
              <span className="rounded bg-violet-100 px-2 py-0.5 font-bold text-violet-700">
                {req.requested_role} {req.requested_organization_type ? `(${req.requested_organization_type})` : ""}
              </span>
            </div>
            <p className="mt-2 text-xs font-bold text-slate-400">
              Ücret: {req.fee_amount} TL • Durum: {req.status.toUpperCase()}
            </p>
          </div>
          
          <div className="flex items-center justify-end">
            {(req.status === "pending" || req.status === "paid") && (
              <button
                disabled={actionLoading === req.id}
                onClick={() => handleApprove(req.id)}
                className="flex items-center gap-2 rounded-lg bg-emerald-500 px-4 py-2 text-sm font-black text-white hover:bg-emerald-600 disabled:opacity-50"
              >
                {actionLoading === req.id ? (
                  <RefreshCw className="h-4 w-4 animate-spin" />
                ) : (
                  <Check className="h-4 w-4" />
                )}
                Onayla
              </button>
            )}
            {req.status === "approved" && (
              <span className="flex items-center gap-1 text-sm font-bold text-emerald-600">
                <Check className="h-4 w-4" /> Onaylandı
              </span>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}
