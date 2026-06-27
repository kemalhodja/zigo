import { ParentLessonPackagesPanel } from "@/features/billing/components/parent-lesson-packages-panel";
import { StateCard } from "@/components/state-card";
import { hasSupabaseEnv, withSupabaseFallback } from "@/lib/config";
import { canUseDevBillingBypass } from "@/lib/domain/billing";
import {
  getParentLessonPackageAccess,
  type LessonPackageAccess,
} from "@/lib/domain/lesson-packages";
import { getCurrentProfile } from "@/lib/domain/profiles";
import { getServerMessages } from "@/lib/i18n/server";
import { createClient } from "@/lib/supabase/server";
import Link from "next/link";

export default async function ParentPackagesPage() {
  const messages = await getServerMessages();
  const lp = messages.lessonPackages;
  const data = await getPageData();

  if (data.mode === "signed-out") {
    return (
      <StateCard
        action={
          <Link className="font-black text-crystal" href="/auth?next=/parent/packages">
            {messages.common.signIn}
          </Link>
        }
        description={lp.signInDesc}
        title={lp.signInTitle}
      />
    );
  }

  if (data.mode === "role-preview") {
    return (
      <StateCard
        action={
          <Link className="font-black text-crystal" href="/profiles">
            {messages.dashboard.switchMode}
          </Link>
        }
        description={lp.parentRequiredDesc}
        title={lp.parentRequiredTitle}
      />
    );
  }

  return (
    <div className="space-y-4 pb-3">
      <ParentLessonPackagesPanel
        allowDevActivate={data.allowDevActivate}
        initialAccess={data.access}
      />
      <div className="px-1">
        <Link className="text-sm font-black text-crystal" href="/parent">
          ← {messages.dashboard.parent.title}
        </Link>
      </div>
    </div>
  );
}

async function getPageData(): Promise<{
  mode: "parent" | "signed-out" | "role-preview" | "preview";
  access: LessonPackageAccess;
  allowDevActivate: boolean;
}> {
  const emptyAccess: LessonPackageAccess = {
    hasAccess: false,
    planType: null,
    lessonsRemaining: 0,
    endsAt: null,
    expired: true,
  };

  if (!hasSupabaseEnv()) {
    return {
      mode: "preview",
      access: emptyAccess,
      allowDevActivate: canUseDevBillingBypass(),
    };
  }

  return withSupabaseFallback<{
    mode: "parent" | "signed-out" | "role-preview" | "preview";
    access: LessonPackageAccess;
    allowDevActivate: boolean;
  }>(async () => {
    const supabase = await createClient();
    const profile = await getCurrentProfile(supabase);
    if (!profile) {
      return { mode: "signed-out" as const, access: emptyAccess, allowDevActivate: false };
    }
    if (profile.role !== "parent") {
      return { mode: "role-preview" as const, access: emptyAccess, allowDevActivate: false };
    }

    const access = await getParentLessonPackageAccess(supabase, profile.id);
    return {
      mode: "parent" as const,
      access,
      allowDevActivate: canUseDevBillingBypass(),
    };
  }, {
    mode: "preview" as const,
    access: emptyAccess,
    allowDevActivate: canUseDevBillingBypass(),
  });
}
