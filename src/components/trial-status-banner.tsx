import Link from "next/link";

type TrialStatusBannerProps = {
  trialDaysLeft: number;
  isTrialActive: boolean;
  isPaidPremium: boolean;
  trialExpired: boolean;
  labels: {
    trialActive: string;
    trialEnding: string;
    subscribeNow: string;
    trialEnded: string;
  };
};

export function TrialStatusBanner({
  trialDaysLeft,
  isTrialActive,
  isPaidPremium,
  trialExpired,
  labels,
}: TrialStatusBannerProps) {
  if (isPaidPremium) {
    return null;
  }

  if (isTrialActive) {
    const copy =
      trialDaysLeft <= 2
        ? labels.trialEnding.replace("{days}", String(trialDaysLeft))
        : labels.trialActive.replace("{days}", String(trialDaysLeft));

    return (
      <section className="-mx-4 bg-gradient-to-r from-violet-50 via-pink-50 to-cyan-50 px-4 py-3">
        <p className="text-sm font-black text-night">{copy}</p>
        <Link className="tap-scale mt-2 inline-flex text-sm font-black text-crystal" href="/profile">
          {labels.subscribeNow}
        </Link>
      </section>
    );
  }

  if (trialExpired) {
    return (
      <section className="-mx-4 bg-amber-50 px-4 py-3">
        <p className="text-sm font-black text-night">{labels.trialEnded}</p>
        <Link className="tap-scale mt-2 inline-flex text-sm font-black text-crystal" href="/profile">
          {labels.subscribeNow}
        </Link>
      </section>
    );
  }

  return null;
}
