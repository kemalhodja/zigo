// src/components/SubscribeButton.tsx

"use client";

import Link from "next/link";

interface SubscribeButtonProps {
  className?: string;
  buttonText?: string;
}

/**
 * SubscribeButton – renders a link that directs users to the plans section
 * where they can see the plans, prices, and choose between Monthly/Yearly.
 */
export function SubscribeButton({
  className = "flex w-full flex-col items-center justify-center gap-0.5 rounded-xl bg-gradient-to-r from-amber-400 to-orange-500 px-5 py-3 text-sm font-black text-slate-950 shadow-lg transition-all hover:brightness-105 tap-scale",
  buttonText = "ZigoPlus'a Geç / Abone Ol",
}: SubscribeButtonProps) {
  return (
    <Link href="#zigo-plus-plans" className={className}>
      <span>{buttonText}</span>
      <span className="mt-0.5 rounded-full bg-white/20 px-2 py-0.5 text-[0.65rem] font-bold uppercase tracking-wider text-amber-900/80 backdrop-blur-sm">
        İlk 30 Güne Özel %50 İndirim
      </span>
    </Link>
  );
}

