import Link from "next/link";
import { Suspense } from "react";

import { AuthSessionBridgePanel } from "@/components/auth-session-bridge-panel";
import { getServerMessages } from "@/lib/i18n/server";

export default async function AuthSessionBridgePage() {
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
      <Suspense fallback={<p className="px-4 text-sm font-bold text-slate-500">{a.loadingAuth}</p>}>
        <AuthSessionBridgePanel />
      </Suspense>
    </div>
  );
}
