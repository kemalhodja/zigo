export {
  ADMIN_PATH_PREFIX,
  AUTH_LOGIN_PATH,
  getRequiredRolesForPath,
  getRoleRedirectForPath,
  isAdminPath,
  isRoleAllowedOnPath,
  resolveAdminPageRedirect,
  resolveDashboardAliasRedirect,
  resolveRbacRedirect,
  ROLE_PATH_RULES,
} from "@/features/shared/authorization/page-prefix-rules";
export type { RolePathRule } from "@/features/shared/authorization/types";
