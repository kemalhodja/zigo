import { Suspense } from "react";

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
        <AuthPremiumHero />
        <AuthTrustSteps />
        <SupabaseSetupCard />
        <AuthLegalLinks />
      </div>
    );
  }

  return (
    <div className="space-y-5 pb-4">
      <AuthPremiumHero />
      <AuthTrustSteps />

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

async function AuthPremiumHero() {
  const a = (await getServerMessages()).auth;

  return (
    <section className="-mx-4 overflow-hidden border-b border-violet-100 bg-white">
      <div className="bg-gradient-to-br from-night via-violet-900 to-crystal px-6 pb-7 pt-8 text-center text-white">
        <h1 className="zigo-display text-white">Zigo</h1>
        <p className="mx-auto mt-3 max-w-80 text-zigo-body font-semibold leading-relaxed text-white/80">{a.hero}</p>
        <div className="mx-auto mt-5 zigo-action-grid max-w-sm">
          <span className="zigo-stat-chip rounded-xl bg-white/14 backdrop-blur">{a.safeFeed}</span>
          <span className="zigo-stat-chip rounded-xl bg-white/14 backdrop-blur">{a.noDm}</span>
          <span className="zigo-stat-chip rounded-xl bg-white/14 backdrop-blur">{a.verified}</span>
        </div>
      </div>
      <div className="zigo-action-grid px-4 py-3">
        <span className="zigo-stat-chip rounded-xl bg-violet-50 text-crystal">{a.register}</span>
        <span className="zigo-stat-chip rounded-xl bg-pink-50 text-berry">{a.pickRole}</span>
        <span className="zigo-stat-chip rounded-xl bg-cyan-50 text-aqua">{a.startFeed}</span>
      </div>
    </section>
  );
}

async function AuthTrustSteps() {
  const a = (await getServerMessages()).auth;
  const steps = [
    { label: a.studentMode, text: a.studentModeDesc },
    { label: a.parentMode, text: a.parentModeDesc },
    { label: a.teacherMode, text: a.teacherModeDesc },
  ];

  return (
    <section className="-mx-4 border-y border-pink-50 bg-white px-4 py-4">
      <p className="zigo-eyebrow text-crystal">{a.registrationPath}</p>
      <div className="mt-3 grid gap-2">
        {steps.map((step, index) => (
          <div className="flex items-center gap-3 rounded-2xl border border-violet-100 bg-gradient-to-r from-violet-50 to-pink-50 px-3 py-3" key={step.label}>
            <span className="flex size-8 shrink-0 items-center justify-center rounded-xl bg-night text-zigo-caption font-bold text-white">
              {index + 1}
            </span>
            <div className="min-w-0">
              <p className="text-zigo-body font-bold text-night">{step.label}</p>
              <p className="mt-0.5 text-zigo-caption leading-relaxed text-slate-600">{step.text}</p>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
