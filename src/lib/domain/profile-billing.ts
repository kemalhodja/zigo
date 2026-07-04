import type { SupabaseClient } from "@supabase/supabase-js";

import { canUseDevBillingBypass } from "@/lib/domain/billing";
import { getChildProfiles } from "@/lib/domain/children";
import { getCurrentProfile, parseOrganizationType } from "@/lib/domain/profiles";
import { shouldHideOrganizationPlanPrices } from "@/lib/domain/registration-account";
import { getUserSubscription } from "@/lib/domain/subscription";
import { resolveProfilePlanGroups, type SubscriptionPlanGroup } from "@/lib/domain/subscription-plans";
import type { Database } from "@/lib/supabase/database.types";

export type ProfileBillingSectionProps = {
  groups: SubscriptionPlanGroup[];
  hidePrices: boolean;
  isPremium: boolean;
  allowDevActivate: boolean;
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

  return {
    groups: resolveProfilePlanGroups(
      profile.role,
      hasLinkedChildren,
      parseOrganizationType(profile.organization_type),
    ),
    hidePrices: shouldHideOrganizationPlanPrices(parseOrganizationType(profile.organization_type)),
    isPremium: subscription.isPremium,
    allowDevActivate: canUseDevBillingBypass(),
  };
}
