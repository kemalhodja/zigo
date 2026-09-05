import { headers } from "next/headers";
import Link from "next/link";
import { redirect } from "next/navigation";

import { BankTransferCheckoutPanel } from "@/components/bank-transfer-checkout-panel";
import { LegalLayout } from "@/components/legal-layout";
import { StateCard } from "@/components/state-card";
import { WhatsAppSupportCard } from "@/components/whatsapp-support-card";
import { hasSupabaseEnv } from "@/lib/config";
import {
  getBankTransferAccounts,
  getUserBankTransferRequests,
  hasBankTransferConfigured,
  resolveBankTransferPlan,
} from "@/lib/domain/bank-transfer";
import { getBillingPlatformMessage, isAndroidCapacitorUserAgent } from "@/lib/domain/billing-platform";
import {
  buildOrganizationSalesWhatsAppUrl,
  shouldBlockSelfServeOrgCheckout,
} from "@/lib/domain/organization-sales";
import { getCurrentProfile, parseOrganizationType } from "@/lib/domain/profiles";
import { isSubscriptionCampaignActive } from "@/lib/domain/subscription-campaign";
import { getServerMessages } from "@/lib/i18n/server";
import { createClient } from "@/lib/supabase/server";

type BillingHavalePageProps = {
  searchParams: Promise<{ planId?: string }>;
};

export default async function BillingHavalePage({ searchParams }: BillingHavalePageProps) {
  const { planId = "zigo-plus-student-monthly" } = await searchParams;
  const messages = await getServerMessages();
  const h = messages.billingUi.havale;

  const reqHeaders = await headers();
  const userAgent = reqHeaders.get("user-agent");
  if (isAndroidCapacitorUserAgent(userAgent)) {
    redirect(`/pricing?openPlay=1&planId=${encodeURIComponent(planId)}`);
  }

  if (!hasSupabaseEnv()) {
    return (
      <StateCard
        action={
          <Link className="font-black text-crystal" href="/setup">
            {h.openSetup}
          </Link>
        }
        description={h.setupMissingDesc}
        title={h.setupMissingTitle}
      />
    );
  }

  const supabase = await createClient();
  const profile = await getCurrentProfile(supabase);
  if (!profile) {
    redirect(`/auth?next=${encodeURIComponent(`/billing/havale?planId=${planId}`)}`);
  }

  let planBundle;
  try {
    planBundle = resolveBankTransferPlan(planId, profile.created_at);
  } catch {
    return (
      <StateCard
        action={
          <Link className="font-black text-crystal" href="/profile">
            {h.backProfile}
          </Link>
        }
        description={h.invalidPlanDesc}
        title={h.invalidPlanTitle}
      />
    );
  }

  const organizationType = parseOrganizationType(profile.organization_type);
  if (shouldBlockSelfServeOrgCheckout(organizationType, planId)) {
    const salesUrl = buildOrganizationSalesWhatsAppUrl({
      organizationType,
      organizationName: profile.full_name,
      planTitle: planBundle.group.title,
    });
    return (
      <StateCard
        action={
          salesUrl ? (
            <a className="font-black text-crystal" href={salesUrl} rel="noopener noreferrer" target="_blank">
              {h.orgSalesCta}
            </a>
          ) : (
            <Link className="font-black text-crystal" href="/profile">
              {h.backProfile}
            </Link>
          )
        }
        description={h.orgSalesDesc}
        title={h.orgSalesTitle}
      />
    );
  }

  let pendingRequest = null;
  try {
    const requests = await getUserBankTransferRequests(supabase, profile.id);
    pendingRequest = requests.find((item) => item.plan_id === planId && item.status === "pending") ?? null;
  } catch {
    pendingRequest = null;
  }

  const configured = hasBankTransferConfigured();
  const banks = getBankTransferAccounts();

  return (
    <LegalLayout title={h.pageTitle}>
      <p>{h.pageIntro}</p>
      <BankTransferCheckoutPanel
        amountTry={planBundle.plan.priceTry}
        banks={banks}
        campaignActive={isSubscriptionCampaignActive()}
        compareAtTry={planBundle.plan.compareAtTry}
        configured={configured}
        initialRequest={pendingRequest}
        planId={planId}
        planLabel={`${planBundle.group.title} · ${planBundle.plan.intervalLabel}`}
      />
      <WhatsAppSupportCard
        buttonLabel={messages.support.button}
        context="billing"
        description={messages.support.description}
        eyebrow={messages.support.eyebrow}
        hoursLabel={messages.support.hours}
        prefilledMessage={messages.support.messageBilling}
        privacyNote={messages.support.privacyNote}
        role={profile.role}
        title={messages.support.title}
      />
    </LegalLayout>
  );
}

export async function generateMetadata() {
  const messages = await getServerMessages();
  return {
    title: messages.billingUi.havale.metaTitle,
  };
}
