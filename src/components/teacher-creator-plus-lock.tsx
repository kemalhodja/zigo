"use client";

import type { ReactNode } from "react";

import { ZigoPlusUpsell } from "@/components/zigo-plus-upsell";
import { TEACHER_CREATOR_PLUS_BENEFITS } from "@/lib/domain/teacher-creator-plus";

type TeacherCreatorPlusLockProps = {
  children: ReactNode;
  description: string;
  isUnlocked: boolean;
  title: string;
  allowDevActivate?: boolean;
};

export function TeacherCreatorPlusLock({
  children,
  description,
  isUnlocked,
  title,
  allowDevActivate = false,
}: TeacherCreatorPlusLockProps) {
  if (isUnlocked) {
    return (
      <div className="space-y-2">
        <p className="text-xs font-black uppercase tracking-wide text-slate-500">{title}</p>
        {children}
      </div>
    );
  }

  return (
    <div className="space-y-2 rounded-lg border border-dashed border-amber-200 bg-amber-50/70 px-3 py-3">
      <p className="text-xs font-black uppercase tracking-wide text-amber-800">{title}</p>
      <p className="text-xs font-semibold leading-5 text-amber-950/80">{description}</p>
      <p className="text-xs font-bold text-amber-900">Paylaşım ve yorum ücretsiz; bu araçlar Zigo Plus ile açılır.</p>
      <ul className="space-y-1 text-xs font-semibold text-amber-950/85">
        {TEACHER_CREATOR_PLUS_BENEFITS.map((benefit) => (
          <li key={benefit}>✦ {benefit}</li>
        ))}
      </ul>
      <ZigoPlusUpsell
        allowDevActivate={allowDevActivate}
        benefits={[...TEACHER_CREATOR_PLUS_BENEFITS]}
        compact
        headline="Öğretmen Creator Plus"
        isPremium={false}
      />
    </div>
  );
}
