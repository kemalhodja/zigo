"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import type { ReactNode } from "react";

import { BottomNav } from "@/components/bottom-nav";
import { CookieConsentBanner } from "@/components/cookie-consent-banner";
import { FirstLaunchWelcome } from "@/components/first-launch-welcome";
import { LegalFooter } from "@/components/legal-footer";
import { RegistrationCampaignAnnouncement } from "@/components/registration-campaign-announcement";
import { RoleWelcomeStrip } from "@/components/role-welcome-strip";
import { StickyLessonRequestBar } from "@/features/lesson/components/sticky-lesson-request-bar";
import {
  getHeaderPrimaryAction,
  getRoleDashboardHref,
  isParentSupervisionRole,
  isStudentGamificationRole,
  isTeacherStudioRole,
} from "@/lib/domain/role-navigation";
import { getRoleThemeClass, type ViewerRole } from "@/lib/domain/role-theme";
import { useMessages } from "@/lib/i18n/locale-context";
import { LocaleSwitcher } from "@/lib/i18n/locale-switcher";

type AppShellProps = {
  canCreateSocialPost: boolean;
  children: ReactNode;
  isPreviewMode?: boolean;
  roleAccentLabel: string;
  teacherInboxCount?: number;
  lessonRequestBadgeCount?: number;
  unreadCount: number;
  viewerRole: ViewerRole;
};

export function AppShell({
  canCreateSocialPost,
  children,
  roleAccentLabel,
  teacherInboxCount = 0,
  lessonRequestBadgeCount = 0,
  unreadCount,
  viewerRole,
}: AppShellProps) {
  const pathname = usePathname();
  const m = useMessages();
  const isStories = pathname.startsWith("/sparks");
  const isReels = pathname.startsWith("/micro");
  const isImmersive = isStories || isReels;
  const isSocialSurface =
    pathname === "/" ||
    pathname.startsWith("/explore") ||
    pathname.startsWith("/profile") ||
    pathname.startsWith("/post");
  const hideQuickDock =
    isImmersive ||
    isSocialSurface ||
    pathname.startsWith("/auth") ||
    pathname.startsWith("/create") ||
    pathname.startsWith("/questions") ||
    pathname.startsWith("/setup");
  const showStickyLessonBar =
    !isImmersive &&
    !pathname.startsWith("/auth") &&
    (viewerRole === "parent" || viewerRole === "student" || viewerRole === "teacher");

  return (
    <div
      className={`safe-screen zigo-shell-bg mx-auto flex w-full max-w-md flex-col md:my-6 md:min-h-[calc(100vh-3rem)] md:overflow-hidden md:rounded-[2rem] md:border md:border-slate-200/80 md:shadow-[0_28px_100px_rgb(15_23_42_/_0.18)] ${getRoleThemeClass(viewerRole)} ${
        isImmersive ? "relative bg-night" : ""
      }`}
    >
      {isImmersive ? null : <Header canCreateSocialPost={canCreateSocialPost} roleAccentLabel={roleAccentLabel} unreadCount={unreadCount} viewerRole={viewerRole} />}

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
        className={`flex-1 ${isImmersive ? "overflow-hidden p-0" : `px-4 py-3 ${showStickyLessonBar ? "zigo-page-with-sticky-cta" : ""}`}`}
        id="main-content"
      >
        {!isImmersive && !pathname.startsWith("/auth") ? (
          <RoleWelcomeStrip viewerRole={viewerRole} />
        ) : null}
        {children}
        {showStickyLessonBar ? <StickyLessonRequestBar viewerRole={viewerRole} /> : null}
      </main>

      {hideQuickDock ? null : (
        <QuickActionDock canCreateSocialPost={canCreateSocialPost} viewerRole={viewerRole} />
      )}

      {isImmersive ? null : <LegalFooter />}

      {isImmersive || pathname.startsWith("/auth") ? null : <CookieConsentBanner />}

      {isStories ? null : (
        <div className={isReels ? "absolute inset-x-0 bottom-0 z-20" : ""}>
          <BottomNav
            canCreateSocialPost={canCreateSocialPost}
            lessonRequestBadgeCount={lessonRequestBadgeCount}
            teacherInboxCount={teacherInboxCount}
            unreadCount={unreadCount}
            variant={isReels ? "overlay" : "default"}
            viewerRole={viewerRole}
          />
        </div>
      )}

      <FirstLaunchWelcome />
      {pathname.startsWith("/auth") ? null : <RegistrationCampaignAnnouncement />}
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
  const d = m.dock;
  const dock = m.dockByRole;
  const dashboardHref = getRoleDashboardHref(viewerRole);

  if (isStudentGamificationRole(viewerRole)) {
    return (
      <section className="role-dock-student premium-action-dock relative mx-3 mb-2 overflow-hidden rounded-2xl border border-violet-100 bg-white/95 p-2 backdrop-blur">
        <div className="flex flex-wrap justify-center gap-1.5">
          <Link className="zigo-compact-pill tap-scale rounded-xl bg-gradient-to-r from-crystal to-fuchsia-500 text-white" href="/student">
            {dock.student.hub}
          </Link>
          <Link className="zigo-compact-pill tap-scale rounded-xl bg-slate-100 text-night" href="/focus">
            {dock.student.focus}
          </Link>
          <Link className="zigo-compact-pill tap-scale rounded-xl bg-slate-100 text-night" href="/learn">
            {dock.student.learn}
          </Link>
          <Link className="zigo-compact-pill tap-scale rounded-xl bg-slate-100 text-night" href="/duels">
            {dock.student.duels}
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
          <Link className="zigo-compact-pill tap-scale rounded-xl bg-slate-100 text-night" href="/learn">
            {dock.parent.learn}
          </Link>
          <Link className="zigo-compact-pill tap-scale rounded-xl bg-slate-100 text-night" href="/parent/requests">
            {dock.parent.requests}
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
              <Link className="zigo-compact-pill tap-scale rounded-xl bg-night text-white" href="/create?mode=story">
                {dock.teacher.spark}
              </Link>
              <Link className="zigo-compact-pill tap-scale rounded-xl bg-night text-white" href="/create?mode=reel">
                {dock.teacher.micro}
              </Link>
            </>
          ) : null}
          <Link className="zigo-compact-pill tap-scale rounded-xl bg-slate-100 text-night" href="/teacher">
            {dock.teacher.studio}
          </Link>
          <Link className="zigo-compact-pill tap-scale rounded-xl bg-slate-100 text-night" href="/teacher#lesson-requests">
            {dock.teacher.requests}
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
        <Link aria-label={d.askSafely} className="zigo-compact-pill tap-scale rounded-xl bg-gradient-to-r from-crystal to-fuchsia-500 text-white" href="/questions">
          {m.nav.ask}
        </Link>
        <Link className="zigo-compact-pill tap-scale rounded-xl bg-slate-100 text-night" href={dashboardHref}>
          {m.nav.profile}
        </Link>
      </div>
    </section>
  );
}

