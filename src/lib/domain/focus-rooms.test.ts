import { describe, expect, it } from "vitest";

import {
  BLOCK_SECONDS,
  FOCUS_ROOMS,
  FOCUS_SECONDS,
  formatCountdown,
  getRoomBySlug,
  getRoomPhase,
} from "@/lib/domain/focus-rooms";

describe("getRoomPhase", () => {
  it("returns focus with correct remaining time at block start", () => {
    // Epoch second 0 = a block boundary
    const phase = getRoomPhase(0);
    expect(phase.phase).toBe("focus");
    expect(phase.secondsRemaining).toBe(FOCUS_SECONDS);
    expect(phase.blockIndex).toBe(0);
  });

  it("switches to break after the focus window", () => {
    const atBreakStart = (FOCUS_SECONDS + 1) * 1000;
    const phase = getRoomPhase(atBreakStart);
    expect(phase.phase).toBe("break");
    expect(phase.secondsRemaining).toBe(BLOCK_SECONDS - FOCUS_SECONDS - 1);
  });

  it("starts a new block index after each 30-minute block", () => {
    const nextBlockStart = BLOCK_SECONDS * 1000;
    const phase = getRoomPhase(nextBlockStart);
    expect(phase.blockIndex).toBe(1);
    expect(phase.phase).toBe("focus");
  });

  it("produces identical phases for any two clients at the same instant", () => {
    const now = Date.now();
    const a = getRoomPhase(now);
    const b = getRoomPhase(now);
    expect(a).toEqual(b);
  });
});

describe("formatCountdown", () => {
  it("formats minutes and seconds with zero padding", () => {
    expect(formatCountdown(65)).toBe("01:05");
    expect(formatCountdown(0)).toBe("00:00");
    expect(formatCountdown(FOCUS_SECONDS)).toBe("25:00");
  });

  it("clamps negative values to zero", () => {
    expect(formatCountdown(-5)).toBe("00:00");
  });
});

describe("room catalog", () => {
  it("has unique slugs", () => {
    const slugs = FOCUS_ROOMS.map((room) => room.slug);
    expect(new Set(slugs).size).toBe(slugs.length);
  });

  it("resolves rooms by slug", () => {
    expect(getRoomBySlug("sessiz-odak")?.name).toContain("Odak");
    expect(getRoomBySlug("yok")).toBeUndefined();
  });
});
