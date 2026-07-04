import Link from "next/link";

import { ChildAreaSelector } from "@/components/child-area-selector";
import { ChildFocusPanel } from "@/components/child-focus-panel";
import { ChildGradeLevelForm } from "@/components/child-grade-level-form";
import { ChildProfileForm } from "@/components/child-profile-form";
import { ChildQuizActivityPanel } from "@/components/child-quiz-activity-panel";
import { ChildRewardPanel } from "@/components/child-reward-panel";
import { StateCard } from "@/components/state-card";
import { hasSupabaseEnv, withSupabaseFallback } from "@/lib/config";
import { getChildInterestAreaIds, getChildPersonalizedFeed, getChildProfiles } from "@/lib/domain/children";
import { getChildQuizActivity } from "@/lib/domain/parent-dashboard";
import { getCurrentProfile, getEducationAreas } from "@/lib/domain/profiles";
import { getServerMessages } from "@/lib/i18n/server";
import type { Messages } from "@/lib/i18n/types";
import { createClient } from "@/lib/supabase/server";

export default async function FamilyPage() {
  const m = await getServerMessages();
  const f = m.familyPage;

  if (!hasSupabaseEnv()) {
    return (
      <StateCard
        title={f.familySpace}
        description={f.familySpaceDesc}
      />
    );
  }

  const previewFallback = (
    <StateCard
      title={f.familySpace}
      description={f.familySpaceDesc}
    />
  );

  return withSupabaseFallback(async () => {
  const supabase = await createClient();
  const profile = await getCurrentProfile(supabase);

  if (!profile) {
    return (
      <StateCard
        title={f.signInRequired}
        description={f.signInDesc}
        action={
          <Link className="font-black text-crystal" href="/auth">
            {f.goToAuth}
          </Link>
        }
      />
    );
  }

  if (profile.role !== "parent") {
    return (
      <StateCard
        title={f.parentOnly}
        description={f.parentOnlyDesc}
      />
    );
  }

  const [areas, children] = await Promise.all([getEducationAreas(supabase), getChildProfiles(supabase)]);
  const childDetails = await Promise.all(
    children.map(async (child) => ({
      child,
      selectedAreaIds: await getChildInterestAreaIds(supabase, child.id),
      feedPreview: await getChildPersonalizedFeed(supabase, child.id),
      quizActivity: await getChildQuizActivity(supabase, child.id),
    })),
  );

  return (
    <div className="space-y-5">
      <section className="-mx-4 border-b border-pink-100 bg-white px-4 pb-4">
        <p className="text-xs font-black uppercase tracking-[0.2em] text-slate-500">{f.familySpace}</p>
        <h2 className="mt-1 text-2xl font-black text-night">{f.linkChildProfiles}</h2>
        <p className="mt-2 text-sm leading-6 text-slate-500">{f.linkChildDesc}</p>
      </section>

      <FamilySetupSteps messages={m} />

      <ChildProfileForm />

      {childDetails.length === 0 ? (
        <StateCard
          title={f.noChildProfiles}
          description={f.noChildProfilesDesc}
        />
      ) : (
        <section className="-mx-4 divide-y divide-slate-100 bg-white">
          {childDetails.map(({ child, selectedAreaIds, feedPreview, quizActivity }) => (
            <article className="space-y-4 px-4 py-5" key={child.id}>
              <div className="flex items-end justify-between gap-4">
                <div>
                  <p className="text-xs font-semibold text-slate-500">
                    {child.age_group ?? f.childProfileLabel}
                  </p>
                  <h3 className="mt-1 text-xl font-black text-night">{child.display_name}</h3>
                </div>
                <div className="rounded-lg bg-slate-100 px-4 py-2 text-right">
                  <p className="text-xs font-black text-slate-500">{f.points}</p>
                  <p className="text-lg font-black text-night">{child.total_points}</p>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-2 text-center text-xs font-bold text-slate-600">
                <div className="rounded-lg bg-slate-50 p-3">
                  <p className="text-lg font-black text-night">{selectedAreaIds.length}</p>
                  {f.areas}
                </div>
                <div className="rounded-lg bg-slate-50 p-3">
                  <p className="text-lg font-black text-night">{feedPreview.length}</p>
                  {f.feedPosts}
                </div>
                <div className="rounded-lg bg-slate-50 p-3">
                  <p className="text-lg font-black text-night">{child.avatar_assets.pet ? "1" : "0"}</p>
                  {f.pets}
                </div>
              </div>

              <ChildGradeLevelForm
                childName={child.display_name}
                childProfileId={child.id}
                initialGradeLevel={child.grade_level}
              />

              <ChildAreaSelector
                areas={areas}
                childProfileId={child.id}
                initialSelectedAreaIds={selectedAreaIds}
              />
              <ChildQuizActivityPanel
                activity={quizActivity}
                childName={child.display_name}
                labels={{
                  title: f.quizActivityTitle,
                  empty: f.quizActivityEmpty,
                  score: f.quizActivityScore,
                  points: f.quizActivityPoints,
                  questions: f.quizActivityQuestions,
                  completed: f.quizActivityCompleted,
                }}
              />
              <ChildFocusPanel childName={child.display_name} childProfileId={child.id} />
              <ChildRewardPanel childProfileId={child.id} />
            </article>
          ))}
        </section>
      )}
    </div>
  );
  }, previewFallback);
}

function FamilySetupSteps({ messages: m }: { messages: Messages }) {
  const f = m.familyPage;
  const steps = [
    { label: f.stepCreateChild, text: f.stepCreateChildDesc },
    { label: f.stepChooseAreas, text: f.stepChooseAreasDesc },
    { label: f.stepApproveRewards, text: f.stepApproveRewardsDesc },
  ];

  return (
    <section className="-mx-4 bg-gradient-to-r from-violet-50 via-pink-50 to-cyan-50 px-4 py-4">
      <p className="text-xs font-black uppercase tracking-[0.18em] text-crystal">{f.parentChildSetup}</p>
      <div className="mt-3 grid gap-2">
        {steps.map((step, index) => (
          <div className="flex gap-3 rounded-lg bg-white p-3" key={step.label}>
            <span className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-gradient-to-r from-crystal to-berry text-xs font-black text-white">
              {index + 1}
            </span>
            <div>
              <p className="text-sm font-black text-night">{step.label}</p>
              <p className="mt-1 text-xs font-bold leading-5 text-slate-500">{step.text}</p>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
