import type { Metadata } from "next";
import { Suspense } from "react";

export const metadata: Metadata = {
  title: "Giriş Yap",
  description: "Zigo'ya giriş yapın veya yeni bir hesap oluşturun.",
  alternates: {
    canonical: "/auth",
  },
};

import { AppFeatureSlides } from "@/components/app-feature-slides";
import { AuthLegalLinks } from "@/components/auth-legal-links";
import { AuthPanel } from "@/components/auth-panel";
import { DemoLoginPanel } from "@/components/demo-login-panel";
import { SupabaseSetupCard } from "@/components/supabase-setup-card";
import { hasSupabaseEnv } from "@/lib/config";
import { isLocalDemoSupabase } from "@/lib/domain/demo-env";
import { getServerMessages } from "@/lib/i18n/server";

export default async function AuthPage() {
  const m = await getServerMessages();

  if (!hasSupabaseEnv()) {
    return (
      <div className="space-y-5 pb-4">
        <AppFeatureSlides />
        <SupabaseSetupCard />
        <AuthLegalLinks />
      </div>
    );
  }

  return (
    <div className="space-y-5 pb-4">
      <AppFeatureSlides />

      {isLocalDemoSupabase() ? (
        <Suspense fallback={null}>
          <DemoLoginPanel enabled />
        </Suspense>
      ) : null}

      <Suspense fallback={<div className="-mx-4 bg-white px-4 py-5 text-sm font-bold text-slate-500">{m.auth.loadingAuth}</div>}>
        <AuthPanel />
      </Suspense>
      <AuthLegalLinks />
    </div>
  );
}
