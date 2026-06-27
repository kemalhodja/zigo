export {
  type AuthGate,
  authGateRedirectPath,
  isEmailConfirmed,
  isPublicAuthCheckpointPath,
  isSessionRequiredAuthCheckpointPath,
  requiresEmailConfirmation,
  resolveAuthGate,
} from "@/lib/domain/auth-gates";
export {
  createProfileSchema,
  setInterestsSchema,
  setOrganizationTypeSchema,
  updateUserProfileSchema,
} from "@/lib/domain/profiles";
