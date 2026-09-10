import Link from "next/link";
import { redirect } from "next/navigation";

import { AdminRiskyUsersTable } from "@/components/admin-risky-users-table";
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
          <p className="mt-1 text-sm text-slate-500 font-medium">
            Moderasyon kurallarını ihlal eden hesapların ve ceza puanlarının listesi
          </p>
        </div>
        <Link
          href="/admin"
          className="rounded-xl bg-slate-100 px-4 py-2 text-sm font-bold text-slate-700 transition hover:bg-slate-200"
        >
          Ana Panele Dön
        </Link>
      </div>

      <AdminRiskyUsersTable initialUsers={riskyUsers} />
    </div>
  );
}
