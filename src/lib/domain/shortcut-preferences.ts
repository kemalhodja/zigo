import type { ViewerRole } from "@/lib/domain/role-theme";

export type ShortcutId =
  | "hub"
  | "focus"
  | "learn"
  | "duels"
  | "micro"
  | "store"
  | "family"
  | "requests"
  | "ask"
  | "spark"
  | "studio"
  | "profile";

export type ShortcutPreferences = {
  enabled: boolean;
  selectedIds: ShortcutId[];
};

export const SHORTCUT_PREFS_CHANGED_EVENT = "zigo:shortcut-prefs-changed";

export function shortcutPreferencesStorageKey(role: ViewerRole): string {
  return `zigo:shortcut-prefs:${role}`;
}

export function getAvailableShortcutIds(
  role: ViewerRole,
  options: { canCreateSocialPost: boolean },
): ShortcutId[] {
  if (role === "student") {
    return ["hub", "focus", "learn", "duels", "micro", "store"];
  }

  if (role === "parent") {
    return ["hub", "family", "learn", "requests", "ask"];
  }

  if (role === "teacher") {
    const base: ShortcutId[] = ["studio", "requests", "ask", "learn"];
    if (options.canCreateSocialPost) {
      return ["spark", "micro", ...base];
    }
    return base;
  }

  return ["ask", "learn", "profile", "micro"];
}

export function getDefaultShortcutPreferences(
  role: ViewerRole,
  options: { canCreateSocialPost: boolean },
): ShortcutPreferences {
  return {
    enabled: true,
    selectedIds: getAvailableShortcutIds(role, options),
  };
}

export function normalizeShortcutPreferences(
  role: ViewerRole,
  options: { canCreateSocialPost: boolean },
  raw: Partial<ShortcutPreferences> | null | undefined,
): ShortcutPreferences {
  const available = getAvailableShortcutIds(role, options);
  const defaults = getDefaultShortcutPreferences(role, options);

  if (!raw || typeof raw !== "object") {
    return defaults;
  }

  const enabled = typeof raw.enabled === "boolean" ? raw.enabled : defaults.enabled;
  const selectedIds = Array.isArray(raw.selectedIds)
    ? raw.selectedIds.filter((id): id is ShortcutId => available.includes(id as ShortcutId))
    : defaults.selectedIds;

  return {
    enabled,
    selectedIds: selectedIds.length > 0 ? selectedIds : defaults.selectedIds,
  };
}

export function parseShortcutPreferencesJson(
  role: ViewerRole,
  options: { canCreateSocialPost: boolean },
  json: string | null,
): ShortcutPreferences {
  if (!json) {
    return getDefaultShortcutPreferences(role, options);
  }

  try {
    return normalizeShortcutPreferences(role, options, JSON.parse(json) as Partial<ShortcutPreferences>);
  } catch {
    return getDefaultShortcutPreferences(role, options);
  }
}

export function orderShortcutIds(selectedIds: ShortcutId[], available: ShortcutId[]): ShortcutId[] {
  const picked = new Set(selectedIds);
  return available.filter((id) => picked.has(id));
}
