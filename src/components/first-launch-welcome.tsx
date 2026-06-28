"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";

import {
  REGISTRATION_ACCOUNT_OPTIONS,
  type RegistrationAccountKind,
} from "@/lib/domain/registration-account";
import type { ViewerRole } from "@/lib/domain/role-theme";
import { useMessages } from "@/lib/i18n/locale-context";

const storageKey = "zigo:app-intro-seen";

type FirstLaunchWelcomeProps = {
  viewerRole: ViewerRole;
};

type IntroStep = "pick" | "features";

export function FirstLaunchWelcome({ viewerRole }: FirstLaunchWelcomeProps) {
  const pathname = usePathname();
  const router = useRouter();
  const t = useMessages().appIntro;
  const roleOptions = useMemo(() => REGISTRATION_ACCOUNT_OPTIONS, []);

  const [visible, setVisible] = useState(false);
  const [step, setStep] = useState<IntroStep>("pick");
  const [selectedKind, setSelectedKind] = useState<RegistrationAccountKind>("student");

  const hiddenRoute =
    pathname.startsWith("/auth")
    || pathname.startsWith("/setup")
    || pathname.startsWith("/sparks")
    || pathname.startsWith("/micro");

  useEffect(() => {
    try {
      setVisible(window.localStorage.getItem(storageKey) !== "1");
    } catch {
      setVisible(true);
    }
  }, []);

  function finish() {
    try {
      window.localStorage.setItem(storageKey, "1");
    } catch {
      // ignore
    }
    setVisible(false);
  }

  function openFeatures(kind: RegistrationAccountKind) {
    setSelectedKind(kind);
    setStep("features");
  }

  function goToSignUp() {
    finish();
    router.push(`/auth?mode=signup&accountKind=${selectedKind}`);
  }

  if (!visible || viewerRole !== "guest" || hiddenRoute) return null;

  const selectedOption = roleOptions.find((option) => option.id === selectedKind) ?? roleOptions[0];
  const roleCopy = t.roles[selectedKind];

  return (
    <div
      aria-labelledby="zigo-role-onboarding-title"
      aria-modal="true"
      className="fixed inset-0 z-[70] flex items-end justify-center bg-night/80 p-0 backdrop-blur-sm md:items-center md:p-4"
      data-testid="first-launch-welcome"
      role="dialog"
    >
      <div className="safe-bottom flex max-h-[92dvh] w-full max-w-md flex-col overflow-hidden rounded-t-[2rem] bg-white shadow-2xl md:rounded-[2rem]">
        {step === "pick" ? (
          <>
            <div className="bg-gradient-to-br from-night via-violet-900 to-crystal px-6 pb-6 pt-7 text-white">
              <div className="flex items-start justify-between gap-3">
                <p className="text-xs font-black uppercase tracking-[0.22em] text-white/70">{t.eyebrow}</p>
                <button
                  className="tap-scale rounded-lg px-2 py-1 text-xs font-black text-white/75"
                  onClick={finish}
                  type="button"
                >
                  {t.skip}
                </button>
              </div>
              <h2 className="zigo-display mt-2 text-white" id="zigo-role-onboarding-title">
                {t.pickTitle}
              </h2>
              <p className="mt-2 text-sm font-semibold leading-6 text-white/85">{t.pickSubtitle}</p>
            </div>

            <div className="flex-1 overflow-y-auto px-4 py-4">
              <div className="space-y-2">
                {roleOptions.map((option) => (
                  <button
                    className="tap-scale w-full rounded-2xl border border-slate-200 bg-white p-3 text-left transition hover:border-violet-200 hover:bg-violet-50/40"
                    data-testid={`role-onboarding-pick-${option.id}`}
                    key={option.id}
                    onClick={() => openFeatures(option.id)}
                    type="button"
                  >
                    <span className="flex items-center gap-3">
                      <span
                        className={`flex size-11 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br text-lg text-white ${option.accent}`}
                      >
                        {roleEmoji(option.id)}
                      </span>
                      <span className="min-w-0">
                        <span className="block text-sm font-black text-night">{t.roles[option.id].title}</span>
                        <span className="mt-0.5 block text-xs font-bold leading-5 text-slate-500">
                          {t.roles[option.id].tagline}
                        </span>
                      </span>
                      <span aria-hidden="true" className="ml-auto text-lg text-slate-300">
                        ›
                      </span>
                    </span>
                  </button>
                ))}
              </div>
            </div>

            <div className="border-t border-slate-100 px-6 pb-6 pt-3">
              <Link
                className="tap-scale block text-center text-sm font-black text-crystal"
                href="/auth?mode=signin"
                onClick={finish}
              >
                {t.alreadyHaveAccount}
              </Link>
              <button
                className="tap-scale mt-2 w-full text-center text-xs font-bold text-slate-400"
                onClick={finish}
                type="button"
              >
                {t.continueBrowsing}
              </button>
            </div>
          </>
        ) : (
          <>
            <div className={`bg-gradient-to-br px-6 pb-6 pt-7 text-white ${selectedOption.accent}`}>
              <p className="text-xs font-black uppercase tracking-[0.22em] text-white/70">{t.featuresLabel}</p>
              <h2 className="zigo-display mt-2 text-white">{roleCopy.title}</h2>
              <p className="mt-2 text-sm font-semibold leading-6 text-white/90">{roleCopy.tagline}</p>
            </div>

            <div className="flex-1 overflow-y-auto px-6 py-4">
              <ul className="space-y-2.5">
                {roleCopy.features.map((item, index) => (
                  <li
                    className="flex gap-3 rounded-2xl border border-violet-100 bg-gradient-to-r from-violet-50 to-pink-50 px-3.5 py-3"
                    key={item}
                  >
                    <span className="flex size-7 shrink-0 items-center justify-center rounded-lg bg-night text-[0.65rem] font-black text-white">
                      {index + 1}
                    </span>
                    <p className="text-sm font-semibold leading-6 text-slate-700">{item}</p>
                  </li>
                ))}
              </ul>
              {roleCopy.note ? (
                <p className="mt-4 rounded-xl bg-slate-50 px-3 py-2.5 text-xs font-bold leading-5 text-slate-500">
                  {roleCopy.note}
                </p>
              ) : null}
            </div>

            <div className="border-t border-slate-100 px-4 pb-6 pt-4">
              <div className="grid grid-cols-2 gap-2">
                <button
                  className="tap-scale rounded-xl border border-slate-200 bg-white px-4 py-3.5 text-sm font-black text-slate-600"
                  data-testid="role-onboarding-back"
                  onClick={() => setStep("pick")}
                  type="button"
                >
                  {t.back}
                </button>
                <button
                  className="tap-scale zigo-cta rounded-xl px-4 py-3.5 text-sm font-black text-white"
                  data-testid="role-onboarding-signup"
                  onClick={goToSignUp}
                  type="button"
                >
                  {t.freeSignUp}
                </button>
              </div>
              <Link
                className="tap-scale mt-3 block text-center text-xs font-black text-crystal"
                href="/auth?mode=signin"
                onClick={finish}
              >
                {t.alreadyHaveAccount}
              </Link>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

function roleEmoji(kind: RegistrationAccountKind) {
  switch (kind) {
    case "student":
      return "🎒";
    case "parent":
      return "👨‍👩‍👧";
    case "teacher":
      return "✏️";
    case "institution":
      return "🏫";
    case "platform":
      return "🌐";
    default:
      return "✨";
  }
}
