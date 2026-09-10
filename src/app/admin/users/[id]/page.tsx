import Link from "next/link";
import { notFound } from "next/navigation";

import { AdminUser360View } from "@/components/admin-user-360-view";
import { StateCard } from "@/components/state-card";
import { hasSupabaseEnv } from "@/lib/config";
import { isCurrentUserPlatformAdmin } from "@/lib/domain/admin";
import { getUser360Details } from "@/lib/domain/admin-user-details";
import { getCurrentProfile } from "@/lib/domain/profiles";
import { createClient } from "@/lib/supabase/server";

type PageProps = {
  params: Promise<{ id: string }>;
};

export default async function AdminUserDetailPage({ params }: PageProps) {
  const { id: userId } = await params;

  if (!hasSupabaseEnv()) {
    return (
      <StateCard
        action={
          <Link className="font-black text-crystal" href="/setup">
            Kurulumu Aç
          </Link>
        }
        description="Bu sayfayı görüntülemek için Supabase bağlantısı gereklidir."
        title="Supabase Gerekli"
      />
    );
  }

  const supabase = await createClient();
  const profile = await getCurrentProfile(supabase);

  if (!profile) {
    return (
      <StateCard
        action={
          <Link className="font-black text-crystal" href={`/auth?next=/admin/users/${userId}`}>
            Giriş Yap
          </Link>
        }
        description="Yönetici paneline erişmek için oturum açmalısınız."
        title="Oturum Gerekli"
      />
    );
  }

  const isAdmin = await isCurrentUserPlatformAdmin(supabase);

  if (!isAdmin) {
    return (
      <StateCard
        action={
          <Link className="font-black text-crystal" href="/">
            Ana Sayfaya Dön
          </Link>
        }
        description="Bu sayfaya erişim için platform yöneticisi (admin) yetkisi gerekmektedir."
        title="Yetkisiz Erişim"
      />
    );
  }

  const userData = await getUser360Details(supabase, userId);

  if (!userData) {
    return (
      <div className="mx-auto max-w-2xl py-16 px-4">
        <StateCard
          action={
            <Link className="font-black text-crystal" href="/admin">
              ← Kullanıcı Listesine Dön
            </Link>
          }
          description={`ID (${userId}) ile eşleşen bir kullanıcı bulunamadı.`}
          title="Kullanıcı Bulunamadı"
        />
      </div>
    );
  }

  return <AdminUser360View initialData={userData} />;
}
