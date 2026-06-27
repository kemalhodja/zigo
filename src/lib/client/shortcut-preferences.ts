"use client";

import { useCallback, useEffect, useMemo, useState } from "react";

import {
  getAvailableShortcutIds,
  getDefaultShortcutPreferences,
  normalizeShortcutPreferences,
  parseShortcutPreferencesJson,
  SHORTCUT_PREFS_CHANGED_EVENT,
  shortcutPreferencesStorageKey,
  type ShortcutId,
  type ShortcutPreferences,
} from "@/lib/domain/shortcut-preferences";
import type { ViewerRole } from "@/lib/domain/role-theme";

type ShortcutOptions = {
  canCreateSocialPost: boolean;
};

function readShortcutPreferences(role: ViewerRole, options: ShortcutOptions): ShortcutPreferences {
  if (typeof window === "undefined") {
    return getDefaultShortcutPreferences(role, options);
  }

  try {
    return parseShortcutPreferencesJson(
      role,
      options,
      window.localStorage.getItem(shortcutPreferencesStorageKey(role)),
    );
  } catch {
    return getDefaultShortcutPreferences(role, options);
  }
}

function writeShortcutPreferences(role: ViewerRole, prefs: ShortcutPreferences) {
  window.localStorage.setItem(shortcutPreferencesStorageKey(role), JSON.stringify(prefs));
  window.dispatchEvent(new CustomEvent(SHORTCUT_PREFS_CHANGED_EVENT));
}

export function useShortcutPreferences(role: ViewerRole, options: ShortcutOptions) {
  const availableIds = useMemo(
    () => getAvailableShortcutIds(role, options),
    [role, options.canCreateSocialPost],
  );

  const [prefs, setPrefs] = useState<ShortcutPreferences>(() => readShortcutPreferences(role, options));

  useEffect(() => {
    setPrefs(readShortcutPreferences(role, options));
  }, [role, options.canCreateSocialPost]);

  useEffect(() => {
    const sync = () => setPrefs(readShortcutPreferences(role, options));
    window.addEventListener(SHORTCUT_PREFS_CHANGED_EVENT, sync);
    return () => window.removeEventListener(SHORTCUT_PREFS_CHANGED_EVENT, sync);
  }, [role, options.canCreateSocialPost]);

  const savePreferences = useCallback(
    (next: ShortcutPreferences) => {
      const normalized = normalizeShortcutPreferences(role, options, next);
      writeShortcutPreferences(role, normalized);
      setPrefs(normalized);
    },
    [role, options],
  );

  const setEnabled = useCallback(
    (enabled: boolean) => {
      savePreferences({ ...prefs, enabled });
    },
    [prefs, savePreferences],
  );

  const toggleShortcut = useCallback(
    (id: ShortcutId) => {
      const selected = new Set(prefs.selectedIds);
      if (selected.has(id)) {
        if (selected.size <= 1) return;
        selected.delete(id);
      } else {
        selected.add(id);
      }

      savePreferences({
        ...prefs,
        selectedIds: availableIds.filter((item) => selected.has(item)),
      });
    },
    [availableIds, prefs, savePreferences],
  );

  const resetPreferences = useCallback(() => {
    savePreferences(getDefaultShortcutPreferences(role, options));
  }, [role, options, savePreferences]);

  return {
    availableIds,
    prefs,
    resetPreferences,
    setEnabled,
    toggleShortcut,
  };
}
