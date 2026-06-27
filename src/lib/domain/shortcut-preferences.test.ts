import { describe, expect, it } from "vitest";

import {
  getAvailableShortcutIds,
  getDefaultShortcutPreferences,
  normalizeShortcutPreferences,
  parseShortcutPreferencesJson,
  parseShortcutPreferencesValue,
} from "@/lib/domain/shortcut-preferences";

describe("shortcut-preferences", () => {
  it("returns role-specific defaults", () => {
    const studentDefaults = getDefaultShortcutPreferences("student", { canCreateSocialPost: false });
    expect(studentDefaults.enabled).toBe(true);
    expect(studentDefaults.selectedIds).toContain("student_hub");
    expect(studentDefaults.selectedIds).toContain("student_store");
  });

  it("hides teacher create shortcuts when posting is locked", () => {
    const locked = getAvailableShortcutIds("teacher", { canCreateSocialPost: false });
    expect(locked).not.toContain("teacher_spark");
    expect(locked).toContain("teacher_studio");
  });

  it("normalizes unknown or unavailable ids", () => {
    const normalized = normalizeShortcutPreferences("parent", { canCreateSocialPost: false }, {
      enabled: true,
      selectedIds: ["parent_hub", "teacher_spark", "invalid" as never],
    });

    expect(normalized.selectedIds).toEqual(["parent_hub"]);
  });

  it("parses stored json safely", () => {
    const parsed = parseShortcutPreferencesJson(
      "student",
      { canCreateSocialPost: false },
      JSON.stringify({ enabled: false, selectedIds: ["student_learn", "student_focus"] }),
    );

    expect(parsed.enabled).toBe(false);
    expect(parsed.selectedIds).toEqual(["student_learn", "student_focus"]);
  });

  it("treats empty stored records as unset", () => {
    const unset = parseShortcutPreferencesValue("student", { canCreateSocialPost: false }, {});
    expect(unset).toBeNull();
  });
});
