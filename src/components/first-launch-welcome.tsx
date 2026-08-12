"use client";

import { useEffect, useMemo, useState } from "react";

import { SubscribeButton } from "@/components/SubscribeButton";
import { useMessages } from "@/lib/i18n/locale-context";

const storageKey = "zigo:app-intro-seen";

type Slide = {
  bullets?: string[];
  body?: string;
  title: string;
  isContentMap?: boolean;
};

export function FirstLaunchWelcome() {
  const t = useMessages().appIntro;
  const slides = useMemo<Slide[]>(
    () => [
      { title: t.slide1Title, body: t.slide1Body },
      { title: "Zigo Haritası", isContentMap: true },
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
      className="fixed inset-0 z-[70] flex items-end justify-center bg-night/80 p-0 backdrop-blur-md md:items-center md:p-4"
      data-testid="first-launch-welcome"
      role="dialog"
    >
      <div className="safe-bottom flex max-h-[94dvh] w-full max-w-md flex-col overflow-hidden rounded-t-[2rem] bg-white shadow-2xl transition-all duration-300 md:rounded-[2rem]">
        {/* Dynamic Header Gradient */}
        <div className="relative overflow-hidden bg-gradient-to-br from-night via-violet-950 to-crystal px-6 pb-8 pt-7 text-white shadow-md">
          <div className="pointer-events-none absolute -right-12 -top-12 size-40 rounded-full bg-pink-500/20 blur-3xl" />
          <div className="pointer-events-none absolute -bottom-10 -left-10 size-32 rounded-full bg-crystal/30 blur-2xl" />
          
          <div className="relative flex items-center justify-between">
            <span className="inline-flex items-center gap-1.5 rounded-full bg-white/10 px-3 py-1 text-[11px] font-black uppercase tracking-[0.2em] text-amber-300 backdrop-blur-md">
              <span className="size-1.5 rounded-full bg-amber-400 animate-pulse" />
              {t.eyebrow}
            </span>
            <span className="text-xs font-bold text-white/60">
              {step + 1} / {slides.length}
            </span>
          </div>

          <h2 className="zigo-display relative mt-3 text-2xl font-black text-white" id="zigo-app-intro-title">
            {slide.title}
          </h2>

          {slide.body ? (
            <p className="relative mt-3 text-sm font-medium leading-7 text-white/90">
              {slide.body}
            </p>
          ) : null}
        </div>

        {/* Content Body */}
        <div className="flex-1 overflow-y-auto px-6 py-5">
          {slide.isContentMap ? (
            <div className="space-y-3">
              <div className="rounded-xl border border-slate-100 bg-slate-50 p-3">
                <p className="text-xs font-bold text-violet-600">Ana Sayfa <span className="font-normal text-slate-500">(Herkes)</span></p>
                <p className="mt-1 text-sm font-semibold text-slate-700">Takip ettiğin öğretmenlerden kişisel akış</p>
              </div>
              <div className="rounded-xl border border-slate-100 bg-slate-50 p-3">
                <p className="text-xs font-bold text-violet-600">Keşfet <span className="font-normal text-slate-500">(Herkes)</span></p>
                <p className="mt-1 text-sm font-semibold text-slate-700">Tüm doğrulanmış öğretmen içeriklerini keşfet</p>
              </div>
              <div className="rounded-xl border border-slate-100 bg-slate-50 p-3">
                <p className="text-xs font-bold text-violet-600">Dersler (micro) <span className="font-normal text-slate-500">(Öğrenci)</span></p>
                <p className="mt-1 text-sm font-semibold text-slate-700">1 dk kısa video, kaydırarak izle</p>
              </div>
              <div className="rounded-xl border border-slate-100 bg-slate-50 p-3">
                <p className="text-xs font-bold text-violet-600">Öğren <span className="font-normal text-slate-500">(Öğrenci)</span></p>
                <p className="mt-1 text-sm font-semibold text-slate-700">Quiz, plan, odak, düello</p>
              </div>
              <div className="rounded-xl border border-slate-100 bg-slate-50 p-3">
                <p className="text-xs font-bold text-violet-600">Stüdyo <span className="font-normal text-slate-500">(Öğretmen)</span></p>
                <p className="mt-1 text-sm font-semibold text-slate-700">Paylaş, soru cevapla, analitik</p>
              </div>
              <div className="rounded-xl border border-slate-100 bg-slate-50 p-3">
                <p className="text-xs font-bold text-violet-600">Çocuğum <span className="font-normal text-slate-500">(Veli)</span></p>
                <p className="mt-1 text-sm font-semibold text-slate-700">İlerleme, onay, ödül</p>
              </div>
            </div>
          ) : slide.bullets ? (
            <ul className="space-y-3.5">
              {slide.bullets.map((item, index) => {
                const isHighlight = isLast && index === 2;
                return (
                  <li
                    className={`flex gap-3.5 rounded-2xl px-4 py-3.5 transition-all ${
                      isHighlight
                        ? "border-2 border-pink-300 bg-gradient-to-br from-violet-50 via-pink-50 to-amber-50 shadow-md ring-2 ring-pink-400/20"
                        : "border border-slate-100 bg-gradient-to-r from-slate-50 to-purple-50/50 hover:border-violet-200"
                    }`}
                    key={item}
                  >
                    <span
                      className={`flex size-9 shrink-0 items-center justify-center rounded-xl text-xs font-black text-white shadow-sm ${
                        isHighlight
                          ? "bg-gradient-to-r from-pink-600 via-purple-600 to-indigo-600 shadow-pink-500/30"
                          : "bg-night"
                      }`}
                    >
                      {isHighlight ? "🎁" : index + 1}
                    </span>
                    <p className={`text-sm leading-6 ${isHighlight ? "font-bold text-slate-900" : "font-semibold text-slate-700"}`}>
                      {item}
                    </p>
                  </li>
                );
              })}
            </ul>
          ) : null}
        </div>

        {/* Action Controls & Footer */}
        <div className="border-t border-slate-100 bg-slate-50/80 px-6 pb-6 pt-4 backdrop-blur-sm">
          {/* Slide Dots Indicator */}
          <div className="mb-4 flex items-center justify-center gap-2">
            {slides.map((entry, index) => (
              <span
                aria-hidden="true"
                className={`h-2 rounded-full transition-all duration-300 ${
                  index === step ? "w-7 bg-crystal shadow-sm" : "w-2 bg-slate-300"
                }`}
                key={entry.title}
              />
            ))}
          </div>

          {/* Subscribe Call to Action on Last Slide */}
          {isLast ? (
            <div className="mb-3">
              <SubscribeButton
                buttonText="🎁 %50 İndirimle Abone Ol & Bize Destek Ol"
                className="w-full tap-scale rounded-xl bg-gradient-to-r from-pink-600 via-purple-600 to-indigo-600 px-4 py-3.5 text-center text-sm font-black text-white shadow-lg shadow-pink-500/25 transition-all hover:brightness-110"
                onSuccess={() => finish()}
              />
            </div>
          ) : null}

          {/* Navigation Buttons */}
          <div className="grid grid-cols-[auto_1fr] gap-2">
            {!isLast ? (
              <button
                className="tap-scale rounded-xl px-4 py-3 text-sm font-black text-slate-500 hover:text-slate-800"
                onClick={finish}
                type="button"
              >
                {t.skip}
              </button>
            ) : (
              <span />
            )}
            <button
              className="tap-scale zigo-cta rounded-xl px-4 py-3.5 text-sm font-black text-white shadow-md"
              onClick={goNext}
              type="button"
            >
              {isLast ? "Akışa Başla" : t.next}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

