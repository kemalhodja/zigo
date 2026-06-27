"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import type { ReactNode } from "react";

import { BottomNav } from "@/components/bottom-nav";
import { CookieConsentBanner } from "@/components/cookie-consent-banner";
import { FirstLaunchWelcome } from "@/components/first-launch-welcome";
import { FloatingWhatsAppSupport } from "@/components/floating-whatsapp-support";
import { LegalFooter } from "@/components/legal-footer";
import { RegistrationCampaignAnnouncement } from "@/components/registration-campaign-announcement";
import { RoleWelcomeStrip } from "@/components/role-welcome-strip";
import { ShortcutScrollDock, type ShortcutScrollItem } from "@/components/shortcut-scroll-dock";
import { useShortcutDockItems } from "@/lib/client/shortcut-preferences";
import {
  getHeaderPrimaryAction,
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
  isPreviewMode = false,
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
  const hideQuickDock =
    isImmersive ||
    pathname.startsWith("/auth") ||
    pathname.startsWith("/create") ||
    pathname.startsWith("/questions") ||
    pathname.startsWith("/setup");
  const { items: shortcutItems } = useShortcutDockItems(viewerRole, {
    canCreateSocialPost,
    hidden: hideQuickDock,
    messages: m,
  });
  const showBottomNav = !isStories;
  const showShortcutDock = shortcutItems.length > 0;
  const shellFloatClass = [
    showBottomNav ? "zigo-shell--with-nav" : "",
    showShortcutDock ? "zigo-shell--with-dock" : "",
  ]
    .filter(Boolean)
    .join(" ");

  return (
    <div
      className={`safe-screen zigo-shell-bg zigo-shell mx-auto flex w-full max-w-md flex-col md:my-6 md:min-h-[calc(100vh-3rem)] md:overflow-hidden md:rounded-[2rem] md:border md:border-slate-200/80 md:shadow-[0_28px_100px_rgb(15_23_42_/_0.18)] ${shellFloatClass} ${getRoleThemeClass(viewerRole)} ${
        isImmersive ? "relative bg-night" : ""
      }`}
    >
      {isImmersive ? null : <Header canCreateSocialPost={canCreateSocialPost} roleAccentLabel={roleAccentLabel} unreadCount={unreadCount} viewerRole={viewerRole} />}

      {isPreviewMode ? <PreviewModeBanner /> : null}

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
        className={`flex-1 ${
          isImmersive
            ? "overflow-hidden p-0"
            : `px-4 py-3 ${showBottomNav || showShortcutDock ? "zigo-main-with-bottom-float" : ""}`
        }`}
        id="main-content"
      >
        {!isImmersive && !pathname.startsWith("/auth") ? (
          <RoleWelcomeStrip viewerRole={viewerRole} />
        ) : null}
        {children}
      </main>

      {isImmersive ? null : <LegalFooter />}

      {isImmersive || pathname.startsWith("/auth") ? null : <CookieConsentBanner />}

      {showBottomNav || showShortcutDock ? (
        <div className="zigo-float-bottom-bar pointer-events-none fixed inset-x-0 bottom-0 z-30 mx-auto w-full max-w-md">
          <div className="pointer-events-auto">
            {showShortcutDock ? (
              <QuickActionDock floating items={shortcutItems} viewerRole={viewerRole} />
            ) : null}
            {showBottomNav ? (
              <BottomNav
                canCreateSocialPost={canCreateSocialPost}
                lessonRequestBadgeCount={lessonRequestBadgeCount}
                teacherInboxCount={teacherInboxCount}
                unreadCount={unreadCount}
                variant={isReels ? "overlay" : "default"}
                viewerRole={viewerRole}
              />
            ) : null}
          </div>
        </div>
      ) : null}

      <FloatingWhatsAppSupport viewerRole={viewerRole} />

      <FirstLaunchWelcome />
      {pathname.startsWith("/auth") ? null : <RegistrationCampaignAnnouncement />}
    </div>
  );
}

function PreviewModeBanner() {
  const m = useMessages();

  return (
    <Link
      className="mx-3 mt-2 block rounded-xl border border-amber-200 bg-amber-50 px-3 py-2 text-center text-xs font-bold text-amber-900"
      href="/setup"
    >
      {m.preview.message}{" "}
      <span className="font-black underline">{m.preview.setup}</span>
    </Link>
  );
}

function QuickActionDock({
  floating = false,
  items,
  viewerRole,
}: {
  floating?: boolean;
  items: ShortcutScrollItem[];
  viewerRole: ViewerRole;
}) {
  const m = useMessages();
  const roleClassName = isStudentGamificationRole(viewerRole)
    ? "role-dock-student border-violet-100"
    : isParentSupervisionRole(viewerRole)
      ? "role-dock-parent border-cyan-100"
      : isTeacherStudioRole(viewerRole)
        ? "role-dock-teacher border-slate-200"
        : "border-violet-100";

  if (items.length === 0) return null;

  return (
    <ShortcutScrollDock
      floating={floating}
      items={items}
      roleClassName={roleClassName}
      title={m.dock.shortcuts}
    />
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

