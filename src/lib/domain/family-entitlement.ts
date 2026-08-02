/**
 * Family Plus covers linked child_profiles under the parent session.
 * Child profiles are not separate auth users; premium gates resolve on the parent.
 */

export type FamilyEntitlementSummary = {
  childCount: number;
  coveredChildCount: number;
  childrenCovered: boolean;
  unlocksChildAnalytics: boolean;
  unlocksChildActivityTimeline: boolean;
  unlocksAdFreeParentSession: boolean;
};

export function areLinkedChildrenCoveredByParentPremium(isParentPremium: boolean) {
  return isParentPremium;
}

export function buildFamilyEntitlementSummary(input: {
  isParentPremium: boolean;
  childCount: number;
}): FamilyEntitlementSummary {
  const childCount = Math.max(0, input.childCount);
  const childrenCovered = areLinkedChildrenCoveredByParentPremium(input.isParentPremium);

  return {
    childCount,
    coveredChildCount: childrenCovered ? childCount : 0,
    childrenCovered,
    unlocksChildAnalytics: childrenCovered,
    unlocksChildActivityTimeline: childrenCovered,
    unlocksAdFreeParentSession: childrenCovered,
  };
}
