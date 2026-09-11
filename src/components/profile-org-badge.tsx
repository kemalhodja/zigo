import { Building2, GraduationCap, School, BookOpen, Globe2, Sparkles } from "lucide-react";
import type { EducationOrganizationType } from "@/lib/domain/education-organization";

type ProfileOrgBadgeProps = {
  organizationType?: string | null;
  role?: string;
  isVerified?: boolean;
  className?: string;
};

export function ProfileOrgBadge({
  organizationType,
  role,
  isVerified = false,
  className = "",
}: ProfileOrgBadgeProps) {
  const isTeacher = role === "teacher";
  const orgType = organizationType as EducationOrganizationType | undefined;

  if (!orgType && !isTeacher) return null;

  const configMap: Record<
    string,
    {
      title: string;
      desc: string;
      icon: typeof Building2;
      badgeStyle: string;
      pillText: string;
      gradient: string;
    }
  > = {
    kurs: {
      title: "Resmî Kurs & Hazırlık Merkezi",
      desc: "LGS, YKS ve okul takviye programları sunan onaylı kurs kurumu.",
      icon: School,
      badgeStyle: "bg-indigo-50/80 border-indigo-200/80 text-indigo-900",
      pillText: "🏫 KURUMSAL KURS",
      gradient: "from-indigo-600 to-blue-500",
    },
    okul: {
      title: "Resmî Okul & Kampüs",
      desc: "Müfredat onaylı öğrenci ve öğretmen topluluğu barındıran okul hesabı.",
      icon: GraduationCap,
      badgeStyle: "bg-emerald-50/80 border-emerald-200/80 text-emerald-900",
      pillText: "🏛️ RESMÎ OKUL",
      gradient: "from-emerald-600 to-teal-500",
    },
    egitim_kurumu: {
      title: "Akredite Eğitim Kurumu",
      desc: "Özel eğitim programları ve grup çalışmaları sağlayan kurumsal eğitim merkezi.",
      icon: Building2,
      badgeStyle: "bg-cyan-50/80 border-cyan-200/80 text-cyan-900",
      pillText: "🏢 EĞİTİM KURUMU",
      gradient: "from-cyan-600 to-sky-500",
    },
    egitim_platformu: {
      title: "Dijital Eğitim Platformu",
      desc: "Çevrim içi canlı dersler, soru çözümleri ve video içerik sağlayan yayıncı platform.",
      icon: Globe2,
      badgeStyle: "bg-violet-50/80 border-violet-200/80 text-violet-900",
      pillText: "🌐 EĞİTİM PLATFORMU",
      gradient: "from-violet-600 to-purple-500",
    },
    yayinevi: {
      title: "Onaylı Eğitim Yayınevi",
      desc: "Soru bankaları, deneme sınavları ve yeni nesil MEB müfredatına uygun yayın havuzu.",
      icon: BookOpen,
      badgeStyle: "bg-amber-50/80 border-amber-200/80 text-amber-900",
      pillText: "📚 EĞİTİM YAYINEVİ",
      gradient: "from-amber-500 to-orange-500",
    },
  };

  const config = orgType ? configMap[orgType] : null;

  if (config) {
    const Icon = config.icon;
    return (
      <div className={`mt-3 overflow-hidden rounded-2xl border p-3.5 shadow-xs transition-all hover:shadow-md ${config.badgeStyle} ${className}`}>
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className={`flex size-9 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br ${config.gradient} text-white shadow-sm`}>
              <Icon className="size-5" />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-1.5 flex-wrap">
                <span className="text-xs font-black tracking-wide text-night truncate">{config.title}</span>
                {isVerified ? (
                  <span className="inline-flex items-center gap-0.5 rounded-full bg-crystal/10 px-1.5 py-0.5 text-[9px] font-black text-crystal">
                    <Sparkles className="size-2.5" />
                    Onaylı Hesap
                  </span>
                ) : null}
              </div>
              <p className="mt-0.5 text-[11px] font-medium leading-normal text-slate-600 line-clamp-2">
                {config.desc}
              </p>
            </div>
          </div>
          <span className="hidden shrink-0 rounded-lg bg-white/90 px-2 py-1 text-[10px] font-black tracking-wider shadow-xs sm:inline-block">
            {config.pillText}
          </span>
        </div>
      </div>
    );
  }

  if (isTeacher && isVerified) {
    return (
      <div className={`mt-3 flex items-center justify-between rounded-xl border border-sky-200/80 bg-gradient-to-r from-sky-50 via-indigo-50/40 to-white p-3 shadow-xs ${className}`}>
        <div className="flex items-center gap-2.5">
          <div className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-sky-500 text-white shadow-xs">
            <GraduationCap className="size-4" />
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <span className="text-xs font-black text-slate-900">Doğrulanmış Uzman Öğretmen</span>
              <span className="rounded-md bg-sky-100 px-1.5 py-0.5 text-[9px] font-black text-sky-700">✓ Onaylı</span>
            </div>
            <p className="text-[11px] font-medium text-slate-600">
              MEB ve akademik pedagojik kriterleri doğrulanmış Zigo eğitmeni.
            </p>
          </div>
        </div>
      </div>
    );
  }

  return null;
}
