export {
  API_RBAC_PREFIX_RULES,
  type ApiRbacPrefixRule,
  type AuthenticatedAdminContext,
  getApiRbacRule,
  isApiRoleAllowed,
  requirePlatformAdminAccess,
  withAdminApiHandler,
} from "@/features/shared/api/rbac";
