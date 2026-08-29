"use client";

import { BookOpen, Building2, CheckCircle2, ChevronRight, Crown, GraduationCap, Loader2, MonitorPlay, Shield, Sparkles, Users } from "lucide-react";
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
    icon: GraduationCap,
    gradient: "from-crystal to-berry",
    baseBenefits: [
      "Quiz çöz ve puan kazan",
      "Micro dersleri izle",
      "Arkadaşlarına meydan oku (Düello)",
      "Zeka oyunları salonu (sınırlı)",
      "Puanlarla mağazadan ödül al",
    ],
    premiumBenefits: [
      "Sınırsız zeka oyunları salonu",
      "Günlük 1 saat oyun süresi (08:00-22:00)",
      "Focus/Pomodoro ve özel çalışma planı",
      "Detaylı performans analitiği",
      "Reklamsız deneyim",
      "Gelişmiş veli raporları",
    ],
  },
  {
    id: "parent",
    title: "Veli",
    icon: Users,
    gradient: "from-aqua to-mint",
    baseBenefits: [
      "Çocuk profilleri oluştur ve yönet",
      "Çocuk gelişimini takip et",
      "Mağaza onayları ver",
    ],
    premiumBenefits: [
      "Detaylı çocuk analitik raporları",
      "Focus/Pomodoro takibi ve süre yönetimi",
      "Gelişmiş aile ve çocuk raporları",
      "Reklamsız deneyim",
      "Sınıf grubu yönetimi",
    ],
  },
  {
    id: "teacher",
    title: "Öğretmen / İçerik Üretici",
    icon: Sparkles,
    gradient: "from-sun to-peach",
    baseBenefits: [
      "İçerik paylaş (ders, quiz, video)",
      "Öğrenci sorularını yanıtla",
      "Temel analitik görüntüle",
    ],
    premiumBenefits: [
      "İçerik Stüdyosu tam erişim",
      "Mini quiz oluştur ve yayınla",
      "Yazılı hazırlık linkleri paylaş",
      "Sponsorlu reklam gönderileri",
      "Öğrenci analitiği ve sınıf yönetimi",
      "Reklamsız deneyim",
    ],
  },
  {
    id: "institution",
    title: "Eğitim Kurumu",
    icon: Building2,
    gradient: "from-indigo-400 to-cyan-400",
    baseBenefits: [
      "Kurum vitrini oluştur",
      "Kullanıcıları toplu yönet",
    ],
    premiumBenefits: [
      "Kurumsal analitik ve raporlama",
      "Match-Feed branş bazlı dağıtım",
      "Creator Plus araçları dahil",
      "Toplu kullanıcı (öğretmen/öğrenci/veli) takibi",
      "Kurumsal paylaşım ve entegrasyon",
    ],
  },
  {
    id: "platform",
    title: "Eğitim Platformu",
    icon: MonitorPlay,
    gradient: "from-fuchsia-400 to-pink-500",
    baseBenefits: [
      "Platform vitrini oluştur",
      "İçerik katalogu yönet",
    ],
    premiumBenefits: [
      "Çok branşlı içerik ve abonelik yönetimi",
      "Match-Feed hedef kitle erişimi",
      "Kurumsal raporlama ve entegrasyon altyapısı",
      "Creator Plus araçları dahil",
    ],
  },
  {
    id: "publisher",
    title: "Yayınevi",
    icon: BookOpen,
    gradient: "from-emerald-400 to-teal-500",
    baseBenefits: [
      "Yayınevi vitrini oluştur",
      "Dijital kaynak paylaş",
    ],
    premiumBenefits: [
      "Soru bankası ve materyal dağıtımı",
      "Branş bazlı Match-Feed erişimi",
      "Kurumsal raporlama ve Creator Plus araçları",
      "Marka görünürlüğü ve vitrin öne çıkarma",
    ],
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
        <h1 className="mt-6 text-3xl font-black tracking-tight text-night">Rol Seç ve Ayrıcalıkları Gör</h1>
        <p className="mt-4 text-base font-bold text-slate-500">
          Her rolü tıklayarak rolle gelen temel özellikleri ve Zigo Plus aboneliğiyle kazanacağın premium ayrıcalıkları karşılaştır.
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
              className={`relative flex flex-col rounded-2xl border-2 p-4 text-left transition-all ${
                isCurrent
                  ? "border-slate-100 bg-slate-50 opacity-60"
                  : isSelected
                  ? "border-violet-500 bg-violet-50 shadow-md ring-4 ring-violet-500/10"
                  : "border-slate-200 bg-white hover:border-violet-300 hover:bg-slate-50"
              }`}
            >
              <div className="flex items-start gap-4">
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
              </div>

              {/* Base Benefits */}
              <div className="mt-4 pt-4 border-t border-slate-100">
                <div className="flex items-center gap-1.5 text-xs font-black text-slate-500 mb-2">
                  <span>📦</span>
                  <span>Rolle Gelen Temel Özellikler</span>
                </div>
                <ul className="space-y-1">
                  {option.baseBenefits.map((benefit, i) => (
                    <li key={i} className="flex items-start gap-2 text-xs font-bold text-slate-600">
                      <CheckCircle2 className="h-3.5 w-3.5 shrink-0 text-emerald-500 mt-0.5" />
                      <span>{benefit}</span>
                    </li>
                  ))}
                </ul>
              </div>

              {/* Premium Benefits */}
              <div className="mt-3 pt-3 border-t border-slate-100">
                <div className="flex items-center gap-1.5 text-xs font-black text-amber-600 mb-2">
                  <Crown className="h-3.5 w-3.5" />
                  <span>Zigo Plus Aboneliğiyle Kazanacağın Premium Ayrıcalıklar</span>
                </div>
                <ul className="space-y-1">
                  {option.premiumBenefits.map((benefit, i) => (
                    <li key={i} className="flex items-start gap-2 text-xs font-bold text-slate-600">
                      <Crown className="h-3.5 w-3.5 shrink-0 text-amber-500 mt-0.5" />
                      <span>{benefit}</span>
                    </li>
                  ))}
                </ul>
              </div>
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
