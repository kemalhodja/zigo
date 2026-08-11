import { redirect } from "next/navigation";

import { getCurrentProfile } from "@/lib/domain/profiles";
import { createClient } from "@/lib/supabase/server";

import { RoleRequestActions } from "./actions";

type RoleRequestItem = {
  id: string;
  old_role: string;
  requested_role: string;
  requested_organization_type: string | null;
  fee_amount: number;
  status: string;
  users?: { full_name?: string; email?: string } | null;
};

export default async function RoleRequestsPage() {
  const supabase = await createClient();
  const profile = await getCurrentProfile(supabase);

  if (!profile) {
    redirect("/auth");
  }

  const { data: adminData } = await supabase.from("platform_admins").select("user_id").eq("user_id", profile.id).single();
  
  if (!adminData) {
    redirect("/");
  }

  const { data: rawRequests, error } = await (supabase as unknown as {
    from: (table: string) => {
      select: (query: string) => {
        order: (column: string, opts: { ascending: boolean }) => Promise<{ data: RoleRequestItem[] | null; error: Error | null }>;
      };
    };
  })
    .from("role_change_requests")
    .select("*, users!inner(full_name, email)")
    .order("created_at", { ascending: false });

  const requests = rawRequests ?? [];

  if (error) {
    return <div className="p-8 text-rose-500">Kayıtlar alınırken hata oluştu: {error.message}</div>;
  }

  return (
    <div className="mx-auto max-w-6xl p-8">
      <h1 className="mb-8 text-2xl font-black text-night">Rol Değiştirme Talepleri (Onay Bekleyenler)</h1>
      
      <div className="overflow-hidden rounded-2xl border border-slate-100 bg-white shadow-sm">
        <table className="w-full text-left">
          <thead className="border-b border-slate-100 bg-slate-50 text-sm font-bold text-slate-500">
            <tr>
              <th className="px-6 py-4">Kullanıcı</th>
              <th className="px-6 py-4">Eski Rol</th>
              <th className="px-6 py-4">Yeni Rol</th>
              <th className="px-6 py-4">Kurum Türü</th>
              <th className="px-6 py-4">Ücret / Durum</th>
              <th className="px-6 py-4 text-right">İşlem</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 text-sm">
            {requests.map((req) => (
              <tr className="transition hover:bg-slate-50" key={req.id}>
                <td className="px-6 py-4">
                  <div className="font-bold text-night">{req.users?.full_name}</div>
                  <div className="text-xs text-slate-500">{req.users?.email}</div>
                </td>
                <td className="px-6 py-4">
                  <span className="inline-flex rounded bg-slate-100 px-2 py-1 font-medium text-slate-600">
                    {req.old_role}
                  </span>
                </td>
                <td className="px-6 py-4">
                  <span className="inline-flex rounded bg-violet-100 px-2 py-1 font-medium text-violet-700">
                    {req.requested_role}
                  </span>
                </td>
                <td className="px-6 py-4 text-slate-600">
                  {req.requested_organization_type || "-"}
                </td>
                <td className="px-6 py-4">
                  <div className="font-bold text-night">{req.fee_amount} TL</div>
                  {req.status === 'paid' && (
                    <span className="text-xs font-bold uppercase tracking-wider text-emerald-600">Ödendi</span>
                  )}
                  {req.status === 'pending' && (
                    <span className="text-xs font-bold uppercase tracking-wider text-amber-500">Bekliyor</span>
                  )}
                  {req.status === 'approved' && (
                    <span className="text-xs font-bold uppercase tracking-wider text-blue-500">Onaylandı</span>
                  )}
                </td>
                <td className="px-6 py-4 text-right">
                  {req.status === 'paid' || req.status === 'pending' ? (
                    <RoleRequestActions requestId={req.id} status={req.status} />
                  ) : (
                    <span className="font-medium text-slate-400">İşlem Tamamlandı</span>
                  )}
                </td>
              </tr>
            ))}
            {requests.length === 0 && (
              <tr>
                <td className="px-6 py-12 text-center text-slate-500" colSpan={6}>
                  Bekleyen talep bulunmamaktadır.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
