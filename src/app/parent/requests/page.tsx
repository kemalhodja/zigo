import Link from "next/link";

import { LessonRequestsPanel } from "@/components/lesson-requests-panel";
import { hasSupabaseEnv } from "@/lib/config";
import { getChildProfiles } from "@/lib/domain/children";
import { getCurrentProfile } from "@/lib/domain/profiles";
import { getServerMessages } from "@/lib/i18n/server";
import { createClient } from "@/lib/supabase/server";

type ParentRequestsPageProps = {
  searchParams: Promise<{ sent?: string }>;
};

export default async function ParentRequestsPage({ searchParams }: ParentRequestsPageProps) {
  const query = await searchParams;
  const messages = await getServerMessages();
  const lr = messages.lessonRequests;

  if (!hasSupabaseEnv()) {
    return (
      <div className="space-y-4 px-4 py-6">
        <h1 className="text-2xl font-black text-night">{lr.myRequestsTitle}</h1>
        <p className="text-sm text-slate-500">{messages.preview.message}</p>
        <Link className="zigo-cta inline-flex rounded-xl px-4 py-3 text-sm font-black text-white" href="/setup">
          {messages.common.setup}
        </Link>
      </div>
    );
  }

  const supabase = await createClient();
  const profile = await getCurrentProfile(supabase);

  if (!profile || profile.role !== "parent") {
    return (
      <div className="space-y-4 px-4 py-6">
        <h1 className="text-2xl font-black text-night">{lr.myRequestsTitle}</h1>
        <p className="text-sm text-slate-500">{lr.parentOnlyNote}</p>
        <Link className="text-sm font-black text-crystal" href="/parent">
          {messages.dashboard.parent.title}
        </Link>
      </div>
    );
  }

  const children = await getChildProfiles(supabase);

  return (
    <div className="space-y-4 pb-6">
      <section className="-mx-4 border-b border-cyan-100 bg-white px-4 pb-4">
        <Link className="text-xs font-black uppercase tracking-[0.12em] text-crystal" href="/parent">
          ← {messages.dashboard.parent.title}
        </Link>
        <h1 className="mt-2 text-2xl font-black text-night">{lr.myRequestsTitle}</h1>
        <p className="mt-2 text-sm leading-6 text-slate-500">{lr.myRequestsDesc}</p>
      </section>

      {query.sent === "1" ? (
        <div
          className="-mx-4 border-y border-emerald-100 bg-gradient-to-r from-emerald-50 to-cyan-50 px-4 py-4"
          data-testid="lesson-request-success-banner"
        >
          <p className="text-sm font-black text-emerald-700">{lr.successTitle}</p>
          <p className="mt-1 text-sm leading-6 text-slate-600">{lr.successDesc}</p>
        </div>
      ) : null}

      <LessonRequestsPanel
        childrenOptions={children.map((child) => ({ id: child.id, name: child.display_name }))}
        redirectOnCreate="/parent/requests?sent=1"
        role="parent"
        viewerId={profile.id}
      />
    </div>
  );
}
