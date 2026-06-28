import type { UserRole } from "@/lib/supabase/database.types";

export type { UserRole };

export const USER_ROLES = ["teacher", "parent", "student", "platform"] as const satisfies readonly UserRole[];

export type RegistrationAccountKind = "student" | "parent" | "teacher" | "institution" | "platform";

export const ROLE_ROUTE_PREFIXES: Record<UserRole, string[]> = {
  teacher: ["/teacher"],
  parent: ["/parent", "/family"],
  student: ["/student", "/learn", "/avatar", "/store"],
  platform: ["/platform"],
};
