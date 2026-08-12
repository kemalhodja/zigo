"use client";

import { useMemo } from "react";

export function useFeedPostState(enterDelayMs: number = 0) {
  const containerStyle = useMemo(() => {
    return enterDelayMs > 0 ? { animationDelay: `${enterDelayMs}ms` } : undefined;
  }, [enterDelayMs]);

  return {
    containerStyle,
  };
}
