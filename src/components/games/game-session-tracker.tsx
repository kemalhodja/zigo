"use client";

import type { ReactNode } from "react";

import { useGameSessionTimer } from "@/lib/client/use-game-session-timer";

type GameSessionTrackerProps = {
  userId: string | undefined;
  enabled?: boolean;
  children: ReactNode;
};

export function GameSessionTracker({ userId, enabled = true, children }: GameSessionTrackerProps) {
  useGameSessionTimer(userId, enabled);
  return <>{children}</>;
}
