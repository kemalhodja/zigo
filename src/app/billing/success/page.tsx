import Link from "next/link";

import { LegalLayout } from "@/components/legal-layout";
import { SUBSCRIPTION_CAMPAIGN } from "@/lib/domain/subscription-campaign";

export default function BillingSuccessPage() {
  return (
    <LegalLayout title="Zigo Plus etkinleştirildi">
      <p>Teşekkürler — Stripe ödemeniz tamamlandı. Abonelik senkronize olduktan sonra premium özellikler açılır.</p>
      {new Date() < SUBSCRIPTION_CAMPAIGN.endsAt ? (
        <p className="mt-2 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-sm font-semibold text-amber-900">
          {SUBSCRIPTION_CAMPAIGN.description} Kampanya fiyatınız ödeme adımında uygulanmış olmalıdır.
        </p>
      ) : null}
      <p className="mt-2">Özellikler henüz görünmüyorsa birkaç saniye bekleyip sayfayı yenileyin. Yerel demo projelerde Odak veya Veli ekranından demo Plus aktivasyonu kullanılabilir.</p>
      <div className="flex flex-wrap gap-2 pt-2">
        <Link className="zigo-cta inline-flex rounded-lg px-4 py-2 text-sm font-black text-white" href="/focus">
          Odağı aç
        </Link>
        <Link className="inline-flex rounded-lg border border-slate-200 px-4 py-2 text-sm font-black text-night" href="/student">
          Öğrenci paneli
        </Link>
      </div>
    </LegalLayout>
  );
}
