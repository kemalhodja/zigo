export {
  API_RBAC_PREFIX_RULES,
  getApiRbacRule,
  isApiRoleAllowed,
  requirePlatformAdminAccess,
  withAdminApiHandler,
  type AuthenticatedAdminContext,
  type ApiRbacPrefixRule,
} from "@/features/shared/api/rbac";
