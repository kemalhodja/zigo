"use client";

import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect } from "react";

import type { ViewerRole } from "@/lib/domain/role-theme";

async function fetchLessonRequestBadgeCount(): Promise<number> {
  const response = await fetch("/api/lesson-requests/unread-count");
  const payload = (await response.json()) as { count?: number };
  if (!response.ok) return 0;
  return payload.count ?? 0;
}

export function useLessonRequestBadgeCount(viewerRole: ViewerRole) {
  const queryClient = useQueryClient();
  const enabled = viewerRole === "parent" || viewerRole === "teacher" || viewerRole === "platform";

  useEffect(() => {
    if (!enabled) return;

    function refreshBadge() {
      void queryClient.invalidateQueries({ queryKey: ["lesson-request-badge-count"] });
    }

    window.addEventListener("zigo:lesson-request-changed", refreshBadge);
    return () => window.removeEventListener("zigo:lesson-request-changed", refreshBadge);
  }, [enabled, queryClient]);

  return useQuery({
    queryKey: ["lesson-request-badge-count", viewerRole],
    queryFn: fetchLessonRequestBadgeCount,
    enabled,
    staleTime: 30_000,
    refetchInterval: 60_000,
    refetchOnWindowFocus: true,
  });
}
