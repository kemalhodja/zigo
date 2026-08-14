"use client";

import { BookOpen, Building2, CheckCircle2, ChevronRight, GraduationCap, Loader2, MonitorPlay, Shield, Sparkles, Users } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect,useState } from "react";
import { toast } from "react-hot-toast";

// AppShell imported but not yet used in this screen
// import { AppShell } from "@/components/app-shell";
import { createClient } from "@/lib/supabase/client";
import type { UserRole } from "@/lib/supabase/database.types";

const ROLE_OPTIONS = [
  {
    id: "student",
    title: "Öğrenci",
    description: "Sınavlara hazırlan, quiz çöz ve arkadaşlarınla yarış.",
    icon: GraduationCap,
    gradient: "from-crystal to-berry",
  },
  {
    id: "parent",
    title: "Veli",
    description: "Öğrenci gelişimini takip et, aile paketini yönet.",
    icon: Users,
    gradient: "from-aqua to-mint",
  },
  {
    id: "teacher",
    title: "Öğretmen / İçerik Üretici",
    description: "Kendi içeriklerini yayınla, öğrencilere ulaş ve gelir elde et.",
    icon: Sparkles,
    gradient: "from-sun to-peach",
  },
  {
    id: "education_institution",
    title: "Eğitim Kurumu",
    description: "Kurum yönetimi, toplu kullanıcı takibi ve kurumsal paylaşım yapın.",
    icon: Building2,
    gradient: "from-indigo-400 to-cyan-400",
  },
  {
    id: "education_platform",
    title: "Eğitim Platformu",
    description: "Dijital kurs ve müfredat içerikleri sunarak geniş kitlelere ulaşın.",
    icon: MonitorPlay,
    gradient: "from-fuchsia-400 to-pink-500",
  },
  {
    id: "publisher",
    title: "Yayınevi",
    description: "Soru bankası, kaynak ve dijital yayın paylaşımları yapın.",
    icon: BookOpen,
    gradient: "from-emerald-400 to-teal-500",
  },
] as const;

export default function RoleUpgradePage() {
  const router = useRouter();
  const [profileRole, setProfileRole] = useState<UserRole | null>(null);
  const [selectedRole, setSelectedRole] = useState<string>("");
  const [loading, setLoading] = useState(false);
  const supabase = createClient();

  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (user) {
        supabase
          .from("users")
          .select("role")
          .eq("id", user.id)
          .single()
          .then(({ data }) => {
            if (data) setProfileRole(data.role as UserRole);
          });
      }
    });
  }, [supabase]);

  async function handleUpgrade() {
    if (!selectedRole) return;
    if (selectedRole === profileRole) {
      toast.error("Zaten bu roldesiniz.");
      return;
    }

    setLoading(true);
    try {
      const res = await fetch("/api/billing/role-upgrade", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ accountKind: selectedRole }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Bir hata oluştu");
      }

      if (data.requiresPayment && data.checkoutUrl) {
        window.location.href = data.checkoutUrl;
      } else {
        toast.success("Rol başarıyla güncellendi!");
        router.push("/profile");
      }
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "İşlem tamamlanamadı";
      toast.error(message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="mx-auto max-w-2xl px-4 py-8 sm:px-6">
      <div className="text-center">
        <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-tr from-violet-500 to-fuchsia-500 text-white shadow-lg shadow-violet-200">
          <Shield className="h-8 w-8" />
        </div>
        <h1 className="mt-6 text-3xl font-black tracking-tight text-night">Rol Değiştirme ve Yükseltme</h1>
        <p className="mt-4 text-base font-bold text-slate-500">
          Zigo'da farklı bir kullanıcı türüne geçiş yapmak istiyorsanız aşağıdaki seçeneklerden birini seçin. Mevcut aboneliğinize göre dinamik bir fark ücreti hesaplanacaktır.
        </p>
      </div>

      <div className="mt-10 grid gap-4">
        {ROLE_OPTIONS.map((option) => {
          const isCurrent = profileRole === option.id;
          const isSelected = selectedRole === option.id;

          return (
            <button
              key={option.id}
              type="button"
              disabled={isCurrent || loading}
              onClick={() => setSelectedRole(option.id)}
              className={`relative flex items-center gap-4 rounded-2xl border-2 p-4 text-left transition-all ${
                isCurrent
                  ? "border-slate-100 bg-slate-50 opacity-60"
                  : isSelected
                  ? "border-violet-500 bg-violet-50 shadow-md ring-4 ring-violet-500/10"
                  : "border-slate-200 bg-white hover:border-violet-300 hover:bg-slate-50"
              }`}
            >
              <div
                className={`flex h-14 w-14 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br ${option.gradient} text-white shadow-inner`}
              >
                <option.icon className="h-6 w-6" />
              </div>
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <h3 className="font-black text-night">{option.title}</h3>
                  {isCurrent && (
                    <span className="rounded-full bg-slate-200 px-2 py-0.5 text-[10px] font-black uppercase text-slate-600">
                      Mevcut Rol
                    </span>
                  )}
                </div>
                <p className="mt-1 text-xs font-bold leading-relaxed text-slate-500">
                  {option.description}
                </p>
              </div>
              {!isCurrent && (
                <div
                  className={`flex h-6 w-6 items-center justify-center rounded-full border-2 ${
                    isSelected
                      ? "border-violet-500 bg-violet-500 text-white"
                      : "border-slate-300 bg-transparent text-transparent"
                  }`}
                >
                  <CheckCircle2 className="h-4 w-4" />
                </div>
              )}
            </button>
          );
        })}
      </div>

      <div className="mt-8 flex justify-end">
        <button
          disabled={!selectedRole || loading}
          onClick={handleUpgrade}
          className="flex w-full sm:w-auto items-center justify-center gap-2 rounded-xl bg-violet-600 px-8 py-3 text-sm font-black text-white hover:bg-violet-700 disabled:opacity-50"
        >
          {loading ? (
            <Loader2 className="h-5 w-5 animate-spin" />
          ) : (
            <>
              İlerle ve Ödeme Adımına Geç <ChevronRight className="h-5 w-5" />
            </>
          )}
        </button>
      </div>
    </div>
  );
}
