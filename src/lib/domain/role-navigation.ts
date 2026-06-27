import type { ViewerRole } from "@/lib/domain/role-theme";
import type { UserRole } from "@/lib/supabase/database.types";
import { ZIGO_PATHS } from "@/lib/zigo-vocabulary";

export type BottomNavItem = {
  href: string;
  icon: string;
  label: string;
  match: (path: string) => boolean;
};

export type BottomNavLabels = {
  home: string;
  search: string;
  create: string;
  ask: string;
  profile: string;
  micro: string;
  learn: string;
  parentDash: string;
  studio: string;
};

export function getRoleNavLabels(
  role: ViewerRole,
  messages: {
    nav: BottomNavLabels;
    navByRole: {
      student: Pick<BottomNavLabels, "home" | "search" | "learn" | "micro" | "profile">;
      parent: Pick<BottomNavLabels, "home" | "search" | "parentDash" | "ask" | "profile">;
      teacher: Pick<BottomNavLabels, "home" | "search" | "create" | "studio" | "ask" | "profile">;
    };
  },
): BottomNavLabels {
  const { nav, navByRole } = messages;

  if (role === "student") {
    return { ...nav, ...navByRole.student };
  }

  if (role === "parent") {
    return { ...nav, ...navByRole.parent };
  }

  if (role === "teacher") {
    return { ...nav, ...navByRole.teacher };
  }

  return nav;
}

export function getBottomNavItems(
  role: ViewerRole,
  labels: BottomNavLabels,
  options: { canCreateSocialPost: boolean },
): BottomNavItem[] {
  const home: BottomNavItem = {
    href: "/",
    icon: "home",
    label: labels.home,
    match: (path) => path === "/",
  };
  const explore: BottomNavItem = {
    href: "/explore",
    icon: "search",
    label: labels.search,
    match: (path) => path.startsWith("/explore"),
  };
  const profile: BottomNavItem = {
    href: "/profile",
    icon: "profile",
    label: labels.profile,
    match: (path) => path.startsWith("/profile"),
  };

  if (role === "student") {
    return [
      home,
      explore,
      {
        href: "/learn",
        icon: "learn",
        label: labels.learn,
        match: (path) => path.startsWith("/learn") || path.startsWith("/student"),
      },
      {
        href: ZIGO_PATHS.micro,
        icon: "micro",
        label: labels.micro,
        match: (path) => path.startsWith(ZIGO_PATHS.micro),
      },
      profile,
    ];
  }

  if (role === "parent") {
    return [
      home,
      explore,
      {
        href: "/parent",
        icon: "parent",
        label: labels.parentDash,
        match: (path) => path.startsWith("/parent") || path.startsWith("/family"),
      },
      {
        href: "/questions",
        icon: "ask",
        label: labels.ask,
        match: (path) => path.startsWith("/questions"),
      },
      profile,
    ];
  }

  if (role === "teacher") {
    const center: BottomNavItem = options.canCreateSocialPost
      ? {
          href: "/create",
          icon: "create",
          label: labels.create,
          match: (path) => path.startsWith("/create"),
        }
      : {
          href: "/questions",
          icon: "ask",
          label: labels.ask,
          match: (path) => path.startsWith("/questions"),
        };

    return [
      home,
      explore,
      center,
      {
        href: "/teacher",
        icon: "studio",
        label: labels.studio,
        match: (path) => path.startsWith("/teacher"),
      },
      profile,
    ];
  }

  return [
    home,
    explore,
    {
      href: "/questions",
      icon: "ask",
      label: labels.ask,
      match: (path) => path.startsWith("/questions"),
    },
    {
      href: ZIGO_PATHS.micro,
      icon: "micro",
      label: labels.micro,
      match: (path) => path.startsWith(ZIGO_PATHS.micro),
    },
    profile,
  ];
}

export function getHeaderPrimaryAction(role: ViewerRole, canCreateSocialPost: boolean) {
  if (role === "teacher" && canCreateSocialPost) {
    return { href: "/create", isCreate: true as const };
  }
  return { href: "/questions", isCreate: false as const };
}

export function getRoleDashboardHref(role: UserRole | "guest") {
  if (role === "parent") return "/parent";
  if (role === "teacher") return "/teacher";
  if (role === "student") return "/student";
  return "/profiles";
}

export function isStudentGamificationRole(role: ViewerRole) {
  return role === "student";
}

export function isParentSupervisionRole(role: ViewerRole) {
  return role === "parent";
}

export function isTeacherStudioRole(role: ViewerRole) {
  return role === "teacher";
}
