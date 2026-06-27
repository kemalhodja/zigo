"use client";

import { useState } from "react";

import { LessonRequestForm } from "@/features/lesson/components/lesson-request-form";
import { LessonPackageGate } from "@/features/live-lessons/components/live-lesson-actions";
import { useMessages } from "@/lib/i18n/locale-context";

type ChildOption = { id: string; name: string };

type RequestLessonCTAProps = {
  teacherId: string;
  teacherName: string;
  childrenOptions?: ChildOption[];
  hasPackageAccess?: boolean;
};

export function RequestLessonCTA({
  teacherId,
  teacherName,
  childrenOptions = [],
  hasPackageAccess = true,
}: RequestLessonCTAProps) {
  const m = useMessages();
  const lr = m.lessonRequests;
  const lp = m.lessonPackages;
  const [open, setOpen] = useState(false);

  return (
    <LessonPackageGate
      hasAccess={hasPackageAccess}
      labels={{
        expired: lp.expiredTitle,
        renew: lp.renewCta,
      }}
    >
      <div className="space-y-3">
        {!open ? (
          <button
            className="tap-scale zigo-mobile-cta w-full rounded-2xl text-center"
            onClick={() => setOpen(true)}
            type="button"
          >
            {lr.requestLessonCta}
          </button>
        ) : (
          <div className="zigo-mobile-card rounded-2xl border border-cyan-100 bg-white shadow-sm">
            <div className="mb-3 flex items-start justify-between gap-3">
              <div>
                <p className="text-xs font-black uppercase tracking-[0.18em] text-crystal">{lr.eyebrow}</p>
                <h2 className="mt-1 text-base font-black text-night">{lr.requestLessonTitle}</h2>
              </div>
              <button
                aria-label={lr.closeForm}
                className="tap-scale rounded-lg bg-slate-100 px-2 py-1 text-xs font-black text-night"
                onClick={() => setOpen(false)}
                type="button"
              >
                ✕
              </button>
            </div>
            <LessonRequestForm
              childrenOptions={childrenOptions}
              compact
              fixedReceiver={{ id: teacherId, name: teacherName }}
              redirectOnSuccess="/parent/requests?sent=1"
            />
          </div>
        )}
      </div>
    </LessonPackageGate>
  );
}
