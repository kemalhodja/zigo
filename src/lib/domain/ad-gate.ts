export type AdGateDecisionInput = {
  isAdFree: boolean;
};

export type AdGateDecision = {
  canProceed: boolean;
  requiresAd: boolean;
};

/**
 * Sponsor-only product: no rewarded consumer ads.
 * Always allow gated actions; sponsored placements are separate.
 */
export function decideAdGate(_input: AdGateDecisionInput): AdGateDecision {
  return {
    canProceed: true,
    requiresAd: false,
  };
}
