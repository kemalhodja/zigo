"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { type ReactNode,useEffect, useState } from "react";

import { BackButton } from "@/components/back-button";
import { BottomNav } from "@/components/bottom-nav";
import { CookieConsentBanner } from "@/components/cookie-consent-banner";
import { FirstLaunchWelcome } from "@/components/first-launch-welcome";
import { LegalFooter } from "@/components/legal-footer";
import { PullToRefresh } from "@/components/pull-to-refresh";
import { RegistrationCampaignAnnouncement } from "@/components/registration-campaign-announcement";
import { RoleNextActionBar } from "@/components/role-next-action-bar";
import { ScrollToTopOnLogoTap } from "@/components/scroll-to-top-on-logo-tap";
import { useStreakTracker } from "@/hooks/use-streak-tracker";
import {
  getHeaderPrimaryAction,
  isParentSupervisionRole,
  isStudentGamificationRole,
  isTeacherStudioRole,
} from "@/lib/domain/role-navigation";
import { getRoleThemeClass, type ViewerRole } from "@/lib/domain/role-theme";
import { useMessages } from "@/lib/i18n/locale-context";

type AppShellProps = {
  canCreateSocialPost: boolean;
  children: ReactNode;
  isPreviewMode?: boolean;
  isPlatformAdmin?: boolean;
  roleAccentLabel: string;
  teacherInboxCount?: number;
  unreadCount: number;
  viewerRole: ViewerRole;
};

