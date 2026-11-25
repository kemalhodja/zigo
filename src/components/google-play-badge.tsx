"use client";

import React from "react";

export const GOOGLE_PLAY_STORE_URL =
  "https://play.google.com/store/apps/details?id=com.zigo.education";

type GooglePlayBadgeProps = {
  className?: string;
  variant?: "dark" | "light" | "compact";
  subText?: string;
  url?: string;
  onClick?: () => void;
};

/**
 * Resmi Google Play Store Vektör Logosu
 */
export function GooglePlayIcon({ className = "size-6" }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 512 512"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
    >
      <path
        d="M48.7 13.1c-6.8 7.3-10.7 18.2-10.7 31.9v422c0 13.7 3.9 24.6 10.7 31.9l1.7 1.6L274 276.9v-5.8L50.4 11.5l-1.7 1.6z"
        fill="url(#gp_badge_grad_blue)"
      />
      <path
        d="M349.3 352.3L274 276.9v-5.8l75.3-75.4 1.7 1 89.2 50.7c25.5 14.5 25.5 38.2 0 52.7l-89.2 50.7-1.7 1.5z"
        fill="url(#gp_badge_grad_yellow)"
      />
      <path
        d="M351 350.8L274 273.9 50.4 497.5c8.4 8.9 22.3 10 37.8 1.2l262.8-147.9z"
        fill="url(#gp_badge_grad_red)"
      />
      <path
        d="M351 161.2L88.2 13.3C72.7 4.5 58.8 5.6 50.4 14.5L274 238.1l77-76.9z"
        fill="url(#gp_badge_grad_green)"
      />
      <defs>
        <linearGradient
          id="gp_badge_grad_blue"
          x1="255.8"
          y1="26.7"
          x2="80.6"
          y2="201.9"
          gradientUnits="userSpaceOnUse"
        >
          <stop offset="0" stopColor="#00A0FF" />
          <stop offset="0.007" stopColor="#00A1FF" />
          <stop offset="0.26" stopColor="#00BEFF" />
          <stop offset="0.512" stopColor="#00D2FF" />
          <stop offset="0.76" stopColor="#00DFFF" />
          <stop offset="1" stopColor="#00E3FF" />
        </linearGradient>
        <linearGradient
          id="gp_badge_grad_yellow"
          x1="465"
          y1="256"
          x2="31"
          y2="256"
          gradientUnits="userSpaceOnUse"
        >
          <stop offset="0" stopColor="#FFE000" />
          <stop offset="0.409" stopColor="#FFBD00" />
          <stop offset="0.775" stopColor="#FFA500" />
          <stop offset="1" stopColor="#FF9C00" />
        </linearGradient>
        <linearGradient
          id="gp_badge_grad_red"
          x1="373.8"
          y1="373.5"
          x2="114.3"
          y2="633"
          gradientUnits="userSpaceOnUse"
        >
          <stop offset="0" stopColor="#FF3A44" />
          <stop offset="1" stopColor="#C31162" />
        </linearGradient>
        <linearGradient
          id="gp_badge_grad_green"
          x1="107.4"
          y1="-102.5"
          x2="260.6"
          y2="50.7"
          gradientUnits="userSpaceOnUse"
        >
          <stop offset="0" stopColor="#32A071" />
          <stop offset="0.069" stopColor="#2DA771" />
          <stop offset="0.476" stopColor="#15CF74" />
          <stop offset="0.801" stopColor="#06E775" />
          <stop offset="1" stopColor="#00F076" />
        </linearGradient>
      </defs>
    </svg>
  );
}

/**
 * Resmi Google Play Store İndirme Rozeti (Google Play Badge)
 */
export function GooglePlayBadge({
  className = "",
  variant = "dark",
  subText = "Google Play'DEN",
  url = GOOGLE_PLAY_STORE_URL,
  onClick,
}: GooglePlayBadgeProps) {
  const isLight = variant === "light";
  const isCompact = variant === "compact";

  const handleClick = () => {
    if (typeof navigator !== "undefined" && navigator.vibrate) {
      navigator.vibrate(10);
    }
    if (onClick) onClick();
  };

  if (isCompact) {
    return (
      <a
        href={url}
        target="_blank"
        rel="noopener noreferrer"
        onClick={handleClick}
        aria-label="Google Play Store'dan Zigo uygulamasını indirin"
        className={`tap-scale group inline-flex items-center gap-2 rounded-xl border px-3 py-1.5 transition-all shadow-xs ${
          isLight
            ? "border-slate-300 bg-white text-slate-800 hover:bg-slate-50 hover:border-slate-400"
            : "border-slate-800 bg-black text-white hover:bg-slate-900 hover:border-slate-700"
        } ${className}`}
      >
        <GooglePlayIcon className="size-4 shrink-0 transition-transform group-hover:scale-110" />
        <div className="flex flex-col text-left leading-none">
          <span className="text-[9px] font-bold uppercase tracking-wider text-slate-400">
            {subText}
          </span>
          <span className="text-xs font-black tracking-tight mt-0.5">Google Play</span>
        </div>
      </a>
    );
  }

  return (
    <a
      href={url}
      target="_blank"
      rel="noopener noreferrer"
      onClick={handleClick}
      aria-label="Google Play Store'dan Zigo uygulamasını indirin"
      className={`tap-scale group inline-flex items-center gap-3 rounded-2xl border px-4 py-2.5 transition-all shadow-md select-none ${
        isLight
          ? "border-slate-300 bg-white text-slate-900 hover:bg-slate-50 hover:border-slate-400 shadow-slate-200"
          : "border-slate-800 bg-black text-white hover:bg-slate-950 hover:border-slate-700 shadow-black/40"
      } ${className}`}
    >
      <GooglePlayIcon className="size-6 sm:size-7 shrink-0 transition-transform duration-200 group-hover:scale-110" />
      <div className="flex flex-col text-left leading-none">
        <span
          className={`text-[9px] sm:text-[10px] font-bold uppercase tracking-wider ${
            isLight ? "text-slate-500" : "text-slate-400"
          }`}
        >
          {subText}
        </span>
        <span className="text-sm sm:text-base font-black tracking-tight mt-0.5">
          Google Play
        </span>
      </div>
    </a>
  );
}
