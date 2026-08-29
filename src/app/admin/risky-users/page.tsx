import Link from "next/link";
import { redirect } from "next/navigation";

import { getRiskyUsersQueue, isCurrentUserPlatformAdmin } from "@/lib/domain/admin";
import { createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

export default async function AdminRiskyUsersPage() {
  const supabase = await createClient();
  const isAdmin = await isCurrentUserPlatformAdmin(supabase);
  
  if (!isAdmin) {
    redirect("/home");
  }

  const riskyUsers = await getRiskyUsersQueue(supabase);

  return (
    <div className="mx-auto max-w-5xl space-y-8 p-4 py-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-black text-slate-900 tracking-tight">Riskli Kullanıcılar</h1>
          <p className="mt-1 text-sm text-slate-500 font-medium">Moderasyon kurallarını ihlal eden hesapların listesi</p>
        </div>
        <Link
          href="/admin"
          className="rounded-xl bg-slate-100 px-4 py-2 text-sm font-bold text-slate-700 transition hover:bg-slate-200"
        >
          Ana Panele Dön
        </Link>
      </div>

      <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
        <table className="w-full text-left text-sm">
          <thead className="border-b border-slate-100 bg-slate-50/50">
            <tr>
              <th className="p-4 font-bold text-slate-600">Kullanıcı</th>
              <th className="p-4 font-bold text-slate-600">İhlal Puanı (Strike)</th>
              <th className="p-4 font-bold text-slate-600">Mevcut Durum</th>
              <th className="p-4 font-bold text-slate-600">Rol</th>
              <th className="p-4 font-bold text-slate-600">Aksiyonlar</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {riskyUsers.length === 0 ? (
              <tr>
                <td colSpan={5} className="p-8 text-center text-slate-500 font-medium">
                  Harika! Şu an riskli veya uyarı almış bir kullanıcı yok. 🎉
                </td>
              </tr>
            ) : (
              riskyUsers.map((user) => (
                <tr key={user.id} className="transition-colors hover:bg-slate-50/50">
                  <td className="p-4">
                    <p className="font-bold text-slate-900">{user.full_name || "İsimsiz"}</p>
                    <p className="text-xs text-slate-500">{user.email}</p>
                  </td>
                  <td className="p-4">
                    <span className="inline-flex items-center rounded-full bg-red-100 px-2.5 py-0.5 text-xs font-bold text-red-700">
                      {user.social_safety_strike_count} İhlal
                    </span>
                  </td>
                  <td className="p-4">
                    {user.social_interactions_blocked ? (
                      <span className="inline-flex items-center rounded-full bg-red-100 px-2.5 py-0.5 text-xs font-bold text-red-700">
                        Sosyal Özellikleri Engelli
                      </span>
                    ) : (
                      <span className="inline-flex items-center rounded-full bg-green-100 px-2.5 py-0.5 text-xs font-bold text-green-700">
                        Aktif
                      </span>
                    )}
                  </td>
                  <td className="p-4 font-medium text-slate-600 capitalize">
                    {user.role}
                  </td>
                  <td className="p-4">
                    <Link
                      href={`/profile/${user.id}`}
                      target="_blank"
                      className="rounded-lg bg-blue-50 px-3 py-1.5 text-xs font-bold text-blue-600 transition hover:bg-blue-100"
                    >
                      Profili İncele
                    </Link>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
