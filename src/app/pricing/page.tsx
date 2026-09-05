"use client";

import { BookOpen, Building2, CheckCircle2, Crown, GraduationCap, MonitorPlay, Sparkles, Users, XCircle } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

import { createClient } from "@/lib/supabase/client";

const ROLE_PLANS = {
  student: {
    title: "Öğrenci",
    icon: GraduationCap,
    gradient: "from-crystal to-berry",
    monthly: 49,
    yearly: 450,
    features: [
      "Sınırsız soru çözümü ve video izleme",
      "Tüm branşlarda detaylı performans analizi",
      "Focus/Pomodoro ve özel çalışma planı",
      "Zeka Oyunları Salonu (5 mini oyun)",
      "Mağaza erişimi ve Zigo Puan harcaması",
      "Reklamsız kesintisiz deneyim",
      "Gelişmiş veli raporları (veli hesabı varsa)",
    ],
  },
  parent: {
    title: "Veli",
    icon: Users,
    gradient: "from-aqua to-mint",
    monthly: 49,
    yearly: 450,
    features: [
      "Çocuk gelişimi detaylı analitik",
      "Focus/Pomodoro takibi ve raporlar",
      "Mağaza onay ve ödül yönetimi",
      "Gelişmiş aile raporları",
      "Reklamsız deneyim",
    ],
  },
  teacher: {
    title: "Öğretmen",
    icon: Sparkles,
    gradient: "from-sun to-peach",
    monthly: 99,
    yearly: 749,
    features: [
      "İçerik Stüdyosu tam erişim",
      "Mini quiz oluşturma ve yayınlama",
      "Yazılı hazırlık linkleri paylaşımı",
      "Sponsorlu reklam gönderileri",
      "Öğrenci analitiği ve sınıf yönetimi",
      "Reklamsız deneyim",
    ],
  },
  institution: {
    title: "Eğitim Kurumu",
    icon: Building2,
    gradient: "from-indigo-400 to-cyan-400",
    monthly: 250,
    yearly: 2500,
    features: [
      "Kurum vitrini ve branş yönetimi",
      "Toplu kullanıcı (öğretmen/öğrenci/veli) takibi",
      "Kurumsal analitik ve raporlama",
      "Match-Feed branş bazlı içerik dağıtımı",
      "Creator Plus araçları dahil",
    ],
  },
  platform: {
    title: "Eğitim Platformu",
    icon: MonitorPlay,
    gradient: "from-fuchsia-400 to-pink-500",
    monthly: 200,
    yearly: 2000,
    features: [
      "Dijital platform vitrini",
      "Çok branşlı içerik ve abonelik yönetimi",
      "Match-Feed hedef kitle erişimi",
      "Kurumsal raporlama ve entegrasyon altyapısı",
      "Creator Plus araçları dahil",
    ],
  },
  publisher: {
    title: "Yayınevi",
    icon: BookOpen,
    gradient: "from-emerald-400 to-teal-500",
    monthly: 200,
    yearly: 2000,
    features: [
      "Yayınevi vitrini ve marka görünürlüğü",
      "Kitap/materyal/soru bankası dağıtımı",
      "Branş bazlı Match-Feed erişimi",
      "Kurumsal raporlama ve Creator Plus araçları",
    ],
  },
} as const;

type RoleKey = keyof typeof ROLE_PLANS;

