import Link from "next/link";

import { LegalLayout } from "@/components/legal-layout";
import { getServerMessages } from "@/lib/i18n/server";

export default async function PrivacyPage() {
  const { legalContent: l } = await getServerMessages();

  return (
    <LegalLayout title={l.privacyTitle}>
      <p>{l.privacyP1}</p>
      <p>{l.privacyP2}</p>
      <p>
        {l.privacyP3Prefix}{" "}
        <Link className="font-black text-crystal" href="/legal/delete-account">
          {l.privacyP3Link}
        </Link>{" "}
        {l.privacyP3Suffix}
      </p>

      <h2 className="pt-2 text-base font-black text-night">{l.privacyChildrenTitle}</h2>
      <p>{l.privacyChildrenP1}</p>
      <p>{l.privacyChildrenP2}</p>

      <h2 className="pt-2 text-base font-black text-night">{l.privacyThirdPartyTitle}</h2>
      <p>{l.privacyThirdPartyP1}</p>

      <h2 className="pt-2 text-base font-black text-night">{l.privacySecurityTitle}</h2>
      <p>{l.privacySecurityP1}</p>
    </LegalLayout>
  );
}
