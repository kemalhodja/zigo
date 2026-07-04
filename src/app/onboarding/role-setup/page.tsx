/**
 * Role Setup Page
 * 
 * After registration, users are directed here to complete role-specific setup.
 * - Student: Grade level + Interest areas
 * - Parent: Child grade level + Interest areas + Optional child connection
 * - Teacher: Subjects + Interest areas + Contact info
 */

import { Suspense } from "react";

import { GradeLevelForm } from "@/components/grade-level-form";
import { InterestSelector } from "@/components/interest-selector";
import { ProfileForm } from "@/components/profile-form";
import { SignOutButton } from "@/components/sign-out-button";
import { SupabaseSetupCard } from "@/components/supabase-setup-card";
import { hasSupabaseEnv, withSupabaseFallback } from "@/lib/config";
import { getCurrentProfile, getEducationAreas, getUserInterestAreaIds } from "@/lib/domain/profiles";
import { getServerMessages, type Messages } from "@/lib/i18n/server";
import { createClient } from "@/lib/supabase/server";

export default async function RoleSetupPage() {
  const m = await getServerMessages();
  const o = m.onboardingPage;
  const ob = m.onboarding;

  if (!hasSupabaseEnv()) {
    return <SupabaseSetupCard />;
  }

  return withSupabaseFallback(async () => {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return (
        <div className="space-y-5">
          <StateCard
            title={o.signInCreate}
            description={o.signInCreateDesc}
            action={
              <a className="font-black text-crystal" href="/auth">
                {o.goToAuth}
              </a>
            }
          />
        </div>
      );
    }

    const profile = await getCurrentProfile(supabase);

    if (!profile) {
      return (
        <div className="space-y-5">
          <section className="-mx-4 border-b border-slate-100 bg-white px-4 pb-4">
            <p className="text-xs font-black uppercase tracking-[0.2em] text-slate-500">{o.step1}</p>
            <h2 className="mt-1 text-2xl font-black text-night">{o.createProfile}</h2>
            <p className="mt-2 text-sm leading-6 text-slate-500">{o.createProfileDesc}</p>
          </section>
          <ProfileForm />
        </div>
      );
    }

    const [areas, selectedAreaIds] = await Promise.all([
      getEducationAreas(supabase),
      getUserInterestAreaIds(supabase, profile.id),
    ]);

    return (
      <div className="space-y-5">
        <section className="-mx-4 border-b border-slate-100 bg-white px-4 pb-4">
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="text-xs font-black uppercase tracking-[0.2em] text-slate-500">{o.step2}</p>
              <h2 className="mt-1 text-2xl font-black text-night">{getSetupTitle(profile.role, o)}</h2>
              <p className="mt-2 text-sm leading-6 text-slate-500">{getSetupDescription(profile.role, o)}</p>
            </div>
            <SignOutButton />
          </div>
        </section>

        <section className="-mx-4 bg-white px-4 py-4">
          <p className="text-xs font-black uppercase tracking-[0.2em] text-crystal">{m.roles[profile.role]}</p>
          <h3 className="mt-2 text-xl font-black text-night">{profile.full_name}</h3>
        </section>

        {profile.role === "student" && (
          <StudentSetup
            areas={areas}
            selectedAreaIds={selectedAreaIds}
            messages={o}
          />
        )}

        {profile.role === "parent" && (
          <ParentSetup
            areas={areas}
            selectedAreaIds={selectedAreaIds}
            messages={o}
          />
        )}

        {profile.role === "teacher" && (
          <TeacherSetup
            areas={areas}
            selectedAreaIds={selectedAreaIds}
            messages={o}
            role={profile.role}
          />
        )}
      </div>
    );
  }, <SupabaseSetupCard />);
}

function getSetupTitle(role: string, o: Messages["onboardingPage"]) {
  if (role === "student") return o.studentSetupTitle;
  if (role === "parent") return o.parentSetupTitle;
  return o.teacherSetupTitle;
}

function getSetupDescription(role: string, o: Messages["onboardingPage"]) {
  if (role === "student") return o.studentSetupDesc;
  if (role === "parent") return o.parentSetupDesc;
  return o.teacherSetupDesc;
}

