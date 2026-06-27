import { describe, expect, it } from "vitest";

import {
  getAvailableShortcutIds,
  getDefaultShortcutPreferences,
  normalizeShortcutPreferences,
} from "@/lib/domain/shortcut-preferences";

describe("shortcut preferences", () => {
  it("returns role defaults", () => {
    expect(getDefaultShortcutPreferences("student", { canCreateSocialPost: false }).selectedIds).toEqual([
      "hub",
      "focus",
      "learn",
      "duels",
      "micro",
      "store",
    ]);
  });

  it("drops unavailable teacher create shortcuts", () => {
    const prefs = normalizeShortcutPreferences(
      "teacher",
      { canCreateSocialPost: false },
      { enabled: true, selectedIds: ["spark", "micro", "studio"] },
    );

    expect(prefs.selectedIds).toEqual(["studio"]);
  });

  it("keeps at least one shortcut when selection becomes empty", () => {
    const prefs = normalizeShortcutPreferences(
      "parent",
      { canCreateSocialPost: false },
      { enabled: false, selectedIds: ["missing" as never] },
    );

    expect(prefs.selectedIds).toEqual(getAvailableShortcutIds("parent", { canCreateSocialPost: false }));
  });
});
