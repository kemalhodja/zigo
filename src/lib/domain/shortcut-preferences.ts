import { getRoleDashboardHref } from "@/lib/domain/role-navigation";
import type { ViewerRole } from "@/lib/domain/role-theme";
import type { Messages } from "@/lib/i18n/types";
import { ZIGO_PATHS } from "@/lib/zigo-vocabulary";

export type ShortcutIconName =
  | "hub"
  | "focus"
  | "learn"
  | "duels"
  | "family"
  | "requests"
  | "ask"
  | "spark"
  | "micro"
  | "studio"
  | "profile"
  | "store";

export type ShortcutScrollItem = {
  href: string;
  label: string;
  icon: ShortcutIconName;
  primary?: boolean;
};

export type ShortcutId =
  | "student_hub"
  | "student_focus"
  | "student_learn"
  | "student_duels"
  | "student_micro"
  | "student_store"
  | "parent_hub"
  | "parent_family"
  | "parent_learn"
  | "parent_requests"
  | "parent_ask"
  | "teacher_spark"
  | "teacher_micro"
  | "teacher_studio"
  | "teacher_requests"
  | "teacher_ask"
  | "teacher_learn"
  | "guest_ask"
  | "guest_learn"
  | "guest_profile"
  | "guest_micro";

export type ShortcutPreferences = {
  enabled: boolean;
  selectedIds: ShortcutId[];
};

export type ShortcutOptions = {
  canCreateSocialPost: boolean;
};

export const SHORTCUT_PREFS_CHANGED_EVENT = "zigo:shortcut-prefs-changed";
export const SHORTCUT_PREFS_VERSION = 1;

type ShortcutDefinition = {
  href: string;
  icon: ShortcutScrollItem["icon"];
  label: (messages: Messages) => string;
  roles: ViewerRole[];
  requiresCreate?: boolean;
};

const SHORTCUT_DEFINITIONS: Record<ShortcutId, ShortcutDefinition> = {
  student_hub: {
    href: "/student",
    icon: "hub",
    label: (m) => m.dockByRole.student.hub,
    roles: ["student"],
  },
  student_focus: {
    href: "/focus",
    icon: "focus",
    label: (m) => m.dockByRole.student.focus,
    roles: ["student"],
  },
  student_learn: {
    href: "/learn",
    icon: "learn",
    label: (m) => m.dockByRole.student.learn,
    roles: ["student"],
  },
  student_duels: {
    href: "/duels",
    icon: "duels",
    label: (m) => m.dockByRole.student.duels,
    roles: ["student"],
  },
  student_micro: {
    href: ZIGO_PATHS.micro,
    icon: "micro",
    label: (m) => m.navByRole.student.micro,
    roles: ["student"],
  },
  student_store: {
    href: "/store",
    icon: "store",
    label: (m) => m.dashboard.student.store,
    roles: ["student"],
  },
  parent_hub: {
    href: "/parent",
    icon: "hub",
    label: (m) => m.dockByRole.parent.hub,
    roles: ["parent"],
  },
  parent_family: {
    href: "/family",
    icon: "family",
    label: (m) => m.dockByRole.parent.family,
    roles: ["parent"],
  },
  parent_learn: {
    href: "/learn",
    icon: "learn",
    label: (m) => m.dockByRole.parent.learn,
    roles: ["parent"],
  },
  parent_requests: {
    href: "/parent/requests",
    icon: "requests",
    label: (m) => m.dockByRole.parent.requests,
    roles: ["parent"],
  },
  parent_ask: {
    href: "/questions",
    icon: "ask",
    label: (m) => m.dockByRole.parent.ask,
    roles: ["parent"],
  },
  teacher_spark: {
    href: "/create?mode=story",
    icon: "spark",
    label: (m) => m.dockByRole.teacher.spark,
    roles: ["teacher"],
    requiresCreate: true,
  },
  teacher_micro: {
    href: "/create?mode=reel",
    icon: "micro",
    label: (m) => m.dockByRole.teacher.micro,
    roles: ["teacher"],
    requiresCreate: true,
  },
  teacher_studio: {
    href: "/teacher",
    icon: "studio",
    label: (m) => m.dockByRole.teacher.studio,
    roles: ["teacher"],
  },
  teacher_requests: {
    href: "/teacher#lesson-requests",
    icon: "requests",
    label: (m) => m.dockByRole.teacher.requests,
    roles: ["teacher"],
  },
  teacher_ask: {
    href: "/questions",
    icon: "ask",
    label: (m) => m.dockByRole.teacher.ask,
    roles: ["teacher"],
  },
  teacher_learn: {
    href: "/learn",
    icon: "learn",
    label: (m) => m.nav.learn,
    roles: ["teacher"],
  },
  guest_ask: {
    href: "/questions",
    icon: "ask",
    label: (m) => m.nav.ask,
    roles: ["guest"],
  },
  guest_learn: {
    href: "/learn",
    icon: "learn",
    label: (m) => m.dock.learn,
    roles: ["guest"],
  },
  guest_profile: {
    href: "/profiles",
    icon: "profile",
    label: (m) => m.nav.profile,
    roles: ["guest"],
  },
  guest_micro: {
    href: ZIGO_PATHS.micro,
    icon: "micro",
    label: (m) => m.nav.micro,
    roles: ["guest"],
  },
};

