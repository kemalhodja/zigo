import type { SupabaseClient } from "@supabase/supabase-js";

import { canUseDevBillingBypass } from "@/lib/domain/billing";
import { getChildProfiles } from "@/lib/domain/children";
import type { EducationOrganizationType } from "@/lib/domain/education-organization";
import { getCurrentProfile, parseOrganizationType } from "@/lib/domain/profiles";
import { shouldHideOrganizationPlanPrices } from "@/lib/domain/registration-account";
import { getUserSubscription } from "@/lib/domain/subscription";
import { resolveProfilePlanGroups, type SubscriptionPlanGroup } from "@/lib/domain/subscription-plans";
import type { Database } from "@/lib/supabase/database.types";

export type ProfileBillingSectionProps = {
  groups: SubscriptionPlanGroup[];
  hidePrices: boolean;
  isPremium: boolean;
  isTrial: boolean;
  userCreatedAt: string | null;
  allowDevActivate: boolean;
  organizationType: EducationOrganizationType | null;
  organizationName: string | null;
};

export async function getProfileBillingSection(
  supabase: SupabaseClient<Database>,
): Promise<ProfileBillingSectionProps | null> {
  const profile = await getCurrentProfile(supabase);
  if (!profile) return null;

  let hasLinkedChildren = false;
  if (profile.role === "parent") {
    const children = await getChildProfiles(supabase);
    hasLinkedChildren = children.length > 0;
  }

  const subscription = await getUserSubscription(supabase, profile.id);
  const organizationType = parseOrganizationType(profile.organization_type);

  return {
    groups: resolveProfilePlanGroups(
      profile.role,
      hasLinkedChildren,
      organizationType,
      profile.created_at,
    ),
    hidePrices: shouldHideOrganizationPlanPrices(organizationType),
    isPremium: subscription.isPremium,
    isTrial: Boolean(subscription.isTrial),
    userCreatedAt: profile.created_at ?? null,
    allowDevActivate: canUseDevBillingBypass(),
    organizationType,
    organizationName: profile.full_name,
  };
}
