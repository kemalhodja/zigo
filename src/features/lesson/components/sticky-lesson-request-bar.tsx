"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

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

  if (pathname.startsWith("/auth") || pathname.startsWith("/micro") || pathname.startsWith("/sparks")) {
    return null;
  }

  if (isParentSupervisionRole(viewerRole)) {
    if (pathname.startsWith("/parent/requests")) return null;

    return (
      <div className="zigo-sticky-lesson-bar role-theme-parent">
        <Link className="zigo-mobile-cta tap-scale w-full rounded-2xl px-5 py-3.5 text-center" href="/parent/requests">
          {m.ecosystem.stickyRequestLesson}
        </Link>
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
