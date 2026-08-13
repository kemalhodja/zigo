import "./globals.css";

import type { Metadata, Viewport } from "next";
import { Plus_Jakarta_Sans } from "next/font/google";
import Script from "next/script";
import { cache } from "react";

import { AppShell } from "@/components/app-shell";
import { AuthSessionKeepAlive } from "@/components/auth-session-keepalive";
import { OfflineIndicator } from "@/components/offline-indicator";
import { OneSignalProvider } from "@/components/providers/onesignal-provider";
import { ToastProvider } from "@/components/ui/toast-system";
import { hasSupabaseEnv } from "@/lib/config";
import { isCurrentUserPlatformAdmin } from "@/lib/domain/admin";
import { getUserInterestAreaIds } from "@/lib/domain/profiles";
import { getCachedUserProfile } from "@/lib/domain/profiles.server";
import { getRoleAccentLabel, getRoleThemeClass, getRoleThemeColor, type ViewerRole } from "@/lib/domain/role-theme";
import { getUnreadNotificationCount } from "@/lib/domain/social";
import { getTeacherInboxCount } from "@/lib/domain/teacher-inbox";
import { getHtmlLang } from "@/lib/i18n";
import { LocaleProvider } from "@/lib/i18n/locale-context";
import { getServerMessages } from "@/lib/i18n/server";
import { getServerLocale } from "@/lib/i18n/server-locale";
import { createClient } from "@/lib/supabase/server";

const jakarta = Plus_Jakarta_Sans({
  subsets: ["latin", "latin-ext"],
  variable: "--font-jakarta",
});

export async function generateMetadata(): Promise<Metadata> {
  const meta = (await getServerMessages()).meta;

  return {
    title: {
      default: "Zigo",
      template: "%s · Zigo",
    },
    description: meta.description,
    applicationName: "Zigo",
    appleWebApp: {
      capable: true,
      statusBarStyle: "default",
      title: "Zigo",
    },
    icons: {
      icon: [
        { url: "/icon.svg", type: "image/svg+xml" },
        { url: "/icon-maskable.svg", type: "image/svg+xml" },
      ],
      apple: "/apple-touch-icon.svg",
    },
    manifest: "/manifest.json",
    openGraph: {
      title: "Zigo",
      description: meta.description,
      siteName: "Zigo",
      type: "website",
    },
  };
}

export async function generateViewport(): Promise<Viewport> {
  const shellState = await getShellState();

  return {
    themeColor: getRoleThemeColor(shellState.viewerRole),
    width: "device-width",
    initialScale: 1,
    maximumScale: 1,
    userScalable: false,
    viewportFit: "cover",
    interactiveWidget: "resizes-content",
  };
}

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const shellState = await getShellState();
  const locale = await getServerLocale();
  const messages = await getServerMessages();

  return (
    <html lang={getHtmlLang(locale)}>
      <body className={`${jakarta.variable} font-sans antialiased ${getRoleThemeClass(shellState.viewerRole)}`}>
        <LocaleProvider initialLocale={locale}>
          <ToastProvider>
            <OfflineIndicator />
            <AuthSessionKeepAlive />
            <OneSignalProvider userId={shellState.userId} userRole={shellState.viewerRole} />
            <AppShell
              canCreateSocialPost={shellState.canCreateSocialPost}
              isPreviewMode={!hasSupabaseEnv()}
              isPlatformAdmin={shellState.isPlatformAdmin}
              roleAccentLabel={getRoleAccentLabel(shellState.viewerRole, messages, {
                isPlatformAdmin: shellState.isPlatformAdmin,
              })}
              teacherInboxCount={shellState.teacherInboxCount}
              unreadCount={shellState.unreadCount}
              viewerRole={shellState.viewerRole}
            >
              {children}
            </AppShell>
          </ToastProvider>
        </LocaleProvider>
        {process.env.NODE_ENV === "production" ? (
          <Script id="zigo-service-worker" strategy="afterInteractive">
            {`
              if ("serviceWorker" in navigator) {
                window.addEventListener("load", function () {
                  navigator.serviceWorker.register("/sw.js").catch(function () {});
                });
              }
            `}
          </Script>
        ) : null}
      </body>
    </html>
  );
}

const getShellState = cache(async () => {
  if (!hasSupabaseEnv()) {
    return { canCreateSocialPost: false, unreadCount: 0, teacherInboxCount: 0, viewerRole: "guest" as ViewerRole, isPlatformAdmin: false, userId: undefined as string | undefined };
  }

  try {
    const profile = await getCachedUserProfile();
    if (!profile) {
      return { canCreateSocialPost: false, unreadCount: 0, teacherInboxCount: 0, viewerRole: "guest" as ViewerRole, isPlatformAdmin: false, userId: undefined as string | undefined };
    }

    const supabase = await createClient();
    
    const [teacherInboxCount, isPlatformAdmin, interestAreas, unreadCount] = await Promise.all([
      profile.role === "teacher" ? getTeacherInboxCount(supabase, profile.id) : Promise.resolve(0),
      isCurrentUserPlatformAdmin(supabase),
      profile.role === "teacher" && profile.is_verified ? getUserInterestAreaIds(supabase, profile.id) : Promise.resolve([]),
      getUnreadNotificationCount(supabase, profile.id),
    ]);

    const canCreateSocialPost = profile.role === "teacher" && profile.is_verified && interestAreas.length > 0;

    return {
      canCreateSocialPost,
      unreadCount,
      teacherInboxCount,
      viewerRole: profile.role as ViewerRole,
      isPlatformAdmin,
      userId: profile.id,
    };
  } catch {
    return { canCreateSocialPost: false, unreadCount: 0, teacherInboxCount: 0, viewerRole: "guest" as ViewerRole, isPlatformAdmin: false, userId: undefined as string | undefined };
  }
});
