import type { ShortcutScrollItem } from "@/components/shortcut-scroll-dock";
import { getRoleDashboardHref } from "@/lib/domain/role-navigation";
import type { ViewerRole } from "@/lib/domain/role-theme";
import type { ShortcutId } from "@/lib/domain/shortcut-preferences";
import type { Messages } from "@/lib/i18n/types";
import { ZIGO_PATHS } from "@/lib/zigo-vocabulary";

export function buildShortcutCatalog(
  messages: Messages,
  role: ViewerRole,
  options: { canCreateSocialPost: boolean },
): Partial<Record<ShortcutId, ShortcutScrollItem>> {
  const d = messages.dock;
  const dock = messages.dockByRole;
  const dashboardHref = getRoleDashboardHref(role === "guest" ? "guest" : role);

  const catalog: Partial<Record<ShortcutId, ShortcutScrollItem>> = {
    hub: {
      href: role === "parent" ? "/parent" : "/student",
      label: role === "parent" ? dock.parent.hub : dock.student.hub,
      icon: "hub",
      primary: true,
    },
    focus: { href: "/focus", label: dock.student.focus, icon: "focus" },
    learn: {
      href: "/learn",
      label: role === "parent" ? dock.parent.learn : role === "student" ? dock.student.learn : messages.nav.learn,
      icon: "learn",
    },
    duels: { href: "/duels", label: dock.student.duels, icon: "duels" },
    store: { href: "/store", label: messages.dashboard.student.store, icon: "store" },
    family: { href: "/family", label: dock.parent.family, icon: "family" },
    requests: {
      href: role === "parent" ? "/parent/requests" : "/teacher#lesson-requests",
      label: role === "parent" ? dock.parent.requests : dock.teacher.requests,
      icon: "requests",
    },
    ask: {
      href: "/questions",
      label: role === "parent" ? dock.parent.ask : role === "teacher" ? dock.teacher.ask : messages.nav.ask,
      icon: "ask",
    },
    spark: {
      href: "/create?mode=story",
      label: dock.teacher.spark,
      icon: "spark",
      primary: true,
    },
    micro: {
      href: role === "teacher" ? "/create?mode=reel" : ZIGO_PATHS.micro,
      label: role === "teacher" ? dock.teacher.micro : role === "student" ? messages.navByRole.student.micro : messages.nav.micro,
      icon: "micro",
      primary: role === "teacher",
    },
    studio: {
      href: "/teacher",
      label: dock.teacher.studio,
      icon: "studio",
      primary: !options.canCreateSocialPost,
    },
    profile: { href: dashboardHref, label: messages.nav.profile, icon: "profile" },
  };

  if (role === "guest") {
    catalog.ask = { href: "/questions", label: messages.nav.ask, icon: "ask", primary: true };
    catalog.learn = { href: "/learn", label: d.learn, icon: "learn" };
  }

  return catalog;
}

export function resolveShortcutItems(
  catalog: Partial<Record<ShortcutId, ShortcutScrollItem>>,
  selectedIds: ShortcutId[],
): ShortcutScrollItem[] {
  return selectedIds
    .map((id) => catalog[id])
    .filter((item): item is ShortcutScrollItem => Boolean(item))
    .map((item, index) => ({
      ...item,
      primary: index === 0 ? (item.primary ?? true) : false,
    }));
}
