"use client";

import { BookOpen, Building2, CheckCircle2, Crown, GraduationCap, MonitorPlay, ShieldCheck, Sparkles, Users, XCircle, Zap } from "lucide-react";
import Link from "next/link";
import { useEffect, useState } from "react";

import { GooglePlaySubscriptionModal } from "@/components/google-play-subscription-modal";
import { isCapacitorAndroidClient } from "@/lib/client/capacitor-runtime";
import {
  isGooglePlayBillingAvailable,
  purchaseGooglePlaySubscription,
  restoreGooglePlayPurchases,
} from "@/lib/client/google-play-billing";
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

function PlanCard({
  role,
  isCurrentRole: _isCurrentRole,
  isSelected: _isSelected,
  onSelect,
  onOpenModal,
}: {
  role: RoleKey;
  isCurrentRole: boolean;
  isSelected: boolean;
  onSelect: (role: RoleKey) => void;
  onOpenModal: (role: RoleKey, interval: "monthly" | "yearly") => void;
}) {
  const config = ROLE_PLANS[role];
  const monthly = config.monthly;
  const yearly = config.yearly;
  const yearlySavings = Math.round(((monthly * 12 - yearly) / (monthly * 12)) * 100);
  const effectiveMonthly = Math.round(yearly / 12);
  const [interval, setInterval] = useState<"monthly" | "yearly">("yearly");
  const [isNativePlay, setIsNativePlay] = useState(false);

  useEffect(() => {
    setIsNativePlay(isGooglePlayBillingAvailable() || isCapacitorAndroidClient());
  }, []);

  const currentPrice = interval === "yearly" ? yearly : monthly;

  return (
    <div
      onClick={() => onSelect(role)}
      className="linear-card relative flex flex-col h-full rounded-3xl p-6 md:p-8 transition-all hover:border-slate-300 shadow-xl border border-white/40 bg-white/80 backdrop-blur-xl"
    >
      <div className="aurora-glow" />
      
      {/* Üst Başlık ve Rol İkonu */}
      <div className="relative flex items-center justify-between gap-3 mb-5">
        <div className="flex items-center gap-3">
          <div className={`flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-tr ${config.gradient} text-white shadow-lg`}>
            <config.icon className="h-7 w-7" />
          </div>
          <div>
            <h3 className="text-2xl font-black text-night leading-tight">{config.title}</h3>
            <span className="inline-flex items-center gap-1 text-[11px] font-black text-amber-600 bg-amber-50 px-2 py-0.5 rounded-full border border-amber-200 uppercase tracking-wider">
              ✦ Zigo Plus
            </span>
          </div>
        </div>

        {interval === "yearly" && (
          <span className="rounded-full bg-emerald-500/10 border border-emerald-500/30 px-3 py-1 text-xs font-black text-emerald-700 animate-pulse">
            %{yearlySavings} İndirim 🔥
          </span>
        )}
      </div>

      {/* İnteraktif Plan Switcher (Aylık / Yıllık) */}
      <div className="relative mb-5 flex p-1 rounded-2xl bg-slate-100 border border-slate-200">
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            setInterval("monthly");
          }}
          className={`flex-1 py-2.5 rounded-xl text-xs font-black transition-all ${
            interval === "monthly"
              ? "bg-white text-night shadow-md"
              : "text-slate-500 hover:text-night"
          }`}
        >
          Aylık Ödeme
        </button>
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            setInterval("yearly");
          }}
          className={`flex-1 py-2.5 rounded-xl text-xs font-black transition-all flex items-center justify-center gap-1.5 ${
            interval === "yearly"
              ? "bg-gradient-to-r from-amber-400 to-orange-500 text-slate-950 shadow-md font-black"
              : "text-slate-500 hover:text-night"
          }`}
        >
          <span>Yıllık Ödeme</span>
          <span className="text-[10px] bg-slate-950/20 text-slate-950 px-1.5 py-0.5 rounded-full font-black">
            2 Ay Hediye
          </span>
        </button>
      </div>

      {/* Fiyat Gösterimi (Psikolojik / Efektif Fiyat) */}
      <div className="relative mb-6 rounded-2xl bg-gradient-to-br from-slate-50 to-amber-50/40 p-4 border border-slate-100">
        <div className="flex items-baseline gap-1.5">
          <span className="text-4xl font-black text-night tabular-nums tracking-tight">
            {currentPrice.toLocaleString("tr-TR")} ₺
          </span>
          <span className="text-sm font-bold text-slate-500">
            /{interval === "yearly" ? "yıl" : "ay"}
          </span>
        </div>

        {interval === "yearly" ? (
          <p className="mt-1 text-xs font-bold text-emerald-700 flex items-center gap-1.5">
            <Zap className="h-3.5 w-3.5 fill-current" />
            <span>Aylık sadece <strong>{effectiveMonthly} ₺</strong> (Yılda {monthly * 12 - yearly} ₺ cebinizde kalır)</span>
          </p>
        ) : (
          <p className="mt-1 text-xs font-medium text-slate-500">
            Dilediğiniz an tek tıkla iptal edilebilir, taahhütsüz.
          </p>
        )}
      </div>

      {/* Özellik Listesi */}
      <div className="mb-6 flex-1">
        <p className="text-[11px] font-black uppercase tracking-wider text-slate-400 mb-3">Bu Planda Dahil Olanlar</p>
        <ul className="space-y-2.5">
          {config.features.map((feature, i) => (
            <li key={i} className="flex items-start gap-2.5 text-sm font-bold text-slate-700">
              <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-600 mt-0.5" />
              <span>{feature}</span>
            </li>
          ))}
        </ul>
      </div>

      {/* Satın Alma & Aksiyon Alanı */}
      <div className="pt-4 border-t border-slate-100 space-y-3">
        {isNativePlay ? (
          <>
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                onSelect(role);
                onOpenModal(role, interval);
              }}
              className="tap-scale w-full py-3.5 px-5 rounded-2xl text-white font-black text-sm shadow-lg hover:brightness-105 transition flex items-center justify-center gap-2 bg-gradient-to-r from-emerald-500 to-teal-600"
            >
              <svg aria-hidden="true" className="size-5 fill-current" viewBox="0 0 24 24">
                <path d="M3.609 1.814L13.792 12 3.61 22.186a1.99 1.99 0 0 1-.61-1.42V3.234c0-.553.224-1.053.609-1.42zM15.206 13.414l2.585 2.585-12.87 7.43 10.285-10.015zM15.206 10.586L4.921 .571l12.87 7.43-2.585 2.585zM19.393 12l2.366-1.366c.64-.37.64-1.63 0-2l-2.366-1.366-2.585 2.585L19.393 12z" />
              </svg>
              <span>Google Play ile Abone Ol</span>
            </button>

            <div className="flex items-center justify-between px-1">
              <Link
                href={`/billing/havale?planId=${
                  role === "teacher"
                    ? `zigo-plus-teachers-${interval}`
                    : role === "institution"
                      ? `zigo-plus-educational-institutions-${interval}`
                      : role === "platform"
                        ? `zigo-plus-platform-${interval}`
                        : role === "publisher"
                          ? `zigo-plus-publisher-${interval}`
                          : `zigo-plus-student-${interval}`
                }`}
                className="text-xs font-bold text-slate-600 hover:text-amber-600 flex items-center gap-1 transition"
              >
                <span>🏦 Alternatif: Havale / FAST ile Öde</span>
                <span>↗</span>
              </Link>
              <span className="text-[11px] font-semibold text-slate-400">Anında Aktivasyon</span>
            </div>
          </>
        ) : (
          /* Web Ortamı: Google Play gösterilmez, doğrudan Havale / FAST ile ödeme butonu ana aksiyon olarak yer alır */
          <>
            <Link
              href={`/billing/havale?planId=${
                role === "teacher"
                  ? `zigo-plus-teachers-${interval}`
                  : role === "institution"
                    ? `zigo-plus-educational-institutions-${interval}`
                    : role === "platform"
                      ? `zigo-plus-platform-${interval}`
                      : role === "publisher"
                        ? `zigo-plus-publisher-${interval}`
                        : `zigo-plus-student-${interval}`
              }`}
              className="tap-scale w-full py-3.5 px-5 rounded-2xl text-slate-950 font-black text-sm shadow-lg shadow-amber-500/20 hover:brightness-105 transition flex items-center justify-center gap-2 bg-gradient-to-r from-amber-500 via-orange-500 to-amber-600"
            >
              <span>🏦 Havale / FAST ile Hemen Başlat</span>
              <span>↗</span>
            </Link>

            <div className="flex items-center justify-between px-1">
              <span className="text-xs font-bold text-slate-500">7/24 Anında Onay ve Aktivasyon</span>
              <span className="text-[11px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                Komisyonsuz
              </span>
            </div>
          </>
        )}

        {/* Güven Rozetleri (Trust Badges) */}
        <div className="pt-2 grid grid-cols-3 gap-2 border-t border-slate-100 text-center">
          <div className="flex flex-col items-center gap-1">
            <ShieldCheck className="h-4 w-4 text-emerald-600" />
            <span className="text-[10px] font-bold text-slate-600">256-Bit SSL</span>
          </div>
          <div className="flex flex-col items-center gap-1">
            <Zap className="h-4 w-4 text-amber-600" />
            <span className="text-[10px] font-bold text-slate-600">Anında Erişim</span>
          </div>
          <div className="flex flex-col items-center gap-1">
            <CheckCircle2 className="h-4 w-4 text-blue-600" />
            <span className="text-[10px] font-bold text-slate-600">Kolay İptal</span>
          </div>
        </div>
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
  role: RoleKey | null;
};

