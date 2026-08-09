import Link from "next/link";

import { LegalLayout } from "@/components/legal-layout";
import { SUBSCRIPTION_CAMPAIGN } from "@/lib/domain/subscription-campaign";

type BillingSuccessPageProps = {
  searchParams: Promise<{ kind?: string }>;
};

export default async function BillingSuccessPage({ searchParams }: BillingSuccessPageProps) {
  const params = await searchParams;
  const isSponsor = params.kind === "sponsor";

  return (
    <LegalLayout title={isSponsor ? "Sponsorluk ödemesi alındı" : "Zigo Plus etkinleştirildi"}>
      {isSponsor ? (
        <p>
          Teşekkürler — sponsorlu profil ödemeniz tamamlandı. Webhook senkronize olduktan sonra
          kampanyanız aktif görünür.
        </p>
      ) : (
        <p>
          Teşekkürler — Stripe ödemeniz tamamlandı. Abonelik senkronize olduktan sonra premium
          özellikler açılır.
        </p>
      )}
      {!isSponsor && new Date() < SUBSCRIPTION_CAMPAIGN.endsAt ? (
        <p className="mt-2 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-sm font-semibold text-amber-900">
          {SUBSCRIPTION_CAMPAIGN.description} Kampanya fiyatınız ödeme adımında uygulanmış olmalıdır.
        </p>
      ) : null}
      <p className="mt-2">
        Özellikler henüz görünmüyorsa birkaç saniye bekleyip sayfayı yenileyin. Yerel demo
        projelerde Odak veya Veli ekranından demo Plus aktivasyonu kullanılabilir.
      </p>
      <div className="flex flex-wrap gap-2 pt-2">
        {isSponsor ? (
          <Link
            className="zigo-cta inline-flex rounded-lg px-4 py-2 text-sm font-black text-white"
            href="/profile"
          >
            Profile dön
          </Link>
        ) : (
          <>
            <Link
              className="zigo-cta inline-flex rounded-lg px-4 py-2 text-sm font-black text-white"
              href="/learn"
            >
              Öğrenmeye başla
            </Link>
            <Link
              className="inline-flex rounded-lg border border-slate-200 px-4 py-2 text-sm font-black text-night"
              href="/student"
            >
              Öğrenci paneli
            </Link>
          </>
        )}
      </div>
    </LegalLayout>
  );
}
