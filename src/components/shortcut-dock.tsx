"use client";

import { ShortcutScrollDock } from "@/components/shortcut-scroll-dock";
import { useShortcutPreferences } from "@/lib/client/shortcut-preferences";
import {
  isParentSupervisionRole,
  isStudentGamificationRole,
  isTeacherStudioRole,
} from "@/lib/domain/role-navigation";
import type { ViewerRole } from "@/lib/domain/role-theme";
import { resolveShortcutScrollItems } from "@/lib/domain/shortcut-preferences";
import { useMessages } from "@/lib/i18n/locale-context";

type ShortcutDockProps = {
  canCreateSocialPost: boolean;
  floating?: boolean;
  viewerRole: ViewerRole;
};

export function ShortcutDock({ canCreateSocialPost, floating = false, viewerRole }: ShortcutDockProps) {
  const m = useMessages();
  const { prefs } = useShortcutPreferences(viewerRole, { canCreateSocialPost });
  const items = resolveShortcutScrollItems(viewerRole, { canCreateSocialPost }, prefs, m);

  if (items.length === 0) return null;

  const roleClassName = isStudentGamificationRole(viewerRole)
    ? "role-dock-student border-violet-100"
    : isParentSupervisionRole(viewerRole)
      ? "role-dock-parent border-cyan-100"
      : isTeacherStudioRole(viewerRole)
        ? "role-dock-teacher border-slate-200"
        : "border-violet-100";

  return (
    <ShortcutScrollDock
      ariaLabel={m.dock.shortcuts}
      floating={floating}
      items={items}
      roleClassName={roleClassName}
    />
  );
}

export function useShortcutDockVisible(
  viewerRole: ViewerRole,
  canCreateSocialPost: boolean,
  routeHidden: boolean,
) {
  const { prefs } = useShortcutPreferences(viewerRole, { canCreateSocialPost });
  const m = useMessages();
  const items = resolveShortcutScrollItems(viewerRole, { canCreateSocialPost }, prefs, m);

  return !routeHidden && items.length > 0;
}
