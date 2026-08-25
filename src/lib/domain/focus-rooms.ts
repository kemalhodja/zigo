/**
 * Realtime focus rooms — shared catalog and wall-clock synced Pomodoro math.
 *
 * Sync strategy: focus/break blocks are anchored to wall-clock time (30-minute
 * blocks starting at :00 and :30). Every client computes the phase from
 * Date.now(), so there is no host, no drift and no server round-trip.
 */

export type FocusRoomKind = "silent" | "voice";

export type FocusRoomDef = {
  slug: string;
  name: string;
  kind: FocusRoomKind;
  description: string;
};

export const FOCUS_ROOMS: FocusRoomDef[] = [
  {
    slug: "sessiz-odak",
    name: "Sessiz Odaklanma",
    kind: "silent",
    description: "Kamera ve ses yok. Sadece birlikte çalışma disiplini.",
  },
  {
    slug: "lgs-matematik",
    name: "LGS Matematik Kampı",
    kind: "silent",
    description: "Matematik soru çözenler için odak blokları.",
  },
  {
    slug: "yks-hazirlik",
    name: "YKS Hazırlık Salonu",
    kind: "silent",
    description: "TYT/AYT maratonu. Bloklar 25 dakika.",
  },
  {
    slug: "serbest",
    name: "Serbet Çalışma",
    kind: "silent",
    description: "Her konudan, her sınıftan — sadece birlikte olalım.",
  },
];

export const FOCUS_SECONDS = 25 * 60;
export const BLOCK_SECONDS = 30 * 60;

export type RoomPhase = {
  phase: "focus" | "break";
  secondsRemaining: number;
  /** Index of the current block since the epoch — stable across clients. */
  blockIndex: number;
};

/** Computes the current globally-synced pomodoro phase for a timestamp. */
export function getRoomPhase(nowMs: number = Date.now()): RoomPhase {
  const totalSeconds = Math.floor(nowMs / 1000);
  const blockIndex = Math.floor(totalSeconds / BLOCK_SECONDS);
  const intoBlock = totalSeconds % BLOCK_SECONDS;

  if (intoBlock < FOCUS_SECONDS) {
    return { phase: "focus", secondsRemaining: FOCUS_SECONDS - intoBlock, blockIndex };
  }
  return { phase: "break", secondsRemaining: BLOCK_SECONDS - intoBlock, blockIndex };
}

export function formatCountdown(totalSeconds: number): string {
  const safe = Math.max(0, Math.floor(totalSeconds));
  const minutes = Math.floor(safe / 60);
  const seconds = safe % 60;
  return `${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`;
}

export function getRoomBySlug(slug: string): FocusRoomDef | undefined {
  return FOCUS_ROOMS.find((room) => room.slug === slug);
}
