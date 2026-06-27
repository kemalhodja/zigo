"use client";

import { ShortcutPreferencesPanel } from "@/components/shortcut-preferences-panel";
import type { ViewerRole } from "@/lib/domain/role-theme";

type ProfileShortcutSettingsProps = {
  viewerRole: ViewerRole;
  canCreateSocialPost?: boolean;
};

export function ProfileShortcutSettings({
  viewerRole,
  canCreateSocialPost = false,
}: ProfileShortcutSettingsProps) {
  return (
    <ShortcutPreferencesPanel
      canCreateSocialPost={canCreateSocialPost}
      className="-mx-0"
      viewerRole={viewerRole}
    />
  );
}
