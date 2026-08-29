"use client";

import { useEffect, useRef, useState } from "react";

type Slide = {
  icon: string;
  tag: string;
  title: string;
  desc: string;
  accent: string;
  bg: string;
};

const SLIDES: Slide[] = [
  {
    icon: "⚡",
    tag: "SOSYAL ÖĞRENME",
    title: "Zigo ile\nÖğrenme\nYeniden Doğuyor",
    desc: "Öğretmenler, öğrenciler ve veliler bir arada — Türkiye'nin en büyük eğitim sosyal platformu.",
    accent: "#0047FF",
    bg: "from-[#09090B] to-[#0d0d1a]",
  },
  {
    icon: "🎓",
    tag: "ÖĞRETMENLER",
    title: "İçerik Yayınla,\nTakipçi Kazan,\nBüyü",
    desc: "Ders videoları, quizler ve kısa reels ile öğrencilere ulaş. Takipçi ağını büyüt, özel ders teklifleri al.",
    accent: "#0047FF",
    bg: "from-[#09090B] to-[#001433]",
  },
  {
    icon: "📚",
    tag: "ÖĞRENCİLER",
    title: "Ders Çalış,\nPuan Kazan,\nOdaklan",
    desc: "Focus modu, akıllı tekrar sistemi, eğitici oyunlar ve AI mentor ile öğrenmeyi alışkanlığa dönüştür.",
    accent: "#0047FF",
    bg: "from-[#09090B] to-[#001a0d]",
  },
  {
    icon: "👨‍👩‍👧",
    tag: "VELİLER",
    title: "Çocuğunun\nÖğrenme\nYolculuğunu\nTakip Et",
    desc: "Haftalık aktivite raporları, oyun süresi limitleri ve özel ders ilanı. Hepsi bir arada.",
    accent: "#0047FF",
    bg: "from-[#09090B] to-[#1a0a00]",
  },
  {
    icon: "🏆",
    tag: "7 GÜN ÜCRETSIZ",
    title: "Hemen\nBaşla,\nÜcretsiz\nDene",
    desc: "İlk 7 gün tüm özellikler tamamen ücretsiz. Abone olmak istersen ilk 7 gün içinde %50 indirim.",
    accent: "#0047FF",
    bg: "from-[#09090B] to-[#09090B]",
  },
];

const AUTO_INTERVAL = 4000;

export function AppFeatureSlides() {
  const [current, setCurrent] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const startX = useRef(0);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const next = () => setCurrent((c) => (c + 1) % SLIDES.length);
  const prev = () => setCurrent((c) => (c - 1 + SLIDES.length) % SLIDES.length);

  const resetTimer = () => {
    if (timerRef.current) clearInterval(timerRef.current);
    timerRef.current = setInterval(next, AUTO_INTERVAL);
  };

  useEffect(() => {
    timerRef.current = setInterval(next, AUTO_INTERVAL);
    return () => { if (timerRef.current) clearInterval(timerRef.current); };
  }, []);

  const handleTouchStart = (e: React.TouchEvent) => {
    startX.current = e.touches[0].clientX;
    setIsDragging(true);
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    if (!isDragging) return;
    const diff = startX.current - e.changedTouches[0].clientX;
    if (Math.abs(diff) > 40) {
      diff > 0 ? next() : prev();
      resetTimer();
    }
    setIsDragging(false);
  };

  const slide = SLIDES[current];

  return (
    <section
      className="relative -mx-4 overflow-hidden select-none"
      style={{ height: "340px" }}
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
    >
      {/* Background */}
      <div
        className={`absolute inset-0 bg-gradient-to-br ${slide.bg} transition-all duration-700`}
      />

      {/* Grid lines decoration (avant-garde) */}
      <div className="absolute inset-0 opacity-[0.04]"
        style={{
          backgroundImage: "linear-gradient(#ffffff 1px, transparent 1px), linear-gradient(90deg, #ffffff 1px, transparent 1px)",
          backgroundSize: "40px 40px",
        }}
      />

      {/* Cobalt accent blob */}
      <div
        className="absolute rounded-full blur-[80px] opacity-20 pointer-events-none"
        style={{
          width: "280px", height: "280px",
          background: "#0047FF",
          top: "-60px", right: "-60px",
          transition: "opacity 0.5s",
        }}
      />

      {/* Content */}
      <div className="relative flex flex-col justify-between h-full px-6 pt-7 pb-5">

        {/* Tag + Icon */}
        <div className="flex items-center gap-2">
          <span className="text-2xl">{slide.icon}</span>
          <span
            className="text-[0.6rem] font-black tracking-[0.18em] uppercase px-2 py-0.5"
            style={{ color: "#0047FF", border: "1px solid #0047FF" }}
          >
            {slide.tag}
          </span>
        </div>

        {/* Title */}
        <h1
          className="text-white font-black leading-[1.1] whitespace-pre-line"
          style={{
            fontSize: "clamp(1.6rem, 7vw, 2.2rem)",
            letterSpacing: "-0.04em",
          }}
        >
          {slide.title}
        </h1>

        {/* Description */}
        <p className="text-white/60 text-[0.85rem] leading-relaxed font-medium max-w-[280px]">
          {slide.desc}
        </p>

        {/* Dot indicators */}
        <div className="flex items-center gap-1.5 mt-2">
          {SLIDES.map((_, i) => (
            <button
              key={i}
              onClick={() => { setCurrent(i); resetTimer(); }}
              className="h-[3px] rounded-full transition-all duration-300"
              style={{
                width: i === current ? "24px" : "8px",
                background: i === current ? "#0047FF" : "rgba(255,255,255,0.25)",
              }}
              aria-label={`Slayt ${i + 1}`}
            />
          ))}
          {/* Slide counter */}
          <span className="ml-auto text-[0.65rem] font-black text-white/30 tracking-widest">
            {String(current + 1).padStart(2, "0")}/{SLIDES.length}
          </span>
        </div>
      </div>
    </section>
  );
}