export function AppShell({
  canCreateSocialPost,
  children,
  isPreviewMode = false,
  isPlatformAdmin = false,
  roleAccentLabel,
  teacherInboxCount = 0,
  unreadCount: initialUnreadCount,
  viewerRole,
}: AppShellProps) {
  const pathname = usePathname();
  const _router = useRouter();
  const m = useMessages();
  const [unreadCount, setUnreadCount] = useState(initialUnreadCount);

  // Gamification: Track daily login streak automatically
  useStreakTracker();

  useEffect(() => {
    setUnreadCount(initialUnreadCount);
  }, [initialUnreadCount]);

  useEffect(() => {
    if (pathname === "/notifications") {
      setUnreadCount(0);
    }
  }, [pathname]);

  useEffect(() => {
    const handleUnreadUpdate = (event: Event) => {
      const customEvent = event as CustomEvent<{ count?: number }>;
      if (typeof customEvent.detail?.count === "number") {
        setUnreadCount(customEvent.detail.count);
      } else {
        setUnreadCount(0);
      }
    };

    window.addEventListener("zigo:unread-count-updated", handleUnreadUpdate);
    window.addEventListener("zigo:notifications-read", handleUnreadUpdate);

    return () => {
      window.removeEventListener("zigo:unread-count-updated", handleUnreadUpdate);
      window.removeEventListener("zigo:notifications-read", handleUnreadUpdate);
    };
  }, []);

  // Capacitor / Mobile hardware back button listener
  useEffect(() => {
    if (typeof window === "undefined") return;

    let cleanup: (() => void) | undefined;
    const setupHardwareBack = async () => {
      try {
        const win = window as unknown as {
          Capacitor?: {
            Plugins?: {
              App?: {
                addListener: (
                  event: string,
                  fn: (data: { canGoBack: boolean }) => void
                ) => Promise<{ remove: () => void }>;
                exitApp: () => Promise<void>;
              };
            };
          };
        };

        let appPlugin = win.Capacitor?.Plugins?.App;

        if (!appPlugin) {
          try {
            const appModule = await import("@capacitor/app");
            appPlugin = appModule.App;
          } catch {
            // Native back listener fallback
          }
        }

        if (!appPlugin) return;

        const handle = await appPlugin.addListener("backButton", ({ canGoBack }: { canGoBack: boolean }) => {
          const currentPath = window.location.pathname;
          
          // Ana ekranlarda geriye basılınca uygulamadan çıkılsın
          if (
            currentPath === "/" || 
            currentPath === "/auth" ||
            currentPath === "/student" ||
            currentPath === "/teacher" ||
            currentPath === "/parent" ||
            currentPath === "/explore"
          ) {
            void appPlugin.exitApp();
          } else {
            // Diğer sayfalarda Next.js router üzerinden bir öncekine dön
            _router.back();
          }
        });

        cleanup = () => {
          if (handle && typeof handle.remove === "function") {
            void handle.remove();
          }
        };
      } catch {
        // Native back listener fallback
      }
    };

    void setupHardwareBack();
    return () => {
      if (cleanup) cleanup();
    };
  }, [_router, pathname]);

  const isStories = pathname.startsWith("/sparks");
  const isReels = pathname.startsWith("/micro");
  const isPost = pathname.startsWith("/post");
  const isImmersive = isStories || isReels || isPost;
  const hideQuickDock =
    isImmersive ||
    pathname === "/" ||
    pathname.startsWith("/auth") ||
    pathname.startsWith("/create") ||
    pathname.startsWith("/questions") ||
    pathname.startsWith("/setup") ||
    pathname.startsWith("/learn") ||
    pathname.startsWith("/teacher") ||
    pathname.startsWith("/parent") ||
    pathname.startsWith("/student");

  return (
    <div
      className={`safe-screen safe-x zigo-shell-bg mx-auto flex w-full min-w-0 max-w-md flex-col overflow-x-hidden md:my-6 md:min-h-[calc(100vh-3rem)] md:overflow-hidden md:rounded-[2rem] md:border md:border-slate-200/80 md:shadow-[0_28px_100px_rgb(15_23_42_/_0.18)] ${getRoleThemeClass(viewerRole)} ${
        isImmersive ? "relative bg-night" : ""
      }`}
    >
      {isPreviewMode ? <PreviewModeBanner /> : null}
      {isImmersive ? null : <Header canCreateSocialPost={canCreateSocialPost} isPlatformAdmin={isPlatformAdmin} roleAccentLabel={roleAccentLabel} unreadCount={unreadCount} viewerRole={viewerRole} />}

      {!isImmersive ? (
        <a
          className="sr-only z-50 rounded-lg bg-night px-4 py-2 text-sm font-black text-white focus:not-sr-only focus:absolute focus:left-4 focus:top-4"
          data-testid="skip-to-content"
          href="#main-content"
        >
          {m.nav.skipToContent}
        </a>
      ) : null}

      <main
        key={pathname}
        className={`min-w-0 flex-1 page-transition-fade ${isImmersive ? "overflow-hidden p-0" : "px-4 py-3 pb-[calc(4.5rem+env(safe-area-inset-bottom,0px))] md:pb-6"}`}
        id="main-content"
      >
        {!isImmersive && !pathname.startsWith("/auth") && !isPlatformAdmin ? (
          <RoleNextActionBar canCreateSocialPost={canCreateSocialPost} viewerRole={viewerRole} />
        ) : null}
        {children}
      </main>

      {hideQuickDock || isPlatformAdmin ? null : (
        <QuickActionDock canCreateSocialPost={canCreateSocialPost} viewerRole={viewerRole} />
      )}

      {pathname.startsWith("/auth") ? <LegalFooter /> : null}

      {isImmersive || pathname.startsWith("/auth") ? null : <CookieConsentBanner />}

      {isStories ? null : (
        <div className={isReels ? "absolute inset-x-0 bottom-0 z-20" : ""}>
          <BottomNav
            canCreateSocialPost={canCreateSocialPost}
            isPlatformAdmin={isPlatformAdmin}
            teacherInboxCount={teacherInboxCount}
            unreadCount={unreadCount}
            variant={isReels ? "overlay" : "default"}
            viewerRole={viewerRole}
          />
        </div>
      )}

      <FirstLaunchWelcome />
      {pathname.startsWith("/auth") ? null : <RegistrationCampaignAnnouncement />}
      <PullToRefresh />
      <ScrollToTopOnLogoTap />
    </div>
  );
}

