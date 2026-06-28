import { SubscriptionRequiredError } from "@/lib/domain/domain-errors";
import type { UserSubscription } from "@/lib/domain/subscription";
import type { UserRole } from "@/lib/supabase/database.types";

export const TEACHER_CREATOR_PLUS_BENEFITS = [
  "Yazılı hazırlık linkleri paylaşımı",
  "Mini quiz oluşturma ve feed'e yayınlama",
  "Sponsorlu reklam gönderileri",
] as const;

export function canTeacherUseCreatorPlusTools(
  subscription: UserSubscription,
  role: UserRole | null | undefined,
) {
  return role === "teacher" || role === "platform";
}

export function assertTeacherCreatorPlus(
  subscription: UserSubscription,
  role: UserRole | null | undefined,
  featureLabel: string,
) {
  if (!canTeacherUseCreatorPlusTools(subscription, role)) {
    throw new SubscriptionRequiredError(
      `Bu özellik Zigo Plus aboneliği gerektirir: ${featureLabel}`,
    );
  }
}

export function socialPostRequiresTeacherCreatorPlus(input: {
  premiumPrepLabel?: string | null;
  premiumPrepUrl?: string | null;
  sponsoredLabel?: string | null;
  sponsoredTargetUrl?: string | null;
  postType?: string | null;
  quizId?: string | null;
}) {
  const hasPremiumPrep = Boolean(input.premiumPrepLabel?.trim() && input.premiumPrepUrl?.trim());
  const hasSponsored = Boolean(input.sponsoredLabel?.trim() && input.sponsoredTargetUrl?.trim());
  const isQuizPost = input.postType === "quiz" || Boolean(input.quizId);
  return hasPremiumPrep || hasSponsored || isQuizPost;
}
