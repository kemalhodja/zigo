import "./globals.css";

import type { Metadata, Viewport } from "next";
import { Inter_Tight,Plus_Jakarta_Sans } from "next/font/google";
import Script from "next/script";
import { cache } from "react";

import { AppShell } from "@/components/app-shell";
import { AuthSessionKeepAlive } from "@/components/auth-session-keepalive";
import { PwaInstallBanner } from "@/components/pwa-install-banner";
import { OfflineIndicator } from "@/components/offline-indicator";
import { JsonLd } from "@/components/seo/json-ld";
import { AnalyticsProvider } from "@/components/providers/analytics-provider";
import { OneSignalProvider } from "@/components/providers/onesignal-provider";
import { ScrollReset } from "@/components/scroll-reset";
import { ToastProvider } from "@/components/ui/toast-system";
import { hasSupabaseEnv } from "@/lib/config";
import { isCurrentUserPlatformAdmin } from "@/lib/domain/admin";
import { getUserInterestAreaIds } from "@/lib/domain/profiles";
import { getCachedUserProfile } from "@/lib/domain/profiles.server";
import { getRoleAccentLabel, getRoleThemeClass, getRoleThemeColor, type ViewerRole } from "@/lib/domain/role-theme";
import { getUnreadNotificationCount } from "@/lib/domain/social";
import { getTeacherInboxCount } from "@/lib/domain/teacher-inbox";
import { LocaleProvider } from "@/lib/i18n/locale-context";
import { getServerMessages } from "@/lib/i18n/server";
import { getServerLocale } from "@/lib/i18n/server-locale";
import { createClient } from "@/lib/supabase/server";

const jakarta = Plus_Jakarta_Sans({
  subsets: ["latin", "latin-ext"],
  variable: "--font-jakarta",
  display: "swap",
  preload: true,
});

const interTight = Inter_Tight({
  subsets: ["latin", "latin-ext"],
  variable: "--font-inter-tight",
  display: "swap",
  preload: true,
});

export async function generateMetadata(): Promise<Metadata> {
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://www.zigo.com.tr";
  const titleDefault = "Zigo | Türkiye'nin Eğitim Sosyal Ağı - LGS & YKS Puan Hesaplama";
  const titleTemplate = "%s | Zigo";
  const description =
    "Zigo; öğrenciler, veliler ve öğretmenler için yeni nesil eğitim sosyal ağıdır. MEB ve ÖSYM güncel standart katsayılarıyla 2026 LGS ve YKS (TYT-AYT) puan hesaplama, online soru çözümü, zeka oyunları ve rehberlik.";

  const keywords = [
    "zigo",
    "zigo eğitim",
    "lgs puan hesaplama",
    "yks puan hesaplama",
    "lgs puan hesaplama 2026",
    "yks puan hesaplama 2026",
    "tyt ayt puan hesaplama",
    "obp hesaplama",
    "kırık obp hesaplama",
    "e-okul",
    "yök atlas",
    "ogm materyal",
    "öğrenci koçluğu",
    "özel ders talebi",
    "eğitim sosyal ağı",
    "soru çözümü",
    "online deneme sınavı",
    "zeka oyunları",
    "odak odası",
  ];

  return {
    metadataBase: new URL(baseUrl),
    title: {
      default: titleDefault,
      template: titleTemplate,
    },
    description,
    keywords,
    applicationName: "Zigo",
    category: "education",
    creator: "Zigo Education Team",
    publisher: "Zigo",
    robots: {
      index: true,
      follow: true,
      googleBot: {
        index: true,
        follow: true,
        "max-video-preview": -1,
        "max-image-preview": "large",
        "max-snippet": -1,
      },
    },
    appleWebApp: {
      capable: true,
      statusBarStyle: "default",
      title: "Zigo",
    },
    alternates: {
      canonical: "/",
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
      title: titleDefault,
      description,
      siteName: "Zigo",
      type: "website",
      locale: "tr_TR",
      url: baseUrl,
      images: [
        {
          url: "/og-image.jpg",
          width: 1200,
          height: 630,
          alt: "Zigo Eğitim Platformu - LGS ve YKS Puan Hesaplama",
        },
      ],
    },
    twitter: {
      card: "summary_large_image",
      title: titleDefault,
      description,
      images: ["/og-image.jpg"],
    },
  };
}

export async function generateViewport(): Promise<Viewport> {
  const shellState = await getShellState();

  return {
    themeColor: getRoleThemeColor(shellState.viewerRole),
    colorScheme: "light",
    width: "device-width",
    initialScale: 1,
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
    <html lang="tr">
      <head>
        <meta name="color-scheme" content="light only" />
        <meta name="darkreader-lock" />
        <script
          dangerouslySetInnerHTML={{
            __html: `(function(){try{var h=window.location.hash||"";if(h&&(h.indexOf("access_token")!==-1||h.indexOf("type=recovery")!==-1||h.indexOf("error")!==-1)){window.__ZIGO_RECOVERY_HASH__=h;try{sessionStorage.setItem("zigo_recovery_hash",h)}catch(e){}}}catch(e){}})();`,
          }}
        />
      </head>
      <body className={`${jakarta.variable} ${interTight.variable} font-sans antialiased ${getRoleThemeClass(shellState.viewerRole)}`}>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              "@context": "https://schema.org",
              "@type": "WebSite",
              "name": "Zigo",
              "url": process.env.NEXT_PUBLIC_SITE_URL || "https://www.zigo.com.tr",
              "description": messages.meta.description
            })
          }}
        />
        <JsonLd />
        <LocaleProvider initialLocale={locale}>
          <ToastProvider>
            <OfflineIndicator />
            <ScrollReset />
            <AnalyticsProvider />
            <AuthSessionKeepAlive />
            <OneSignalProvider userId={shellState.userId} userRole={shellState.viewerRole} />
            <PwaInstallBanner />
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
