"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";

import {
  isParentSupervisionRole,
  isStudentGamificationRole,
  isTeacherStudioRole,
} from "@/lib/domain/role-navigation";
import type { ViewerRole } from "@/lib/domain/role-theme";
import { useMessages } from "@/lib/i18n/locale-context";

type StickyLessonRequestBarProps = {
  viewerRole: ViewerRole;
};

export function StickyLessonRequestBar({ viewerRole }: StickyLessonRequestBarProps) {
  const pathname = usePathname();
  const m = useMessages();
  const [hasPackageAccess, setHasPackageAccess] = useState(true);
  const [checked, setChecked] = useState(!isParentSupervisionRole(viewerRole));

  useEffect(() => {
    if (!isParentSupervisionRole(viewerRole)) return;

    let cancelled = false;
    void fetch("/api/billing/lesson-packages")
      .then((response) => response.json())
      .then((payload: { data?: { hasAccess?: boolean } }) => {
        if (cancelled) return;
        setHasPackageAccess(Boolean(payload.data?.hasAccess));
        setChecked(true);
      })
      .catch(() => {
        if (cancelled) return;
        setHasPackageAccess(false);
        setChecked(true);
      });

    return () => {
      cancelled = true;
    };
  }, [viewerRole]);

  if (pathname.startsWith("/auth") || pathname.startsWith("/micro") || pathname.startsWith("/sparks")) {
    return null;
  }

  if (isParentSupervisionRole(viewerRole)) {
    if (pathname.startsWith("/parent/requests") || pathname.startsWith("/parent/packages")) return null;
    if (!checked) return null;

    return (
      <div className="zigo-sticky-lesson-bar role-theme-parent">
        {hasPackageAccess ? (
          <Link className="zigo-mobile-cta tap-scale w-full rounded-2xl px-5 py-3.5 text-center" href="/parent/requests">
            {m.ecosystem.stickyRequestLesson}
          </Link>
        ) : (
          <div className="rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-center">
            <p className="text-sm font-black text-amber-900">{m.lessonPackages.expiredTitle}</p>
            <Link className="zigo-mobile-cta tap-scale mt-3 inline-flex rounded-2xl px-5 py-3" href="/parent/packages">
              {m.lessonPackages.renewCta}
            </Link>
          </div>
        )}
      </div>
    );
  }

  if (isTeacherStudioRole(viewerRole)) {
    return (
      <div className="zigo-sticky-lesson-bar role-theme-teacher">
        <Link className="zigo-mobile-cta tap-scale w-full rounded-2xl bg-night px-5 py-3.5 text-center text-white" href="/teacher#lesson-requests">
          {m.ecosystem.stickyLessonRequests}
        </Link>
      </div>
    );
  }

  if (isStudentGamificationRole(viewerRole)) {
    return (
      <div className="zigo-sticky-lesson-bar role-theme-student">
        <Link className="zigo-mobile-cta tap-scale w-full rounded-2xl px-5 py-3.5 text-center" href="/learn">
          {m.ecosystem.stickyStudentLearn}
        </Link>
      </div>
    );
  }

  return null;
}