export function shortcutPreferencesStorageKey(role: ViewerRole) {
  return `zigo:shortcut-prefs:v${SHORTCUT_PREFS_VERSION}:${role}`;
}

export function getAvailableShortcutIds(role: ViewerRole, options: ShortcutOptions): ShortcutId[] {
  return (Object.entries(SHORTCUT_DEFINITIONS) as Array<[ShortcutId, ShortcutDefinition]>)
    .filter(([, def]) => def.roles.includes(role))
    .filter(([, def]) => !def.requiresCreate || options.canCreateSocialPost)
    .map(([id]) => id);
}

export function getDefaultShortcutPreferences(role: ViewerRole, options: ShortcutOptions): ShortcutPreferences {
  return {
    enabled: true,
    selectedIds: getAvailableShortcutIds(role, options),
  };
}

export function parseShortcutPreferencesJson(
  role: ViewerRole,
  options: ShortcutOptions,
  raw: string | null,
): ShortcutPreferences {
  if (!raw) return getDefaultShortcutPreferences(role, options);

  try {
    const parsed = JSON.parse(raw) as Partial<ShortcutPreferences>;
    return normalizeShortcutPreferences(role, options, {
      enabled: parsed.enabled ?? true,
      selectedIds: Array.isArray(parsed.selectedIds) ? (parsed.selectedIds as ShortcutId[]) : [],
    });
  } catch {
    return getDefaultShortcutPreferences(role, options);
  }
}

export function normalizeShortcutPreferences(
  role: ViewerRole,
  options: ShortcutOptions,
  prefs: ShortcutPreferences,
): ShortcutPreferences {
  const available = new Set(getAvailableShortcutIds(role, options));
  const selectedIds = prefs.selectedIds.filter((id) => available.has(id));

  if (selectedIds.length === 0) {
    return {
      enabled: prefs.enabled,
      selectedIds: getDefaultShortcutPreferences(role, options).selectedIds.slice(0, 1),
    };
  }

  return {
    enabled: prefs.enabled,
    selectedIds,
  };
}

export function resolveShortcutScrollItems(
  role: ViewerRole,
  options: ShortcutOptions,
  prefs: ShortcutPreferences,
  messages: Messages,
): ShortcutScrollItem[] {
  if (!prefs.enabled) return [];

  const dashboardHref = getRoleDashboardHref(role === "guest" ? "guest" : role);
  const primaryId = prefs.selectedIds[0];

  const items: ShortcutScrollItem[] = [];

  for (const id of prefs.selectedIds) {
    const def = SHORTCUT_DEFINITIONS[id];
    if (!def) continue;

    items.push({
      href: id === "guest_profile" ? dashboardHref : def.href,
      icon: def.icon,
      label: def.label(messages),
      primary: id === primaryId,
    });
  }

  return items;
}

export function getShortcutLabel(id: ShortcutId, messages: Messages): string {
  return SHORTCUT_DEFINITIONS[id]?.label(messages) ?? id;
}
