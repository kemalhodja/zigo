export {
  authGateRedirectPath,
  isEmailConfirmed,
  isPublicAuthCheckpointPath,
  isSessionRequiredAuthCheckpointPath,
  requiresEmailConfirmation,
  resolveAuthGate,
  type AuthGate,
} from "@/lib/domain/auth-gates";

export {
  createProfileSchema,
  setInterestsSchema,
  setOrganizationTypeSchema,
  updateUserProfileSchema,
} from "@/lib/domain/profiles";
