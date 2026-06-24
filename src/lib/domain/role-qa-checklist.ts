import type { Messages } from "@/lib/i18n/server";

export type RoleQaRole = "student" | "parent" | "teacher" | "admin";

export type RoleQaItem = {
  id: string;
  text: string;
  href?: string;
};

export type RoleQaSection = {
  title: string;
  items: RoleQaItem[];
};

export function getRoleQaRoles(m: Messages): { id: RoleQaRole; label: string }[] {
  const roles = m.ops.roleQa.roles;
  return [
    { id: "student", label: roles.student },
    { id: "parent", label: roles.parent },
    { id: "teacher", label: roles.teacher },
  ];
}

export function getRoleQaChecklists(m: Messages): Record<RoleQaRole, RoleQaSection[]> {
  return m.ops.roleQa.checklists;
}

export function countRoleQaItems(role: RoleQaRole, checklists: Record<RoleQaRole, RoleQaSection[]>) {
  return checklists[role].reduce((total, section) => total + section.items.length, 0);
}

export function countAllRoleQaItems(checklists: Record<RoleQaRole, RoleQaSection[]>, roles: RoleQaRole[]) {
  return roles.reduce((total, role) => total + countRoleQaItems(role, checklists), 0);
}
