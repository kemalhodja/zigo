"use client";

import { useLessonRequestBadgeCount } from "@/features/lesson/hooks/use-lesson-request-badge-count";
import type { ViewerRole } from "@/lib/domain/role-theme";

type LessonRequestNavBadgeProps = {
  fallbackCount?: number;
  viewerRole: ViewerRole;
};

export function LessonRequestNavBadge({ fallbackCount = 0, viewerRole }: LessonRequestNavBadgeProps) {
  const { data } = useLessonRequestBadgeCount(viewerRole);
  const count = data ?? fallbackCount;

  if (count <= 0) return null;

  return (
    <span className="zigo-badge-count absolute right-1 top-0 flex min-w-4 items-center justify-center rounded-full bg-amber-500 px-1 text-white">
      {count > 9 ? "9+" : count}
    </span>
  );
}
