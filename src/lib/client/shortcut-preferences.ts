"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";

import type { ViewerRole } from "@/lib/domain/role-theme";
import {
  getAvailableShortcutIds,
  getDefaultShortcutPreferences,
  normalizeShortcutPreferences,
  parseShortcutPreferencesJson,
  SHORTCUT_PREFS_CHANGED_EVENT,
  type ShortcutId,
  type ShortcutPreferences,
  shortcutPreferencesStorageKey,
} from "@/lib/domain/shortcut-preferences";

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

function preferencesEqual(left: ShortcutPreferences, right: ShortcutPreferences) {
  return (
    left.enabled === right.enabled
    && left.selectedIds.length === right.selectedIds.length
    && left.selectedIds.every((id, index) => id === right.selectedIds[index])
  );
}

async function fetchServerShortcutPreferences() {
  const response = await fetch("/api/profile/shortcut-preferences", { cache: "no-store" });
  if (!response.ok) return null;

  const payload = (await response.json()) as {
    data?: { preferences?: ShortcutPreferences | null };
  };

  return payload.data?.preferences ?? null;
}

async function persistServerShortcutPreferences(prefs: ShortcutPreferences) {
  await fetch("/api/profile/shortcut-preferences", {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(prefs),
  });
}

export function useShortcutPreferences(role: ViewerRole, options: ShortcutOptions) {
  const isGuest = role === "guest";
  const availableIds = useMemo(
    () => getAvailableShortcutIds(role, options),
    [role, options.canCreateSocialPost],
  );

  const [prefs, setPrefs] = useState<ShortcutPreferences>(() => readShortcutPreferences(role, options));
  const serverSyncDoneRef = useRef(false);

  useEffect(() => {
    setPrefs(readShortcutPreferences(role, options));
    serverSyncDoneRef.current = false;
  }, [role, options.canCreateSocialPost]);

  useEffect(() => {
    const sync = () => setPrefs(readShortcutPreferences(role, options));
    window.addEventListener(SHORTCUT_PREFS_CHANGED_EVENT, sync);
    return () => window.removeEventListener(SHORTCUT_PREFS_CHANGED_EVENT, sync);
  }, [role, options.canCreateSocialPost]);

  useEffect(() => {
    if (isGuest || serverSyncDoneRef.current) return;

    let cancelled = false;

    void (async () => {
      try {
        const serverPrefs = await fetchServerShortcutPreferences();
        if (cancelled) return;

        serverSyncDoneRef.current = true;

        if (serverPrefs) {
          const normalized = normalizeShortcutPreferences(role, options, serverPrefs);
          writeShortcutPreferences(role, normalized);
          setPrefs(normalized);
          return;
        }

        const localPrefs = readShortcutPreferences(role, options);
        const defaults = getDefaultShortcutPreferences(role, options);
        if (!preferencesEqual(localPrefs, defaults)) {
          await persistServerShortcutPreferences(localPrefs);
        }
      } catch {
        serverSyncDoneRef.current = true;
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [isGuest, role, options.canCreateSocialPost]);

  const savePreferences = useCallback(
    (next: ShortcutPreferences) => {
      const normalized = normalizeShortcutPreferences(role, options, next);
      writeShortcutPreferences(role, normalized);
      setPrefs(normalized);

      if (!isGuest) {
        void persistServerShortcutPreferences(normalized);
      }
    },
    [isGuest, role, options],
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
