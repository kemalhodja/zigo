import { getRoleDashboardHref } from "@/lib/domain/role-navigation";
import type { ViewerRole } from "@/lib/domain/role-theme";

export type RoleNextActionCopy = {
  title: string;
  hint: string;
  cta: string;
};

export type RoleNextActionLabels = {
  student: RoleNextActionCopy;
  parent: RoleNextActionCopy;
  teacher: RoleNextActionCopy;
  teacherLocked: RoleNextActionCopy;
  guest: RoleNextActionCopy;
};

export type RoleNextAction = RoleNextActionCopy & {
  href: string;
};

/**
 * One primary job per role — shown in shell so users always know what to do next.
 * Teacher publish stays on /create only; learners never get create CTAs here.
 */
export function resolveRoleNextAction(
  role: ViewerRole,
  canCreateSocialPost: boolean,
  labels: RoleNextActionLabels,
): RoleNextAction {
  if (role === "student") {
    return { ...labels.student, href: "/micro" };
  }

  if (role === "parent") {
    return { ...labels.parent, href: "/family" };
  }

  if (role === "teacher") {
    if (canCreateSocialPost) {
      return { ...labels.teacher, href: "/create" };
    }
    return { ...labels.teacherLocked, href: "/teacher" };
  }

  return { ...labels.guest, href: "/auth" };
}

export function resolveWrongRoleStudioHref(role: ViewerRole) {
  if (role === "guest") return "/auth";
  return getRoleDashboardHref(role);
}
