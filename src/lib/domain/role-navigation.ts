import type { ViewerRole } from "@/lib/domain/role-theme";
import type { UserRole } from "@/lib/supabase/database.types";
import { ZIGO_PATHS } from "@/lib/zigo-vocabulary";

export const ROLE_BACK: Record<UserRole, { href: string; label: string }> = {
  student: { href: "/student", label: "Öğrenci Paneli" },
  parent: { href: "/parent", label: "Veli Paneli" },
  teacher: { href: "/teacher", label: "Öğretmen Stüdyosu" },
  education_institution: { href: "/teacher", label: "Kurum Paneli" },
  education_platform: { href: "/teacher", label: "Platform Paneli" },
  publisher: { href: "/teacher", label: "Yayınevi Paneli" },
};

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

  // Guest: no student/teacher tools mixed in
  return [
    home,
    explore,
    {
      href: "/auth",
      icon: "profile",
      label: labels.profile,
      match: (path) => path.startsWith("/auth") || path.startsWith("/profile"),
    },
  ];
}

export function getAdminNavItems(labels: { admin: string; profile: string }): BottomNavItem[] {
  return [
    {
      href: "/admin",
      icon: "admin",
      label: labels.admin,
      match: (path) => path.startsWith("/admin"),
    },
    {
      href: "/moderation",
      icon: "moderation",
      label: "Moderasyon",
      match: (path) => path.startsWith("/moderation"),
    },
    {
      href: "/profile",
      icon: "profile",
      label: labels.profile,
      match: (path) => path.startsWith("/profile"),
    },
  ];
}


export function getHeaderPrimaryAction(
  role: ViewerRole,
  canCreateSocialPost: boolean,
  options?: { isPlatformAdmin?: boolean },
) {
  if (options?.isPlatformAdmin) {
    return { href: "/admin", isCreate: false as const, isAdmin: true as const };
  }
  if (role === "teacher" && canCreateSocialPost) {
    return { href: "/create", isCreate: true as const, isAdmin: false as const };
  }
  if (role === "teacher") {
    return { href: "/teacher", isCreate: false as const, isAdmin: false as const };
  }
  if (role === "student") {
    return { href: "/learn", isCreate: false as const, isAdmin: false as const };
  }
  if (role === "parent") {
    return { href: "/questions", isCreate: false as const, isAdmin: false as const };
  }
  return { href: "/auth", isCreate: false as const, isAdmin: false as const };
}


export function getRoleDashboardHref(role: UserRole | "guest" | ViewerRole) {
  if (role === "parent") return "/family";
  if (role === "teacher") return "/teacher";
  if (role === "student") return "/student";
  return "/auth";
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

/** Student-only learning surfaces (quiz, duel, focus, points). */
export function canAccessStudentLearning(role: ViewerRole | UserRole | null | undefined) {
  return role === "student";
}

/** Parent may open child-scoped learn hub; not student gamification docks. */
export function canAccessParentChildLearn(role: ViewerRole | UserRole | null | undefined) {
  return role === "parent" || role === "student";
}

export function canCreateContent(role: ViewerRole | UserRole | null | undefined) {
  return role === "teacher";
}

export function emptyProfilePrimaryHref(role: ViewerRole | UserRole | "guest" | null | undefined) {
  if (role === "teacher") return "/teacher";
  if (role === "student") return "/student";
  if (role === "parent") return "/family";
  return "/auth";
}
