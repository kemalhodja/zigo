import Link from "next/link";

import { LegalLayout } from "@/components/legal-layout";

export default function BillingSuccessPage() {
  return (
    <LegalLayout title="Zigo Plus activated">
      <p>Thank you — your Stripe checkout completed. Premium focus tools unlock after your subscription syncs.</p>
      <p>If features are not visible yet, wait a few seconds and refresh. Local demo projects can use Activate demo Plus from Focus or Parent.</p>
      <div className="flex flex-wrap gap-2 pt-2">
        <Link className="zigo-cta inline-flex rounded-lg px-4 py-2 text-sm font-black text-white" href="/focus">
          Open Focus
        </Link>
        <Link className="inline-flex rounded-lg border border-slate-200 px-4 py-2 text-sm font-black text-night" href="/student">
          Student dashboard
        </Link>
      </div>
    </LegalLayout>
  );
}
