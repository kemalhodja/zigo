import Link from "next/link";
import { redirect } from "next/navigation";

import { BankTransferCheckoutPanel } from "@/components/bank-transfer-checkout-panel";
import { LegalLayout } from "@/components/legal-layout";
import { StateCard } from "@/components/state-card";
import { hasSupabaseEnv } from "@/lib/config";
import {
  getBankTransferAccounts,
  getUserBankTransferRequests,
  hasBankTransferConfigured,
  resolveBankTransferPlan,
} from "@/lib/domain/bank-transfer";
import { getCurrentProfile } from "@/lib/domain/profiles";
import { isSubscriptionCampaignActive } from "@/lib/domain/subscription-campaign";
import { getServerMessages } from "@/lib/i18n/server";
import { createClient } from "@/lib/supabase/server";

type BillingHavalePageProps = {
  searchParams: Promise<{ planId?: string }>;
};

export default async function BillingHavalePage({ searchParams }: BillingHavalePageProps) {
  const { planId = "student-monthly" } = await searchParams;

  if (!hasSupabaseEnv()) {
    return (
      <StateCard
        action={
          <Link className="font-black text-crystal" href="/setup">
            Kurulumu aç
          </Link>
        }
        description="Havale/EFT ödemesi için Supabase bağlantısı gerekli."
        title="Supabase yapılandırması eksik"
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
    planBundle = resolveBankTransferPlan(planId);
  } catch {
    return (
      <StateCard
        action={
          <Link className="font-black text-crystal" href="/profile">
            Profile dön
          </Link>
        }
        description="Geçerli bir Zigo Plus planı seçin."
        title="Geçersiz plan"
      />
    );
  }

  const requests = await getUserBankTransferRequests(supabase, profile.id);
  const pendingRequest =
    requests.find((item) => item.plan_id === planId && item.status === "pending") ?? null;

  const configured = hasBankTransferConfigured();
  const banks = getBankTransferAccounts();
  const messages = await getServerMessages();

  return (
    <LegalLayout title="Havale / EFT ile Zigo Plus">
      <p>
        iOS PWA ve tarayıcı kullanıcıları banka havalesi veya EFT ile abonelik satın alabilir. Ödeme onaylandıktan
        sonra Zigo Plus otomatik açılır (genelde 1–2 iş günü).
      </p>
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
    </LegalLayout>
  );
}

export async function generateMetadata() {
  return {
    title: "Havale / EFT · Zigo Plus",
  };
}
