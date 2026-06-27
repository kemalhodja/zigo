"use client";

import { useShortcutPreferences } from "@/lib/client/shortcut-preferences";
import type { ViewerRole } from "@/lib/domain/role-theme";
import { getShortcutLabel } from "@/lib/domain/shortcut-preferences";
import { useMessages } from "@/lib/i18n/locale-context";

type ShortcutPreferencesPanelProps = {
  viewerRole: ViewerRole;
  canCreateSocialPost?: boolean;
  className?: string;
};

export function ShortcutPreferencesPanel({
  viewerRole,
  canCreateSocialPost = false,
  className = "",
}: ShortcutPreferencesPanelProps) {
  const m = useMessages();
  const sp = m.shortcutPrefs;
  const { availableIds, prefs, resetPreferences, setEnabled, toggleShortcut } = useShortcutPreferences(
    viewerRole,
    { canCreateSocialPost },
  );

  return (
    <section className={`rounded-2xl border border-slate-100 bg-white p-4 ${className}`}>
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-xs font-black uppercase tracking-[0.16em] text-crystal">{sp.eyebrow}</p>
          <h2 className="mt-1 text-lg font-black text-night">{sp.title}</h2>
          <p className="mt-1 text-sm leading-6 text-slate-600">{sp.description}</p>
        </div>
        <label className="inline-flex shrink-0 items-center gap-2">
          <span className="sr-only">{sp.showBar}</span>
          <input
            checked={prefs.enabled}
            className="size-5 accent-crystal"
            onChange={(event) => setEnabled(event.target.checked)}
            type="checkbox"
          />
        </label>
      </div>

      <p className="mt-3 text-xs font-semibold text-slate-500">{prefs.enabled ? sp.enabledHint : sp.disabledHint}</p>

      <div className={`mt-4 space-y-2 ${prefs.enabled ? "" : "pointer-events-none opacity-45"}`}>
        {availableIds.map((id) => {
          const selected = prefs.selectedIds.includes(id);
          const isLastSelected = selected && prefs.selectedIds.length === 1;

          return (
            <button
              className={`tap-scale flex w-full items-center justify-between rounded-xl border px-3 py-3 text-left transition ${
                selected
                  ? "border-violet-200 bg-violet-50 text-night"
                  : "border-slate-100 bg-slate-50 text-slate-600"
              }`}
              disabled={isLastSelected}
              key={id}
              onClick={() => toggleShortcut(id)}
              type="button"
            >
              <span className="text-sm font-black">{getShortcutLabel(id, m)}</span>
              <span
                className={`rounded-full px-2 py-0.5 text-[0.62rem] font-black uppercase tracking-wide ${
                  selected ? "bg-crystal text-white" : "bg-white text-slate-500 ring-1 ring-slate-200"
                }`}
              >
                {selected ? sp.selected : sp.add}
              </span>
            </button>
          );
        })}
      </div>

      <button
        className="tap-scale mt-4 w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm font-black text-slate-700"
        onClick={resetPreferences}
        type="button"
      >
        {sp.reset}
      </button>
    </section>
  );
}