function PlanCard({ role, isCurrentRole, isSelected, onSelect }: { 
  role: RoleKey; 
  isCurrentRole: boolean;
  isSelected: boolean;
  onSelect: (role: RoleKey) => void;
}) {
  const config = ROLE_PLANS[role];
  const monthly = config.monthly;
  const yearly = config.yearly;
  const yearlySavings = Math.round((monthly * 12 - yearly) / (monthly * 12) * 100);

  return (
    <div
      onClick={() => onSelect(role)}
      className={`relative flex flex-col h-full rounded-2xl border-2 p-5 transition-all ${
        isCurrentRole
          ? "border-slate-100 bg-slate-50 opacity-60 cursor-not-allowed"
          : isSelected
          ? "border-violet-500 bg-violet-50 shadow-md ring-4 ring-violet-500/10"
          : "border-slate-200 bg-white hover:border-violet-300 hover:bg-slate-50"
      }`}
    >
      {isCurrentRole && (
        <span className="absolute -top-3 left-1/2 -translate-x-1/2 rounded-full bg-slate-200 px-2 py-0.5 text-[10px] font-black uppercase text-slate-600">
          Mevcut Plan
        </span>
      )}

      <div className="flex items-center gap-3 mb-4">
        <div className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br ${config.gradient} text-white shadow-inner`}>
          <config.icon className="h-6 w-6" />
        </div>
        <div>
          <h3 className="font-black text-night">{config.title}</h3>
          <p className="text-xs font-bold text-slate-500">Zigo Plus Aboneliği</p>
        </div>
      </div>

      <div className="mb-4 space-y-2">
        <div className="flex items-baseline gap-2">
          <span className="text-3xl font-black text-night">{monthly.toLocaleString("tr-TR")} ₺</span>
          <span className="text-sm font-bold text-slate-500">/ay</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-lg font-bold text-slate-500 line-through">{monthly * 12} ₺</span>
          <span className="text-2xl font-black text-night">{yearly.toLocaleString("tr-TR")} ₺</span>
          <span className="text-sm font-bold text-slate-500">/yıl</span>
          <span className="ml-auto rounded-full bg-emerald-100 px-2 py-0.5 text-[10px] font-black text-emerald-700">
            %{yearlySavings} kazanç
          </span>
        </div>
      </div>

      <ul className="flex-1 space-y-2 mb-4">
        {config.features.map((feature, i) => (
          <li key={i} className="flex items-start gap-2 text-sm font-bold text-slate-600">
            <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-500 mt-0.5" />
            <span>{feature}</span>
          </li>
        ))}
      </ul>

      <div className="pt-3 border-t border-slate-100">
        <p className="text-xs font-bold text-slate-500 mb-2">
          İlk 7 gün içinde abone olursanız <span className="text-amber-500">%50 indirim</span> (Promo: <span className="font-mono">ZIGO50</span>)
        </p>
        <p className="text-[10px] font-bold text-slate-400 mb-3">
          7 gün sonrası: Tam liste fiyatı (indirim yok)
        </p>
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            onSelect(role);
            window.location.href = `/billing/havale?planId=zigo-plus-${role === "teacher" ? "teachers" : "student"}-monthly`;
          }}
          className="tap-scale w-full py-2.5 px-4 rounded-xl bg-gradient-to-r from-amber-400 to-orange-500 text-slate-950 font-black text-xs shadow-md hover:brightness-105 transition flex items-center justify-center gap-1"
        >
          <span>✨</span>
          <span>Zigo Plus'a Abone Ol</span>
        </button>
      </div>
    </div>
  );
}

function FeatureMatrix() {
  const allFeatures = [
    { key: "unlimitedContent", label: "Sınırsız soru/video", roles: ["student", "parent", "teacher"] },
    { key: "analytics", label: "Detaylı analitik", roles: ["student", "parent"] },
    { key: "customStudyPlan", label: "Özel çalışma planı", roles: ["student"] },
    { key: "focus", label: "Focus/Pomodoro", roles: ["student", "parent"] },
    { key: "games", label: "Zeka Oyunları Salonu", roles: ["student"] },
    { key: "store", label: "Mağaza & Puan harcaması", roles: ["student", "parent"] },
    { key: "adFree", label: "Reklamsız deneyim", roles: ["student", "parent", "teacher"] },
    { key: "advancedReports", label: "Gelişmiş veli raporları", roles: ["parent"] },
    { key: "teacherCreatorPlus", label: "Quiz/Yazılı/Sponsor", roles: ["teacher"] },
    { key: "institutionTools", label: "Kurumsal araçlar", roles: ["institution", "platform", "publisher"] },
  ];

  return (
    <section className="-mx-4 border-y border-slate-100 bg-slate-50 px-4 py-8">
      <h2 className="text-xl font-black text-night mb-6 text-center">Özellik Karşılaştırma Matrisi</h2>
      <div className="overflow-x-auto">
        <table className="w-full text-sm font-bold">
          <thead>
            <tr className="border-b border-slate-200">
              <th className="text-left py-3 px-2 text-slate-500">Özellik</th>
              {Object.keys(ROLE_PLANS).map((role) => (
                <th key={role} className="py-3 px-2 text-center text-slate-500 capitalize">{role}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {allFeatures.map((feature) => (
              <tr key={feature.key} className="border-b border-slate-100 hover:bg-white">
                <td className="py-3 px-2 text-slate-700">{feature.label}</td>
                {Object.keys(ROLE_PLANS).map((role) => (
                  <td key={role} className="py-3 px-2 text-center">
                    {feature.roles.includes(role) ? (
                      <CheckCircle2 className="h-5 w-5 mx-auto text-emerald-500" />
                    ) : (
                      <XCircle className="h-5 w-5 mx-auto text-slate-300" />
                    )}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}

type SubscriptionState = {
  isPremium: boolean;
  isTrial: boolean;
  trialDaysRemaining: number;
  isLoading: boolean;
};

function usePricingSubscription(): SubscriptionState {
  const [state, setState] = useState<SubscriptionState>({
    isPremium: false,
    isTrial: false,
    trialDaysRemaining: 0,
    isLoading: true,
  });
  const supabase = createClient();

  useEffect(() => {
    let mounted = true;

    async function fetchSubscription() {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) {
          if (mounted) setState({ isPremium: false, isTrial: false, trialDaysRemaining: 0, isLoading: false });
          return;
        }

        // 1. user_subscriptions kontrolü (multi-row toleranslı)
        try {
          const { data: subs } = await (supabase.from("user_subscriptions") as unknown as {
            select: (cols: string) => {
              eq: (col: string, val: string) => {
                order: (col2: string, opts: { ascending: boolean }) => {
                  limit: (n: number) => Promise<{
                    data: Array<{
                      tier?: string | null;
                      status?: string | null;
                      current_period_end?: string | null;
                      expires_at?: string | null;
                    }> | null;
                  }>;
                };
              };
            };
          })
            .select("tier, status, current_period_end, expires_at")
            .eq("user_id", user.id)
            .order("updated_at", { ascending: false })
            .limit(5);

          if (Array.isArray(subs) && subs.length > 0) {
            const now = Date.now();
            const isActive = subs.some((s) => {
              const isPlus = s.tier === "zigo_plus" || s.status === "active" || s.status === "trialing";
              if (!isPlus) return false;
              const end = s.current_period_end || s.expires_at;
              return !end || new Date(end).getTime() > now;
            });

            if (isActive) {
              if (mounted) setState({ isPremium: true, isTrial: false, trialDaysRemaining: 0, isLoading: false });
              return;
            }
          }
        } catch {
          // silent
        }

        // 2. users tablosu: is_premium & created_at
        const { data: userData } = await supabase
          .from("users")
          .select("is_premium, created_at")
          .eq("id", user.id)
          .maybeSingle();

        if (userData?.is_premium === true) {
          if (mounted) setState({ isPremium: true, isTrial: false, trialDaysRemaining: 0, isLoading: false });
          return;
        }

        let isTrialActive = false;
        let trialDaysRemaining = 0;

        if (userData?.created_at) {
          const createdTime = new Date(userData.created_at).getTime();
          const diffTime = Date.now() - createdTime;
          const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
          if (diffDays >= 0 && diffDays < 7) {
            isTrialActive = true;
            trialDaysRemaining = Math.max(0, 6 - diffDays);
          }
        }

        if (mounted) {
          setState({
            isPremium: isTrialActive,
            isTrial: isTrialActive,
            trialDaysRemaining,
            isLoading: false,
          });
        }
      } catch {
        if (mounted) setState({ isPremium: false, isTrial: false, trialDaysRemaining: 0, isLoading: false });
      }
    }

    fetchSubscription();

    const { data: authListener } = supabase.auth.onAuthStateChange(() => {
      fetchSubscription();
    });

    return () => {
      mounted = false;
      authListener?.subscription.unsubscribe();
    };
  }, [supabase]);

  return state;
}

export default function PricingPage() {
  const router = useRouter();
  const { isTrial, trialDaysRemaining, isLoading } = usePricingSubscription();
  const [selectedRole, setSelectedRole] = useState<RoleKey | null>("student");
  const supabase = createClient();

  const _handleSubscribe = async (role: RoleKey) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        router.push("/auth?next=/pricing");
        return;
      }

      // planId: teacher -> teachers, others -> student
      const planId = role === "teacher"
        ? "zigo-plus-teachers-monthly"
        : role === "institution"
          ? "zigo-plus-educational-institutions-monthly"
          : role === "platform"
            ? "zigo-plus-platform-monthly"
            : role === "publisher"
              ? "zigo-plus-publisher-monthly"
              : "zigo-plus-student-monthly";

      const response = await fetch("/api/billing/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ planId }),
      });

      const result = await response.json();
      // API returns { data: { url, planId } }
      const checkoutUrl = result?.data?.url ?? result?.checkoutUrl;
      if (checkoutUrl) {
        window.location.href = checkoutUrl;
      } else {
        console.error("Checkout URL not found in response:", result);
      }
    } catch (error) {
      console.error("Checkout error:", error);
    }
  };

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-4 border-violet-600 border-t-transparent"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50">
      <header className="border-b border-slate-100 bg-white">
        <div className="max-w-6xl mx-auto px-4 py-12 sm:px-6 lg:px-8">
          <div className="max-w-3xl mx-auto text-center">
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-tr from-violet-500 to-fuchsia-500 text-white shadow-lg">
              <Crown className="h-8 w-8" />
            </div>
            <h1 className="mt-6 text-4xl font-black tracking-tight text-night">Zigo Plus Aboneliği</h1>
            <p className="mt-4 text-lg font-bold text-slate-500">
              Rolüne göre özel fiyatlandırma. İlk 7 gün içinde <span className="text-amber-500">%50 indirim</span> (Promo: <span className="font-mono">ZIGO50</span>)
            </p>
            
            {isTrial && trialDaysRemaining > 0 && (
              <div className="mt-6 inline-flex items-center gap-2 rounded-full bg-amber-50 px-4 py-2 text-sm font-black text-amber-700 border border-amber-200">
                <span className="flex h-6 w-6 items-center justify-center rounded-full bg-amber-100">⏳</span>
                <span>Deneme süreniz: <strong>{trialDaysRemaining} gün</strong> kaldı</span>
              </div>
            )}
          </div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-4 py-12 sm:px-6 lg:px-8">
        <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-3">
          {Object.keys(ROLE_PLANS).map((role) => (
            <PlanCard
              key={role}
              role={role as RoleKey}
              isCurrentRole={false}
              isSelected={selectedRole === role}
              onSelect={setSelectedRole}
            />
          ))}
        </div>

        <FeatureMatrix />

        <section className="mt-12 -mx-4 border-y border-slate-100 bg-white px-4 py-8">
          <h2 className="text-xl font-black text-night mb-6 text-center">Sık Sorulan Sorular</h2>
          <dl className="space-y-4 max-w-3xl mx-auto">
            <div className="border border-slate-200 rounded-xl p-4">
              <dt className="font-black text-night mb-1">7 günlük deneme nasıl çalışıyor?</dt>
              <dd className="text-slate-600">Kayıt tarihinizden itibaren 7 gün boyunca tüm premium özellikler serbest. 7. gün bitiminde otomatik olarak ücretsiz plana dönersiniz (veri kaybı yok).</dd>
            </div>
            <div className="border border-slate-200 rounded-xl p-4">
              <dt className="font-black text-night mb-1">%50 indirim nasıl alınır?</dt>
              <dd className="text-slate-600">Kayıttan sonraki ilk 7 gün içinde ödeme sayfasında <strong>ZIGO50</strong> promo kodunu girin. İndirim otomatik uygulanır. 7 gün geçtise kod çalışmaz.</dd>
            </div>
            <div className="border border-slate-200 rounded-xl p-4">
              <dt className="font-black text-night mb-1">Abonelik iptali nasıl yapılır?</dt>
              <dd className="text-slate-600">Profil → Abonelik → İptal. İptal ettikten sonra dönem bitimine kadar erişiminiz devam eder. Yenileme yapılmaz.</dd>
            </div>
            <div className="border border-slate-200 rounded-xl p-4">
              <dt className="font-black text-night mb-1">Rol değiştirirsem fiyat değişir mi?</dt>
              <dd className="text-slate-600">Evet. Her rolün kendi fiyatı vardır. Rol değiştirme sayfasından geçiş yapabilir, fark ücreti hesaplanır.</dd>
            </div>
            <div className="border border-slate-200 rounded-xl p-4">
              <dt className="font-black text-night mb-1">Yıllık planda avantaj var mı?</dt>
              <dd className="text-slate-600">Evet. Yıllık plan aylığa göre <strong>%15-23</strong> daha uygun (2 ay bedava mantığıyla).</dd>
            </div>
          </dl>
        </section>

        <div className="mt-12 text-center">
          <p className="text-sm font-bold text-slate-500 mb-4">
            Reklam yok. Veri satılmaz. Güvenli öğrenme.
          </p>
          <p className="text-xs font-bold text-slate-400">
            Tüm fiyatlar KDV dahildir. Kurumsal toplu lisanslar için <a href="https://wa.me/905550000000" className="text-crystal hover:underline">WhatsApp</a> ile iletişime geçin.
          </p>
        </div>
      </main>
    </div>
  );
}