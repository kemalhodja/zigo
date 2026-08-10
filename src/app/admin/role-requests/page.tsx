import { redirect } from "next/navigation";

import { getCurrentProfile } from "@/lib/domain/profiles";
import { createClient } from "@/lib/supabase/server";

import { RoleRequestActions } from "./actions";

export default async function RoleRequestsPage() {
  const supabase = await createClient();
  const profile = await getCurrentProfile(supabase);

  if (!profile) {
    redirect("/auth");
  }

  // Zigo has a custom platform_admins table or uses current_user_is_platform_admin
  const { data: adminData } = await supabase.from("platform_admins").select("user_id").eq("user_id", profile.id).single();
  
  if (!adminData) {
    redirect("/");
  }

  const { data: requests, error } = await supabase
    .from("role_change_requests")
    .select("*, users!inner(full_name, email)")
    .order("created_at", { ascending: false });

  if (error) {
    return <div className="p-8 text-rose-500">Kayıtlar alınırken hata oluştu: {error.message}</div>;
  }

  return (
    <div className="p-8 max-w-6xl mx-auto">
      <h1 className="text-2xl font-black text-night mb-8">Rol Değiştirme Talepleri (Onay Bekleyenler)</h1>
      
      <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
        <table className="w-full text-left">
          <thead className="bg-slate-50 border-b border-slate-100 text-sm font-bold text-slate-500">
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
            {requests?.map((req: any) => (
              <tr key={req.id} className="hover:bg-slate-50 transition">
                <td className="px-6 py-4">
                  <div className="font-bold text-night">{req.users?.full_name}</div>
                  <div className="text-slate-500 text-xs">{req.users?.email}</div>
                </td>
                <td className="px-6 py-4">
                  <span className="inline-flex px-2 py-1 bg-slate-100 rounded text-slate-600 font-medium">
                    {req.old_role}
                  </span>
                </td>
                <td className="px-6 py-4">
                  <span className="inline-flex px-2 py-1 bg-violet-100 text-violet-700 rounded font-medium">
                    {req.requested_role}
                  </span>
                </td>
                <td className="px-6 py-4 text-slate-600">
                  {req.requested_organization_type || "-"}
                </td>
                <td className="px-6 py-4">
                  <div className="font-bold text-night">{req.fee_amount} TL</div>
                  {req.status === 'paid' && (
                    <span className="text-xs font-bold text-emerald-600 uppercase tracking-wider">Ödendi</span>
                  )}
                  {req.status === 'pending' && (
                    <span className="text-xs font-bold text-amber-500 uppercase tracking-wider">Bekliyor</span>
                  )}
                  {req.status === 'approved' && (
                    <span className="text-xs font-bold text-blue-500 uppercase tracking-wider">Onaylandı</span>
                  )}
                </td>
                <td className="px-6 py-4 text-right">
                  {req.status === 'paid' || req.status === 'pending' ? (
                    <RoleRequestActions requestId={req.id} status={req.status} />
                  ) : (
                    <span className="text-slate-400 font-medium">İşlem Tamamlandı</span>
                  )}
                </td>
              </tr>
            ))}
            {requests?.length === 0 && (
              <tr>
                <td colSpan={6} className="px-6 py-12 text-center text-slate-500">
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
