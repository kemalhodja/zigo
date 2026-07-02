import Link from "next/link";
import { notFound, redirect } from "next/navigation";

import { SignOutButton } from "@/components/sign-out-button";
import { StudyGroupChat } from "@/components/study-group-chat";
import { hasSupabaseEnv } from "@/lib/config";
import { getCurrentProfile } from "@/lib/domain/profiles";
import { getStudyGroupMessages, listMyStudyGroups } from "@/lib/domain/study-groups";
import { getServerMessages } from "@/lib/i18n/server";
import { createClient } from "@/lib/supabase/server";

export default async function GroupDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const m = await getServerMessages();

  if (!hasSupabaseEnv()) {
    redirect("/groups");
  }

  const supabase = await createClient();
  const profile = await getCurrentProfile(supabase);

  if (!profile || (profile.role !== "student" && profile.role !== "parent")) {
    redirect("/auth?next=/groups");
  }

  const groups = await listMyStudyGroups(supabase, profile.id);
  const group = groups.find((item) => item.id === id && item.status === "active");

  if (!group) {
    notFound();
  }

  const messages = await getStudyGroupMessages(supabase, id);

  return (
    <div>
      <div className="flex items-center justify-between px-4 pt-2">
        <Link className="text-sm font-black text-crystal" href="/groups">
          {m.studyGroups.backToGroups}
        </Link>
        <SignOutButton variant="icon" />
      </div>
      <StudyGroupChat groupId={id} groupName={group.name} initialMessages={messages} />
    </div>
  );
}
