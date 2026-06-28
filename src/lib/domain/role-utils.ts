import type { UserProfile } from "@/lib/domain/profiles";
import type { UserRole } from "@/lib/supabase/database.types";

export function isPublisherRole(role: UserRole): boolean {
  return role === "teacher" || role === "platform";
}

export function isPlatformRole(role: UserRole): boolean {
  return role === "platform";
}

export function isVerifiedPublisher(
  profile: Pick<UserProfile, "role" | "is_verified">,
): boolean {
  return isPublisherRole(profile.role) && profile.is_verified;
}

export function canPublishSocialContent(
  profile: Pick<UserProfile, "role" | "is_verified">,
): boolean {
  return isVerifiedPublisher(profile);
}
