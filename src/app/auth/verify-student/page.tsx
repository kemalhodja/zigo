import Link from "next/link";
import { redirect } from "next/navigation";

import { StateCard } from "@/components/state-card";
import { VerifyStudentPanel } from "@/components/verify-student-panel";
import { hasSupabaseEnv } from "@/lib/config";
import { getCurrentProfile } from "@/lib/domain/profiles";
import { getServerMessages } from "@/lib/i18n/server";
import { createClient } from "@/lib/supabase/server";

export default async function VerifyStudentPage() {
  const m = await getServerMessages();
  const a = m.auth;

  if (!hasSupabaseEnv()) {
    return (
      <StateCard
        title={a.verifyStudentTitle}
        description={a.verifyStudentSetup}
        action={
          <Link className="font-black text-crystal" href="/setup">
            {m.legal.setup}
          </Link>
        }
      />
    );
  }

  const supabase = await createClient();
  const profile = await getCurrentProfile(supabase);

  if (!profile) {
    redirect("/auth?next=/auth/verify-student");
  }

  if (profile.role !== "student") {
    redirect("/");
  }

  return (
    <div className="space-y-5 pb-4">
      <section className="-mx-4 border-b border-violet-100 bg-white px-4 py-6">
        <h1 className="text-2xl font-black text-night">{a.verifyStudentTitle}</h1>
        <p className="mt-2 text-sm font-bold leading-6 text-slate-500">{a.verifyStudentLead}</p>
        <Link className="mt-4 inline-block text-sm font-black text-crystal" href="/auth">
          {a.backToAuth}
        </Link>
      </section>
      <VerifyStudentPanel
        documentStatus={profile.student_document_status}
        documentUrl={profile.student_document_url}
      />
    </div>
  );
}
