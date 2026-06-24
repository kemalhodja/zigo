import "./globals.css";

import type { Metadata, Viewport } from "next";
import { Plus_Jakarta_Sans } from "next/font/google";
import Script from "next/script";

import { AppShell } from "@/components/app-shell";
import { hasSupabaseEnv } from "@/lib/config";
import { getCurrentProfile } from "@/lib/domain/profiles";
import { getRoleAccentLabel, getRoleThemeClass, type ViewerRole } from "@/lib/domain/role-theme";
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

export const viewport: Viewport = {
  themeColor: "#7C3AED",
  width: "device-width",
  initialScale: 1,
};

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
          <AppShell
          canCreateSocialPost={shellState.canCreateSocialPost}
          isPreviewMode={!hasSupabaseEnv()}
          roleAccentLabel={getRoleAccentLabel(shellState.viewerRole, messages)}
          teacherInboxCount={shellState.teacherInboxCount}
          unreadCount={shellState.unreadCount}
          viewerRole={shellState.viewerRole}
        >
          {children}
        </AppShell>
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

async function getShellState() {
  if (!hasSupabaseEnv()) {
    return { canCreateSocialPost: true, unreadCount: 0, teacherInboxCount: 0, viewerRole: "guest" as ViewerRole };
  }

  try {
    const supabase = await createClient();
    const profile = await getCurrentProfile(supabase);
    if (!profile) {
      return { canCreateSocialPost: false, unreadCount: 0, teacherInboxCount: 0, viewerRole: "guest" as ViewerRole };
    }

    const teacherInboxCount =
      profile.role === "teacher" ? await getTeacherInboxCount(supabase, profile.id) : 0;

    return {
      canCreateSocialPost: profile.role === "teacher" && profile.is_verified,
      unreadCount: await getUnreadNotificationCount(supabase, profile.id),
      teacherInboxCount,
      viewerRole: profile.role as ViewerRole,
    };
  } catch {
    return { canCreateSocialPost: false, unreadCount: 0, teacherInboxCount: 0, viewerRole: "guest" as ViewerRole };
  }
}