function QuickActionDock({
  canCreateSocialPost,
  viewerRole,
}: {
  canCreateSocialPost: boolean;
  viewerRole: ViewerRole;
}) {
  const m = useMessages();
  const dock = m.dockByRole;

  if (isStudentGamificationRole(viewerRole)) {
    return (
      <section className="role-dock-student premium-action-dock relative mx-3 mb-2 overflow-hidden rounded-2xl border border-violet-100 bg-white/95 p-2 backdrop-blur">
        <div className="flex flex-wrap justify-center gap-1.5">
          <Link className="zigo-compact-pill tap-scale rounded-xl bg-gradient-to-r from-crystal to-fuchsia-500 text-white" href="/student">
            {dock.student.hub}
          </Link>
          <Link className="zigo-compact-pill tap-scale rounded-xl bg-slate-100 text-night" href="/learn">
            {dock.student.learn}
          </Link>
        </div>
      </section>
    );
  }

  if (isParentSupervisionRole(viewerRole)) {
    return (
      <section className="role-dock-parent premium-action-dock relative mx-3 mb-2 overflow-hidden rounded-2xl border border-cyan-100 bg-white/95 p-2 backdrop-blur">
        <div className="flex flex-wrap justify-center gap-1.5">
          <Link className="zigo-compact-pill tap-scale rounded-xl bg-gradient-to-r from-aqua to-cyan-600 text-white" href="/parent">
            {dock.parent.hub}
          </Link>
          <Link className="zigo-compact-pill tap-scale rounded-xl bg-slate-100 text-night" href="/family">
            {dock.parent.family}
          </Link>
          <Link className="zigo-compact-pill tap-scale rounded-xl bg-slate-100 text-night" href="/store">
            {dock.parent.rewards}
          </Link>
          <Link className="zigo-compact-pill tap-scale rounded-xl bg-slate-100 text-night" href="/questions">
            {dock.parent.ask}
          </Link>
        </div>
      </section>
    );
  }

  if (isTeacherStudioRole(viewerRole)) {
    return (
      <section className="role-dock-teacher premium-action-dock relative mx-3 mb-2 overflow-hidden rounded-2xl border border-slate-200 bg-white/95 p-2 backdrop-blur">
        <div className="flex flex-wrap justify-center gap-1.5">
          {canCreateSocialPost ? (
            <>
              <Link className="zigo-compact-pill tap-scale rounded-xl bg-night text-white" href="/create">
                {m.header.create}
              </Link>
              <Link className="zigo-compact-pill tap-scale rounded-xl bg-slate-100 text-night" href="/create?mode=micro">
                {dock.teacher.micro}
              </Link>
            </>
          ) : null}
          <Link className="zigo-compact-pill tap-scale rounded-xl bg-slate-100 text-night" href="/teacher">
            {dock.teacher.studio}
          </Link>
          <Link className="zigo-compact-pill tap-scale rounded-xl bg-slate-100 text-night" href="/questions">
            {dock.teacher.ask}
          </Link>
        </div>
      </section>
    );
  }

  return (
    <section className="premium-action-dock relative mx-3 mb-2 overflow-hidden rounded-2xl border border-violet-100 bg-white/95 p-2 backdrop-blur">
      <div className="flex flex-wrap justify-center gap-1.5">
        <Link className="zigo-compact-pill tap-scale rounded-xl bg-gradient-to-r from-crystal to-fuchsia-500 text-white" href="/auth">
          {m.common.signIn}
        </Link>
        <Link className="zigo-compact-pill tap-scale rounded-xl bg-slate-100 text-night" href="/explore">
          {m.nav.search}
        </Link>
      </div>
    </section>
  );
}