function Header({
  canCreateSocialPost,
  roleAccentLabel,
  unreadCount,
  viewerRole,
}: {
  canCreateSocialPost: boolean;
  roleAccentLabel: string;
  unreadCount: number;
  viewerRole: ViewerRole;
}) {
  const m = useMessages();
  const h = m.header;
  const primaryAction = getHeaderPrimaryAction(viewerRole, canCreateSocialPost);

  return (
    <header className="safe-top zigo-topbar sticky top-0 z-10 px-4 py-2">
      <div className="flex items-center justify-between gap-3">
        <Link href="/" className="tap-scale flex min-w-0 items-center gap-2">
          <span className="zigo-wordmark">Zigo</span>
          {viewerRole !== "guest" ? (
            <span className="role-accent-chip inline-flex rounded-full px-2 py-0.5">
              {roleAccentLabel}
            </span>
          ) : null}
        </Link>
        <div className="flex shrink-0 items-center gap-2">
          <LocaleSwitcher compact />
          <Link
            aria-label={primaryAction.isCreate ? h.create : h.askQuestion}
            className="tap-scale flex size-9 items-center justify-center text-night transition hover:text-crystal"
            href={primaryAction.href}
          >
            {primaryAction.isCreate ? (
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
          <Link aria-label={h.switchProfile} className="tap-scale flex size-9 items-center justify-center text-night transition hover:text-aqua" href="/profiles">
            <svg aria-hidden="true" className="size-6" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
              <circle cx="12" cy="8" r="4" />
              <path d="M4 20a8 8 0 0 1 16 0" />
            </svg>
          </Link>
        </div>
      </div>
    </header>
  );
}

