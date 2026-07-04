import { LegalLayout } from "@/components/legal-layout";
import { getServerMessages } from "@/lib/i18n/server";

export default async function TermsPage() {
  const { legalContent: l } = await getServerMessages();

  return (
    <LegalLayout title={l.termsTitle}>
      <p>{l.termsP1}</p>
      <p>{l.termsP2}</p>
      <p>{l.termsP3}</p>

      <h2 className="pt-2 text-base font-black text-night">{l.termsSafetyTitle}</h2>
      <p>{l.termsSafetyP1}</p>
      <p>{l.termsSafetyP2}</p>
    </LegalLayout>
  );
}