function Header({
  canCreateSocialPost,
  isPlatformAdmin = false,
  roleAccentLabel,
  unreadCount,
  viewerRole,
}: {
  canCreateSocialPost: boolean;
  isPlatformAdmin?: boolean;
  roleAccentLabel: string;
  unreadCount: number;
  viewerRole: ViewerRole;
}) {
  const m = useMessages();
  const h = m.header;
  const pathname = usePathname();
  const _router = useRouter();
  const primaryAction = getHeaderPrimaryAction(viewerRole, canCreateSocialPost, { isPlatformAdmin });
  const isHomePage = pathname === "/";

  return (
    <header className="safe-top zigo-topbar sticky top-0 z-10 min-w-0 px-4 py-2">
      <div className="flex min-w-0 items-center justify-between gap-2">
        <div className="flex min-w-0 items-center gap-2">
          {!isHomePage ? <BackButton fallbackHref="/" /> : null}
          <LogoLink roleAccentLabel={roleAccentLabel} viewerRole={viewerRole} />
        </div>

        <div className="flex shrink-0 items-center gap-2">
          <Link
            aria-label="Ders Talepleri"
            className="tap-scale flex size-9 items-center justify-center text-night transition hover:text-crystal"
            href="/teacher/lessons"
            title="Ders Talepleri"
          >
            <svg aria-hidden="true" className="size-6" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
              <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
            </svg>
          </Link>

          <Link
            aria-label={primaryAction.isAdmin ? "Yönetici Paneli" : primaryAction.isCreate ? h.create : h.askQuestion}
            className="tap-scale flex size-9 items-center justify-center text-night transition hover:text-crystal"
            href={primaryAction.href}
          >
            {primaryAction.isAdmin ? (
              <svg aria-hidden="true" className="size-6" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
              </svg>
            ) : primaryAction.isCreate ? (
              <svg aria-hidden="true" className="size-6" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                <rect height="18" rx="5" width="18" x="3" y="3" />
                <path d="M12 8v8" />
                <path d="M8 12h8" />
              </svg>
            ) : (
              <svg aria-hidden="true" className="size-6" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                <path d="M21 12a8.5 8.5 0 0 1-9 8.5 9.6 9.6 0 0 1-4.2-.95L3 20.5l1.3-4A8.5 8.5 0 1 1 21 12z" />
                <path d="M12 8v4" />
                <path d="M12 16h.01" />
              </svg>
            )}
          </Link>
          <Link aria-label={h.notifications} className="tap-scale relative flex size-9 items-center justify-center text-night transition hover:text-berry" href="/notifications">
            <svg aria-hidden="true" className="size-6" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
              <path d="M15 17h5l-1.4-1.4A2 2 0 0 1 18 14.2V11a6 6 0 1 0-12 0v3.2c0 .5-.2 1-.6 1.4L4 17h5" />
              <path d="M9.5 17a2.5 2.5 0 0 0 5 0" />
            </svg>
            {unreadCount > 0 ? (
              <span className="zigo-badge-count absolute -right-2 -top-2 flex size-5 items-center justify-center rounded-full bg-rose-500 text-white">
                {unreadCount > 9 ? "9+" : unreadCount}
              </span>
            ) : null}
          </Link>

        </div>
      </div>
    </header>
  );
}

function LogoLink({ roleAccentLabel, viewerRole }: { roleAccentLabel: string; viewerRole: ViewerRole }) {
  const pathname = usePathname();
  const m = useMessages();

  function handleLogoClick(e: React.MouseEvent) {
    if (pathname === "/") {
      e.preventDefault();
      window.dispatchEvent(new CustomEvent("zigo:logo-tap"));
    }
  }

  const allowedLabels = [m.roles.student, m.roles.teacher, m.roles.parent];
  const showRoleAccent = viewerRole !== "guest" && allowedLabels.includes(roleAccentLabel);

  return (
    <Link href="/" className="tap-scale flex min-w-0 items-center gap-1.5 overflow-hidden" onClick={handleLogoClick}>
      <span className="zigo-wordmark shrink-0">Zigo</span>
      {showRoleAccent ? (
        <span className="role-accent-chip inline-flex max-w-[6.5rem] truncate rounded-full px-2 py-0.5 sm:max-w-[8rem]">
          {roleAccentLabel}
        </span>
      ) : null}
    </Link>
  );
}

function PreviewModeBanner() {
  const m = useMessages();
  return (
    <div className="bg-amber-500 text-white text-xs font-black px-4 py-2 text-center flex justify-between items-center">
      <span>{m.preview.message}</span>
      <Link className="underline font-bold" href="/setup">
        {m.preview.setup}
      </Link>
    </div>
  );
}

// dailyActions Spark Micro z.spark z.micro