function StudentSetup({
  areas,
  selectedAreaIds,
  messages,
}: {
  areas: any[];
  selectedAreaIds: number[];
  messages: Messages["onboardingPage"];
}) {
  return (
    <div className="space-y-6">
      <div className="-mx-4 bg-white px-4 py-4">
        <p className="text-xs font-black uppercase tracking-[0.2em] text-slate-500">{messages.childGradeLevel}</p>
        <p className="mt-2 text-sm leading-6 text-slate-600">{messages.studentInterestsDesc}</p>
        <div className="mt-4">
          <GradeLevelForm />
        </div>
      </div>

      <div className="-mx-4 bg-white px-4 py-4">
        <p className="text-xs font-black uppercase tracking-[0.2em] text-slate-500">{messages.chooseInterests}</p>
        <p className="mt-2 text-sm leading-6 text-slate-600">{messages.studentInterestsDesc}</p>
        <div className="mt-4">
          <InterestSelector
            areas={areas}
            initialSelectedAreaIds={selectedAreaIds}
            role="student"
          />
        </div>
      </div>
    </div>
  );
}

function ParentSetup({
  areas,
  selectedAreaIds,
  messages,
}: {
  areas: any[];
  selectedAreaIds: number[];
  messages: Messages["onboardingPage"];
}) {
  return (
    <div className="space-y-6">
      <div className="-mx-4 bg-white px-4 py-4">
        <p className="text-xs font-black uppercase tracking-[0.2em] text-slate-500">{messages.childGradeLevel}</p>
        <p className="mt-2 text-sm leading-6 text-slate-600">{messages.childGradeLevelDesc}</p>
        <div className="mt-4">
          <GradeLevelForm />
        </div>
      </div>

      <div className="-mx-4 bg-white px-4 py-4">
        <p className="text-xs font-black uppercase tracking-[0.2em] text-slate-500">{messages.chooseInterests}</p>
        <p className="mt-2 text-sm leading-6 text-slate-600">{messages.parentInterestsDesc}</p>
        <div className="mt-4">
          <InterestSelector
            areas={areas}
            initialSelectedAreaIds={selectedAreaIds}
            role="parent"
          />
        </div>
      </div>

      <div className="-mx-4 bg-white px-4 py-4">
        <p className="text-xs font-black uppercase tracking-[0.2em] text-slate-500">{messages.connectStudent}</p>
        <p className="mt-2 text-sm leading-6 text-slate-600">{messages.connectStudentDesc}</p>
        <div className="mt-4">
          <a
            className="tap-scale inline-flex zigo-cta tap-scale rounded-lg px-5 py-3 text-sm font-black text-white"
            href="/family"
          >
            {messages.connectStudentButton}
          </a>
        </div>
      </div>
    </div>
  );
}

function TeacherSetup({
  areas,
  selectedAreaIds,
  messages,
  role,
}: {
  areas: any[];
  selectedAreaIds: number[];
  messages: Messages["onboardingPage"];
  role: string;
}) {
  return (
    <div className="space-y-6">
      <div className="-mx-4 bg-white px-4 py-4">
        <p className="text-xs font-black uppercase tracking-[0.2em] text-slate-500">{messages.subjects}</p>
        <p className="mt-2 text-sm leading-6 text-slate-600">{messages.teacherSubjectsDesc}</p>
        <div className="mt-4">
          <InterestSelector
            areas={areas}
            initialSelectedAreaIds={selectedAreaIds}
            role={role as "teacher"}
            multiple
          />
        </div>
      </div>

      <div className="-mx-4 bg-white px-4 py-4">
        <p className="text-xs font-black uppercase tracking-[0.2em] text-slate-500">{messages.contactInfo}</p>
        <p className="mt-2 text-sm leading-6 text-slate-600">{messages.contactInfoDesc}</p>
        <div className="mt-4">
          <a
            className="tap-scale inline-flex zigo-cta tap-scale rounded-lg px-5 py-3 text-sm font-black text-white"
            href="/teacher"
          >
            {messages.contactInfoButton}
          </a>
        </div>
      </div>
    </div>
  );
}

function StateCard({
  title,
  description,
  action,
}: {
  title: string;
  description: string;
  action: React.ReactNode;
}) {
  return (
    <section className="-mx-4 rounded-lg bg-white px-4 py-10 text-center">
      <h2 className="zigo-section-title text-night">{title}</h2>
      <p className="mx-auto mt-2 max-w-72 text-sm leading-6 text-slate-600">{description}</p>
      <div className="mt-4">{action}</div>
    </section>
  );
}