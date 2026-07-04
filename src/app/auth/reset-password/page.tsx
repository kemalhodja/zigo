import Link from "next/link";

import { ResetPasswordPanel } from "@/components/reset-password-panel";
import { getServerMessages } from "@/lib/i18n/server";

export default async function ResetPasswordPage() {
  const a = (await getServerMessages()).auth;

  return (
    <div className="space-y-5 pb-4">
      <section className="-mx-4 border-b border-violet-100 bg-white px-4 py-6">
        <h1 className="text-2xl font-black text-night">{a.resetPasswordTitle}</h1>
        <p className="mt-2 text-sm font-bold leading-6 text-slate-500">{a.resetPasswordLead}</p>
        <Link className="mt-4 inline-block text-sm font-black text-crystal" href="/auth">
          {a.backToAuth}
        </Link>
      </section>
      <ResetPasswordPanel />
    </div>
  );
}
