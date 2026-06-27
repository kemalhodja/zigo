"use client";

import { buildShortcutCatalog } from "@/lib/client/shortcut-catalog";
import { useShortcutPreferences } from "@/lib/client/shortcut-preferences";
import type { ViewerRole } from "@/lib/domain/role-theme";
import type { ShortcutId } from "@/lib/domain/shortcut-preferences";
import { useMessages } from "@/lib/i18n/locale-context";

type ShortcutPreferencesPanelProps = {
  viewerRole: ViewerRole;
  canCreateSocialPost?: boolean;
};

export function ShortcutPreferencesPanel({
  viewerRole,
  canCreateSocialPost = false,
}: ShortcutPreferencesPanelProps) {
  const m = useMessages();
  const copy = m.dock.shortcutSettings;
  const { availableIds, prefs, resetPreferences, setEnabled, toggleShortcut } = useShortcutPreferences(
    viewerRole,
    { canCreateSocialPost },
  );
  const catalog = buildShortcutCatalog(m, viewerRole, { canCreateSocialPost });

  return (
    <section className="-mx-4 border-y border-slate-100 bg-white px-4 py-4">
      <p className="text-xs font-black uppercase tracking-[0.18em] text-crystal">{copy.eyebrow}</p>
      <h2 className="mt-1 text-lg font-black text-night">{copy.title}</h2>
      <p className="mt-2 text-sm leading-6 text-slate-600">{copy.description}</p>

      <label className="mt-4 flex items-center justify-between gap-3 rounded-xl bg-slate-50 px-4 py-3 ring-1 ring-inset ring-slate-100">
        <span className="text-sm font-black text-night">{copy.enabled}</span>
        <input
          checked={prefs.enabled}
          className="size-5 accent-crystal"
          onChange={(event) => setEnabled(event.target.checked)}
          type="checkbox"
        />
      </label>

      <div className={`mt-4 space-y-2 ${prefs.enabled ? "" : "pointer-events-none opacity-45"}`}>
        <p className="text-xs font-black uppercase tracking-wide text-slate-500">{copy.pick}</p>
        {availableIds.map((id) => {
          const item = catalog[id];
          if (!item) return null;
          const checked = prefs.selectedIds.includes(id);

          return (
            <label
              className="flex items-center justify-between gap-3 rounded-xl border border-slate-100 bg-white px-4 py-3"
              key={id}
            >
              <span className="text-sm font-bold text-night">{item.label}</span>
              <input
                checked={checked}
                className="size-5 accent-crystal"
                onChange={() => toggleShortcut(id as ShortcutId)}
                type="checkbox"
              />
            </label>
          );
        })}
      </div>

      <button
        className="tap-scale mt-4 w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm font-black text-slate-700"
        onClick={resetPreferences}
        type="button"
      >
        {copy.reset}
      </button>
    </section>
  );
}
