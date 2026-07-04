"use client";

import { useEffect, useMemo, useState } from "react";

import { useMessages } from "@/lib/i18n/locale-context";

const storageKey = "zigo:app-intro-seen";

type Slide = {
  bullets?: string[];
  body?: string;
  title: string;
};

export function FirstLaunchWelcome() {
  const t = useMessages().appIntro;
  const slides = useMemo<Slide[]>(
    () => [
      { title: t.slide1Title, body: t.slide1Body },
      {
        title: t.slide2Title,
        bullets: [t.slide2Feed, t.slide2Roles, t.slide2Teachers],
      },
      {
        title: t.slide3Title,
        bullets: [t.slide3Safe, t.slide3Learn, t.slide3Parent],
      },
    ],
    [t],
  );

  const [visible, setVisible] = useState(false);
  const [step, setStep] = useState(0);

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

  function goNext() {
    if (step >= slides.length - 1) {
      finish();
      return;
    }
    setStep((current) => current + 1);
  }

  if (!visible) return null;

  const slide = slides[step];
  const isLast = step === slides.length - 1;

  return (
    <div
      aria-labelledby="zigo-app-intro-title"
      aria-modal="true"
      className="fixed inset-0 z-[70] flex items-end justify-center bg-night/80 p-0 backdrop-blur-sm md:items-center md:p-4"
      data-testid="first-launch-welcome"
      role="dialog"
    >
      <div className="safe-bottom flex max-h-[92dvh] w-full max-w-md flex-col overflow-hidden rounded-t-[2rem] bg-white shadow-2xl md:rounded-[2rem]">
        <div className="bg-gradient-to-br from-night via-violet-900 to-crystal px-6 pb-8 pt-7 text-white">
          <p className="text-xs font-black uppercase tracking-[0.22em] text-white/70">{t.eyebrow}</p>
          <h2 className="zigo-display mt-2 text-white" id="zigo-app-intro-title">
            {slide.title}
          </h2>
          {slide.body ? (
            <p className="mt-3 text-sm font-semibold leading-7 text-white/85">{slide.body}</p>
          ) : null}
        </div>

        <div className="flex-1 overflow-y-auto px-6 py-5">
          {slide.bullets ? (
            <ul className="space-y-3">
              {slide.bullets.map((item, index) => (
                <li className="flex gap-3 rounded-2xl border border-violet-100 bg-gradient-to-r from-violet-50 to-pink-50 px-4 py-3" key={item}>
                  <span className="flex size-8 shrink-0 items-center justify-center rounded-xl bg-night text-xs font-black text-white">
                    {index + 1}
                  </span>
                  <p className="text-sm font-semibold leading-6 text-slate-700">{item}</p>
                </li>
              ))}
            </ul>
          ) : null}
        </div>

        <div className="border-t border-slate-100 px-6 pb-6 pt-4">
          <div className="mb-4 flex items-center justify-center gap-2">
            {slides.map((entry, index) => (
              <span
                aria-hidden="true"
                className={`h-2 rounded-full transition-all ${index === step ? "w-6 bg-crystal" : "w-2 bg-slate-200"}`}
                key={entry.title}
              />
            ))}
          </div>

          <div className="grid grid-cols-[auto_1fr] gap-2">
            {!isLast ? (
              <button
                className="tap-scale rounded-xl px-4 py-3 text-sm font-black text-slate-500"
                onClick={finish}
                type="button"
              >
                {t.skip}
              </button>
            ) : (
              <span />
            )}
            <button
              className="tap-scale zigo-cta rounded-xl px-4 py-3.5 text-sm font-black text-white"
              onClick={goNext}
              type="button"
            >
              {isLast ? t.start : t.next}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
