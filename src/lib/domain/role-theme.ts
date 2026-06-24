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

export function getRoleAccentLabel(role: ViewerRole, messages: Messages = getMessages()) {
  const roles = messages.roles;
  if (role === "student") return roles.student;
  if (role === "parent") return roles.parent;
  if (role === "teacher") return roles.teacher;
  return roles.guest;
}
