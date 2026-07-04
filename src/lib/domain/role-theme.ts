import { getMessages } from "@/lib/i18n";
import type { Messages } from "@/lib/i18n/types";
import type { UserRole } from "@/lib/supabase/database.types";

export type ViewerRole = UserRole | "guest";

export function getRoleThemeClass(role: ViewerRole) {
  if (role === "student") return "role-theme-student";
  if (role === "parent") return "role-theme-parent";
  if (role === "teacher") return "role-theme-teacher";
  return "role-theme-guest";
}

export function getRoleAccentLabel(
  role: ViewerRole,
  messages: Messages = getMessages(),
  options?: { isPlatformAdmin?: boolean },
) {
  const roles = messages.roles;
  if (options?.isPlatformAdmin) return roles.platformAdmin;
  if (role === "student") return roles.student;
  if (role === "parent") return roles.parent;
  if (role === "teacher") return roles.teacher;
  return roles.guest;
}

export function getRoleThemeColor(role: ViewerRole) {
  if (role === "student") return "#7C3AED";
  if (role === "parent") return "#0891B2";
  if (role === "teacher") return "#101828";
  return "#7C3AED";
}
