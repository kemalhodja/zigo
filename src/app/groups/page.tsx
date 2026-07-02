import Link from "next/link";
import { redirect } from "next/navigation";

import { SignOutButton } from "@/components/sign-out-button";
import { StateCard } from "@/components/state-card";
import { StudyGroupsPanel } from "@/components/study-groups-panel";
import { hasSupabaseEnv } from "@/lib/config";
import { getCurrentProfile } from "@/lib/domain/profiles";
import {
  listActiveStudyGroupsForJoin,
  listMyStudyGroups,
} from "@/lib/domain/study-groups";
import { getServerMessages } from "@/lib/i18n/server";
import { createClient } from "@/lib/supabase/server";

export default async function GroupsPage() {
  const m = await getServerMessages();

  if (!hasSupabaseEnv()) {
    return <StateCard description={m.studyGroups.needsSupabaseDesc} title={m.studyGroups.needsSupabaseTitle} />;
  }

  const supabase = await createClient();
  const profile = await getCurrentProfile(supabase);

  if (!profile) {
    return (
      <StateCard
        action={
          <Link className="font-black text-crystal" href="/auth?next=/groups">
            {m.ops.common.signIn}
          </Link>
        }
        description={m.studyGroups.signInDesc}
        title={m.studyGroups.signInTitle}
      />
    );
  }

  if (profile.role !== "student" && profile.role !== "parent") {
    redirect("/");
  }

  const [groups, joinableGroups] = await Promise.all([
    listMyStudyGroups(supabase, profile.id),
    profile.role === "student" ? listActiveStudyGroupsForJoin(supabase) : Promise.resolve([]),
  ]);

  return (
    <div className="pb-4">
      <div className="flex justify-end px-4 pt-2">
        <SignOutButton variant="icon" />
      </div>
      <StudyGroupsPanel
        groups={groups}
        joinableGroups={joinableGroups.filter((group) => group.owner_user_id !== profile.id)}
        role={profile.role}
      />
    </div>
  );
}
