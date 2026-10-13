"use client";

import {
  Bell,
  Compass,
  Crown,
  Download,
  Film,
  Gamepad2,
  GraduationCap,
  HelpCircle,
  Home,
  MessageSquare,
  Plus,
  Shield,
  ShoppingBag,
  Sparkles,
  User,
  Users,
} from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";

import type { ViewerRole } from "@/lib/domain/role-theme";
import { useMessages } from "@/lib/i18n/locale-context";
import { ZIGO_PATHS } from "@/lib/zigo-vocabulary";

type DesktopSidebarProps = {
  canCreateSocialPost?: boolean;
  isPlatformAdmin?: boolean;
  roleAccentLabel: string;
  teacherInboxCount?: number;
  unreadCount: number;
  viewerRole: ViewerRole;
};

export function DesktopSidebar({
  canCreateSocialPost = false,
  isPlatformAdmin = false,
  roleAccentLabel,
  teacherInboxCount = 0,
  unreadCount = 0,
  viewerRole,
}: DesktopSidebarProps) {
  const pathname = usePathname();
  const m = useMessages();
  const [installPrompt, setInstallPrompt] = useState<any>(null);
  const [isInstalled, setIsInstalled] = useState(false);

  useEffect(() => {
    if (typeof window !== "undefined") {
      if (window.matchMedia("(display-mode: standalone)").matches) {
        setIsInstalled(true);
      }

      const handleBeforeInstallPrompt = (e: Event) => {
        e.preventDefault();
        setInstallPrompt(e);
      };

      const handleAppInstalled = () => {
        setIsInstalled(true);
        setInstallPrompt(null);
      };

      window.addEventListener("beforeinstallprompt", handleBeforeInstallPrompt);
      window.addEventListener("appinstalled", handleAppInstalled);

      return () => {
        window.removeEventListener("beforeinstallprompt", handleBeforeInstallPrompt);
        window.removeEventListener("appinstalled", handleAppInstalled);
      };
    }
  }, []);

  const handleInstallClick = async () => {
    if (installPrompt) {
      await installPrompt.prompt();
      const choice = await installPrompt.userChoice;
      if (choice?.outcome === "accepted") {
        setIsInstalled(true);
      }
      setInstallPrompt(null);
    } else {
      if (typeof window !== "undefined") {
        window.alert(
          "Zigo'yu masaüstü uygulaması olarak yüklemek için tarayıcınızın adres çubuğundaki (veya ayarlar menüsündeki) 'Uygulamayı Yükle' simgesini tıklayabilirsiniz."
        );
      }
    }
  };

  // Primary navigation items
  const mainNavItems = [
    {
      name: "Ana Sayfa",
      href: "/",
      icon: Home,
      isActive: pathname === "/",
    },
    {
      name: "Keşfet",
      href: "/explore",
      icon: Compass,
      isActive: pathname.startsWith("/explore"),
    },
    {
      name: "Reels & Kısa Ders",
      href: ZIGO_PATHS.micro,
      icon: Film,
      isActive: pathname.startsWith(ZIGO_PATHS.micro),
    },
    {
      name: "Zeka Oyunları",
      href: "/games",
      icon: Gamepad2,
      isActive: pathname.startsWith("/games"),
    },
    {
      name: "Zigo Mağaza",
      href: "/store",
      icon: ShoppingBag,
      isActive: pathname.startsWith("/store"),
    },
  ];

  // Role-specific workspace links
  const roleNavItems = [];

  if (viewerRole === "student") {
    roleNavItems.push(
      {
        name: "Öğrenci Paneli",
        href: "/student",
        icon: GraduationCap,
        isActive: pathname.startsWith("/student"),
      },
      {
        name: "Ders & Çalışma",
        href: "/learn",
        icon: Sparkles,
        isActive: pathname.startsWith("/learn"),
      },
      {
        name: "Soru Sor",
        href: "/questions",
        icon: HelpCircle,
        isActive: pathname.startsWith("/questions"),
      },
    );
  } else if (
    viewerRole === "teacher" ||
    viewerRole === "education_institution" ||
    viewerRole === "education_platform" ||
    viewerRole === "publisher"
  ) {
    roleNavItems.push(
      {
        name: "Öğretmen Stüdyosu",
        href: "/teacher",
        icon: Sparkles,
        isActive: pathname.startsWith("/teacher") && !pathname.startsWith("/teacher/lessons"),
      },
      {
        name: "Ders Talepleri",
        href: "/teacher/lessons",
        icon: MessageSquare,
        badge: teacherInboxCount > 0 ? teacherInboxCount : undefined,
        isActive: pathname.startsWith("/teacher/lessons"),
      },
      {
        name: "Topluluk Soruları",
        href: "/questions",
        icon: HelpCircle,
        isActive: pathname.startsWith("/questions"),
      },
    );
  } else if (viewerRole === "parent") {
    roleNavItems.push(
      {
        name: "Veli Paneli",
        href: "/parent",
        icon: Users,
        isActive: pathname.startsWith("/parent"),
      },
      {
        name: "Aile & Çocuklar",
        href: "/family",
        icon: GraduationCap,
        isActive: pathname.startsWith("/family"),
      },
      {
        name: "Öğretmen Bul",
        href: "/teacher/lessons",
        icon: MessageSquare,
        isActive: pathname.startsWith("/teacher/lessons"),
      },
    );
  }

  // Account links
  const accountNavItems = [
    {
      name: "Bildirimler",
      href: "/notifications",
      icon: Bell,
      badge: unreadCount > 0 ? unreadCount : undefined,
      isActive: pathname.startsWith("/notifications"),
    },
    {
      name: "Profilim",
      href: "/profile",
      icon: User,
      isActive: pathname.startsWith("/profile"),
    },
  ];

  if (isPlatformAdmin) {
    accountNavItems.push({
      name: "Yönetici Paneli",
      href: "/admin",
      icon: Shield,
      badge: undefined,
      isActive: pathname.startsWith("/admin"),
    });
  }

  return (
    <aside
      aria-label="Masaüstü Gezinme Menüsü"
      className="hidden lg:flex flex-col w-64 shrink-0 sticky top-4 h-[calc(100vh-2rem)] select-none"
    >
      <div className="flex flex-col h-full rounded-3xl border border-slate-200/80 bg-white/95 p-4 shadow-sm backdrop-blur-xl justify-between overflow-y-auto no-scrollbar">
        {/* Brand Header */}
        <div className="space-y-4">
          <div className="flex items-center justify-between px-2 pt-1">
            <Link href="/" className="tap-scale flex items-center gap-2 group">
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-tr from-[#0047FF] to-violet-600 text-white font-black text-lg shadow-md group-hover:scale-105 transition-transform">
                Z
              </div>
              <span className="text-2xl font-black tracking-tight text-night">Zigo</span>
            </Link>

            {roleAccentLabel ? (
              <span className="inline-flex items-center rounded-full bg-slate-100 px-2.5 py-0.5 text-[11px] font-black text-slate-700">
                {roleAccentLabel}
              </span>
            ) : null}
          </div>

          {/* Quick Create CTA (Teachers/Creators) */}
          {canCreateSocialPost || isPlatformAdmin ? (
            <Link
              href="/create"
              className="tap-scale flex w-full items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-[#0047FF] to-violet-600 px-4 py-3 text-sm font-black text-white shadow-md hover:brightness-105 transition active:scale-95"
            >
              <Plus className="h-4 w-4" />
              <span>Yeni Paylaşım</span>
            </Link>
          ) : viewerRole === "student" ? (
            <Link
              href="/create"
              className="tap-scale flex w-full items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-violet-600 to-fuchsia-600 px-4 py-2.5 text-xs font-black text-white shadow-sm hover:brightness-105 transition active:scale-95"
            >
              <Sparkles className="h-3.5 w-3.5" />
              <span>Soru & Not Paylaş</span>
            </Link>
          ) : null}

          {/* Main Navigation */}
          <nav className="space-y-1">
            <p className="px-3 text-[10px] font-black uppercase tracking-wider text-slate-400">
              Gezinme
            </p>
            <div className="space-y-0.5 pt-1">
              {mainNavItems.map((item) => (
                <NavLink key={item.href} {...item} />
              ))}
            </div>
          </nav>

          {/* Role Navigation */}
          {roleNavItems.length > 0 ? (
            <nav className="space-y-1 pt-2 border-t border-slate-100">
              <p className="px-3 text-[10px] font-black uppercase tracking-wider text-slate-400">
                Çalışma Alanım
              </p>
              <div className="space-y-0.5 pt-1">
                {roleNavItems.map((item) => (
                  <NavLink key={item.href} {...item} />
                ))}
              </div>
            </nav>
          ) : null}

          {/* Account & Platform Navigation */}
          <nav className="space-y-1 pt-2 border-t border-slate-100">
            <p className="px-3 text-[10px] font-black uppercase tracking-wider text-slate-400">
              Hesabım
            </p>
            <div className="space-y-0.5 pt-1">
              {accountNavItems.map((item) => (
                <NavLink key={item.href} {...item} />
              ))}
            </div>
          </nav>
        </div>

        {/* Bottom Card: Zigo Plus Promo */}
        <div className="mt-4 pt-3 border-t border-slate-100 space-y-3">
          <div className="rounded-2xl border border-violet-100 bg-gradient-to-br from-violet-50/80 via-white to-fuchsia-50/80 p-3.5 shadow-xs">
            <div className="flex items-center gap-1.5 text-violet-700">
              <Crown className="h-4 w-4" />
              <span className="text-xs font-black uppercase tracking-wider">Zigo Plus</span>
            </div>
            <p className="mt-1 text-xs font-black text-night leading-tight">
              Ayrıcalıkları Keşfet
            </p>
            <p className="mt-0.5 text-[11px] font-semibold text-slate-500">
              7 gün ücretsiz deneme & %50 fırsat.
            </p>
            <Link
              href="/pricing"
              className="tap-scale mt-2.5 block text-center rounded-xl bg-gradient-to-r from-violet-600 to-indigo-600 px-3 py-1.5 text-xs font-black text-white shadow-xs hover:brightness-105 transition"
            >
              Planları Gör ✨
            </Link>
          </div>

          {!isInstalled && (
            <button
              type="button"
              onClick={handleInstallClick}
              className="tap-scale flex w-full items-center justify-center gap-1.5 rounded-xl border border-slate-200 bg-slate-50/80 py-2 text-xs font-bold text-slate-700 hover:bg-slate-100 transition shadow-2xs"
              title="Zigo'yu masaüstüne yükleyin"
            >
              <Download className="size-3.5 text-indigo-600" />
              <span>Masaüstüne Yükle (PWA)</span>
            </button>
          )}

          <div className="px-2 flex items-center justify-between text-[11px] font-bold text-slate-400">
            <span>Zigo v1.3.5</span>
            <div className="flex gap-2">
              <Link href="/legal/terms" className="hover:text-slate-600">Koşullar</Link>
              <span>·</span>
              <Link href="/legal/privacy" className="hover:text-slate-600">Gizlilik</Link>
            </div>
          </div>
        </div>
      </div>
    </aside>
  );
}

function NavLink({
  name,
  href,
  icon: Icon,
  isActive,
  badge,
}: {
  name: string;
  href: string;
  icon: React.ComponentType<{ className?: string }>;
  isActive: boolean;
  badge?: number;
}) {
  return (
    <Link
      href={href}
      className={`tap-scale group relative flex items-center justify-between rounded-2xl px-3.5 py-2.5 text-sm font-bold transition-all ${
        isActive
          ? "bg-violet-50 text-[#0047FF] shadow-xs font-black"
          : "text-slate-600 hover:bg-slate-50 hover:text-night"
      }`}
    >
      <div className="flex items-center gap-3">
        <Icon
          className={`h-4.5 w-4.5 transition-transform group-hover:scale-110 ${
            isActive ? "text-[#0047FF]" : "text-slate-400 group-hover:text-slate-600"
          }`}
        />
        <span className="truncate">{name}</span>
      </div>

      {badge ? (
        <span className="flex h-5 min-w-5 items-center justify-center rounded-full bg-rose-500 px-1.5 text-[10px] font-black text-white">
          {badge > 9 ? "9+" : badge}
        </span>
      ) : null}

      {isActive ? (
        <span className="absolute left-0 top-1/2 -translate-y-1/2 h-5 w-1 rounded-r-full bg-[#0047FF]" />
      ) : null}
    </Link>
  );
}