function usePricingSubscription(): SubscriptionState {
  const [state, setState] = useState<SubscriptionState>({
    isPremium: false,
    isTrial: false,
    trialDaysRemaining: 0,
    isLoading: true,
    role: null,
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
            .select("*")
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
              const { data: roleData } = await supabase.from("users").select("role").eq("id", user.id).maybeSingle();
              const userRole = (roleData?.role && roleData.role in ROLE_PLANS ? roleData.role : null) as RoleKey | null;
              if (mounted) setState({ isPremium: true, isTrial: false, trialDaysRemaining: 0, isLoading: false, role: userRole });
              return;
            }
          }
        } catch {
          // silent
        }

        // 1.5. google_play_purchases kontrolü
        try {
          const { data: gpPurchases } = await (supabase.from("google_play_purchases") as unknown as {
            select: (cols: string) => {
              eq: (col: string, val: string) => {
                order: (col2: string, opts: { ascending: boolean }) => {
                  limit: (n: number) => Promise<{
                    data: Array<{
                      expiry_time?: string | null;
                    }> | null;
                  }>;
                };
              };
            };
          })
            .select("expiry_time")
            .eq("user_id", user.id)
            .order("created_at", { ascending: false })
            .limit(5);

          if (Array.isArray(gpPurchases) && gpPurchases.length > 0) {
            const now = Date.now();
            const isActive = gpPurchases.some((gp) => {
              if (!gp.expiry_time) return true;
              return new Date(gp.expiry_time).getTime() > now;
            });

            if (isActive) {
              const { data: roleData } = await supabase.from("users").select("role").eq("id", user.id).maybeSingle();
              const userRole = (roleData?.role && roleData.role in ROLE_PLANS ? roleData.role : null) as RoleKey | null;
              if (mounted) setState({ isPremium: true, isTrial: false, trialDaysRemaining: 0, isLoading: false, role: userRole });
              return;
            }
          }
        } catch {
          // silent
        }

        // 2. users tablosu: role, is_premium & created_at
        const { data: userData } = await supabase
          .from("users")
          .select("role, is_premium, created_at")
          .eq("id", user.id)
          .maybeSingle();

        const userRole = (userData?.role && userData.role in ROLE_PLANS ? userData.role : null) as RoleKey | null;

        if (userData?.is_premium === true) {
          if (mounted) setState({ isPremium: true, isTrial: false, trialDaysRemaining: 0, isLoading: false, role: userRole });
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
            role: userRole,
          });
        }
      } catch {
        if (mounted) setState({ isPremium: false, isTrial: false, trialDaysRemaining: 0, isLoading: false, role: null });
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
  const { isPremium, isTrial, trialDaysRemaining, isLoading, role: userRole } = usePricingSubscription();
  const [selectedRole, setSelectedRole] = useState<RoleKey | null>("student");

  // Kullanıcının kayıtlı rolü varsa otomatik olarak sadece kendi rolünü seç ve göster
  useEffect(() => {
    if (userRole && userRole in ROLE_PLANS) {
      setSelectedRole(userRole);
    }
  }, [userRole]);

  const [modalState, setModalState] = useState<{
    role: RoleKey;
    interval: "monthly" | "yearly";
    priceTry: number;
    planId: string;
  } | null>(null);
  const [modalLoading, setModalLoading] = useState(false);
  const [modalError, setModalError] = useState<string | null>(null);
  const [restoreLoading, setRestoreLoading] = useState(false);
  const [restoreMessage, setRestoreMessage] = useState<string | null>(null);
  const [isNativeClient, setIsNativeClient] = useState(false);

  useEffect(() => {
    setIsNativeClient(isGooglePlayBillingAvailable() || isCapacitorAndroidClient());
  }, []);

  // Auto-restore previously purchased Google Play subscriptions on Android devices
  useEffect(() => {
    let cancelled = false;

    async function attemptAutoRestore() {
      if (typeof window === "undefined" || !isGooglePlayBillingAvailable() || isPremium) return;
      try {
        const purchases = await restoreGooglePlayPurchases();
        if (cancelled || !purchases || purchases.length === 0) return;

        for (const p of purchases) {
          if (!p.purchaseToken) continue;
          const res = await fetch("/api/billing/google-play", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              planId: p.planId || "zigo-plus-student-monthly",
              productId: p.productId || "zigo-plus-student-monthly",
              purchaseToken: p.purchaseToken,
              packageName: p.packageName || "com.zigo.education",
              orderId: p.orderId,
            }),
          });
          if (res.ok && !cancelled) {
            window.location.reload();
            break;
          }
        }
      } catch {
        // Silent catch: auto-restore shouldn't interrupt regular page load
      }
    }

    if (!isLoading && !isPremium) {
      attemptAutoRestore();
    }

    return () => {
      cancelled = true;
    };
  }, [isLoading, isPremium]);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const params = new URLSearchParams(window.location.search);
    const openPlay = params.get("openPlay");
    const requestedPlan = params.get("planId");
    const requestedRole = params.get("role") as RoleKey | null;

    if (openPlay || requestedPlan || requestedRole) {
      const activeRole = userRole || (requestedRole && requestedRole in ROLE_PLANS ? requestedRole : "student");
      const targetRole: RoleKey = activeRole;
      const isYearly = Boolean(requestedPlan?.includes("yearly"));
      const interval = isYearly ? "yearly" : "monthly";
      const priceTry = isYearly ? ROLE_PLANS[targetRole].yearly : ROLE_PLANS[targetRole].monthly;
      const planId = requestedPlan || (targetRole === "teacher" 
        ? `zigo-plus-teachers-${interval}` 
        : `zigo-plus-${targetRole === "student" ? "student" : targetRole}-${interval}`);
      
      setModalState({
        role: targetRole,
        interval,
        priceTry,
        planId,
      });
    }
  }, [userRole]);

  function handleOpenModal(role: RoleKey, interval: "monthly" | "yearly") {
    setModalError(null);
    const planConfig = ROLE_PLANS[role];
    const priceTry = interval === "yearly" ? planConfig.yearly : planConfig.monthly;
    const planId = role === "teacher"
      ? `zigo-plus-teachers-${interval}`
      : role === "institution"
        ? `zigo-plus-educational-institutions-${interval}`
        : role === "platform"
          ? `zigo-plus-platform-${interval}`
          : role === "publisher"
            ? `zigo-plus-publisher-${interval}`
            : `zigo-plus-student-${interval}`;

    setModalState({
      role,
      interval,
      priceTry,
      planId,
    });
  }

  async function handleConfirmGooglePlay(isPromoApplied: boolean) {
    if (!modalState) return;
    setModalLoading(true);
    setModalError(null);

    const { planId } = modalState;
    const productId = planId;
    let purchaseToken: string | null = null;
    let orderId: string | null = null;
    let resolvedProductId = productId;
    let resolvedPackageName = "com.zigo.education";
    const offerToken = isPromoApplied ? "zigo_50_offer" : undefined;

    try {
      const nativePurchase = await purchaseGooglePlaySubscription({ productId, planId, offerToken });
      purchaseToken = nativePurchase.purchaseToken || null;
      orderId = nativePurchase.orderId || null;
      resolvedProductId = nativePurchase.productId || productId;
      resolvedPackageName = nativePurchase.packageName || "com.zigo.education";
    } catch (nativeErr) {
      const errString =
        nativeErr instanceof Error
          ? nativeErr.message
          : typeof nativeErr === "object"
            ? JSON.stringify(nativeErr)
            : String(nativeErr);
      const friendlyError = errString || "Google Play ödeme altyapısı bu cihazda doğrudan çalıştırılamadı.";
      setModalError(friendlyError);
      setModalLoading(false);
      return;
    }

    if (!purchaseToken) {
      setModalError("Google Play ödemesinden purchaseToken alınamadı.");
      setModalLoading(false);
      return;
    }

    try {
      const response = await fetch("/api/billing/google-play", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          planId,
          productId: resolvedProductId,
          purchaseToken,
          packageName: resolvedPackageName,
          orderId,
        }),
      });

      const payload = (await response.json().catch(() => null)) as {
        error?: string;
      } | null;

      if (!response.ok) {
        setModalError(payload?.error ?? "Google Play doğrulaması başarısız.");
        setModalLoading(false);
        return;
      }

      setModalState(null);
      const { triggerConfetti } = await import("@/lib/client/confetti");
      triggerConfetti();
      await new Promise((resolve) => setTimeout(resolve, 1500));
      window.location.href = "/billing/success?kind=google_play";
    } catch {
      setModalError("Sunucuya bağlanırken bir hata oluştu.");
      setModalLoading(false);
    }
  }

  async function handleFallbackCheckout() {
    if (!modalState) return;
    try {
      setModalLoading(true);
      const response = await fetch("/api/billing/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ planId: modalState.planId }),
      });
      const result = await response.json();
      const checkoutUrl = result?.data?.url ?? result?.checkoutUrl;
      if (checkoutUrl) {
        window.location.href = checkoutUrl;
      } else {
        setModalError(result?.error || "Ödeme oturumu açılamadı.");
      }
    } catch {
      setModalError("Ödeme servisine bağlanırken bir hata oluştu.");
    } finally {
      setModalLoading(false);
    }
  }

  async function handleRestorePurchases() {
    setRestoreLoading(true);
    setRestoreMessage(null);
    try {
      const purchases = await restoreGooglePlayPurchases();
      if (!purchases || purchases.length === 0) {
        setRestoreMessage("Google Play hesabınızda aktif bir abonelik bulunamadı.");
        setRestoreLoading(false);
        return;
      }

      let activated = false;
      for (const p of purchases) {
        if (!p.purchaseToken) continue;
        const res = await fetch("/api/billing/google-play", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            planId: p.planId || "zigo-plus-student-monthly",
            productId: p.productId || "zigo-plus-student-monthly",
            purchaseToken: p.purchaseToken,
            packageName: p.packageName || "com.zigo.education",
            orderId: p.orderId,
          }),
        });
        if (res.ok) {
          activated = true;
        }
      }

      if (activated) {
        const { triggerConfetti } = await import("@/lib/client/confetti");
        triggerConfetti();
        await new Promise((resolve) => setTimeout(resolve, 1000));
        window.location.href = "/billing/success?kind=google_play";
      } else {
        setRestoreMessage("Google Play aboneliği sunucuya aktarılamadı.");
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      setRestoreMessage(msg || "Geri yükleme başarısız.");
    } finally {
      setRestoreLoading(false);
    }
  }

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-4 border-violet-600 border-t-transparent"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50">
      <header className="relative overflow-hidden border-b border-slate-100 bg-gradient-to-b from-white via-slate-50/50 to-slate-100/30">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-amber-200/20 via-transparent to-transparent pointer-events-none" />
        <div className="max-w-6xl mx-auto px-4 py-12 sm:px-6 lg:px-8 relative">
          <div className="max-w-3xl mx-auto text-center">
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-tr from-amber-500 via-orange-500 to-amber-600 text-white shadow-xl shadow-amber-500/20">
              <Crown className="h-8 w-8" />
            </div>
            
            <h1 className="mt-6 text-3xl sm:text-4xl md:text-5xl font-black tracking-tight text-night">
              {userRole === "parent"
                ? "Çocuğunuzun Başarısını Zigo Plus ile Zirveye Taşıyın"
                : userRole === "student"
                  ? "Sınavlara Hazırlık ve Zeka Oyunları Dünyası Seni Bekliyor"
                  : userRole === "teacher"
                    ? "İçerik Stüdyosu ve Özel Ders Talepleriyle Fark Yaratın"
                    : "Zigo Plus Ayrıcalıkları"}
            </h1>
            
            <p className="mt-4 text-base sm:text-lg font-bold text-slate-600">
              {userRole
                ? "Hesabınıza özel avantajlı plan. İlk 7 gün içinde %50 indirim fırsatı!"
                : "Rolünüze göre özel fiyatlandırma. İlk 7 gün içinde %50 indirim (Promo: ZIGO50)"}
            </p>
            
            {isTrial && trialDaysRemaining > 0 && (
              <div className="mt-5 inline-flex items-center gap-2.5 rounded-full bg-amber-500/10 px-4 py-2 text-sm font-black text-amber-800 border border-amber-500/30 shadow-sm backdrop-blur-md">
                <span className="flex h-6 w-6 items-center justify-center rounded-full bg-amber-400 text-night text-xs">⏳</span>
                <span>7 Günlük Denemenizin Bitmesine <strong>{trialDaysRemaining} Gün Kaldı</strong> (%50 İndirim Fırsatı)</span>
              </div>
            )}

            {isNativeClient && (
              <div className="mt-6 flex flex-col items-center justify-center gap-2">
                <button
                  type="button"
                  onClick={handleRestorePurchases}
                  disabled={restoreLoading}
                  className="tap-scale inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-4 py-2 text-xs font-black text-slate-700 shadow-sm transition hover:bg-slate-50 disabled:opacity-60"
                >
                  <span>🔄</span>
                  <span>{restoreLoading ? "Google Play Kontrol Ediliyor…" : "Mevcut Google Play Aboneliğimi Senkronize Et"}</span>
                </button>
                {restoreMessage && (
                  <p className="text-xs font-bold text-amber-700">{restoreMessage}</p>
                )}
              </div>
            )}
          </div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-4 py-12 sm:px-6 lg:px-8">
        {userRole && userRole in ROLE_PLANS ? (
          <div className="mx-auto max-w-md">
            <PlanCard
              isCurrentRole={true}
              isSelected={true}
              key={userRole}
              onOpenModal={handleOpenModal}
              onSelect={setSelectedRole}
              role={userRole}
            />
          </div>
        ) : (
          <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-3">
            {Object.keys(ROLE_PLANS).map((role) => (
              <PlanCard
                isCurrentRole={false}
                isSelected={selectedRole === role}
                key={role}
                onOpenModal={handleOpenModal}
                onSelect={setSelectedRole}
                role={role as RoleKey}
              />
            ))}
          </div>
        )}

        {!userRole && <FeatureMatrix />}

        <section className="mt-12 -mx-4 border-y border-slate-100 bg-white px-4 py-8">
          <h2 className="text-xl font-black text-night mb-6 text-center">Sık Sorulan Sorular</h2>
          <dl className="space-y-4 max-w-3xl mx-auto">
            <div className="border border-slate-200 rounded-xl p-4">
              <dt className="font-black text-night mb-1">7 günlük deneme nasıl çalışıyor?</dt>
              <dd className="text-slate-600">Kayıttan sonraki ilk 7 gün boyunca tüm Zigo Plus özelliklerini ücretsiz deneyebilirsiniz. 7 gün dolmadan önce abonelik başlatırsanız %50 indirimli fiyat uygulanır.</dd>
            </div>
            <div className="border border-slate-200 rounded-xl p-4">
              <dt className="font-black text-night mb-1">%50 indirim nasıl uygulanır?</dt>
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

      {modalState && (
        <GooglePlaySubscriptionModal
          basePriceTry={modalState.priceTry}
          errorMessage={modalError}
          isOpen={Boolean(modalState)}
          isWithinTrialWindow={isTrial}
          loading={modalLoading}
          onClose={() => {
            if (!modalLoading) setModalState(null);
          }}
          onConfirm={handleConfirmGooglePlay}
          onFallbackCheckout={handleFallbackCheckout}
          planId={modalState.planId}
          selectedInterval={modalState.interval}
        />
      )}
    </div>
  );
}
