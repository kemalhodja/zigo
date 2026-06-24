import Link from "next/link";

import { HostedDeployCard } from "@/components/hosted-deploy-card";
import { LiveGatesPanel } from "@/components/live-gates-panel";
import { RoleQaPanel } from "@/components/role-qa-panel";
import { SetupProgressTracker } from "@/components/setup-progress-tracker";
import { SupabaseSetupCard } from "@/components/supabase-setup-card";
import { hasSupabaseEnv } from "@/lib/config";
import { getLiveGates } from "@/lib/domain/live-gates";
import { localizeLiveGates } from "@/lib/i18n/localize-live-gates";
import { getServerMessages } from "@/lib/i18n/server";

const migrationSteps = [
  "001_initial_schema.sql",
  "002_seed_education_areas.sql",
  "003_family_child_profiles.sql",
  "004_zigo_store.sql",
  "005_seed_store_products.sql",
  "006_platform_admin_ops.sql",
  "007_learning_engine.sql",
  "008_social_graph.sql",
  "009_social_storage.sql",
  "010_story_replies.sql",
  "011_learning_events.sql",
  "012_content_reports.sql",
  "013_author_moderation_review.sql",
  "014_social_match_feed_rls.sql",
  "015_social_safety_hardening.sql",
  "016_auth_profile_autocreate.sql",
  "017_mvp_seed_content.sql",
  "018_story_match_feed_rls.sql",
  "019_admin_teacher_area_assignment.sql",
  "020_lock_teacher_interest_self_assignment.sql",
  "021_story_area_match_feed.sql",
  "022_platform_admin_moderation_policies.sql",
  "023_moderation_audit_log.sql",
  "024_postgrest_role_grants.sql",
  "025_fix_auth_seed_token_nulls.sql",
  "026_fix_reel_award_ambiguous_points.sql",
  "027_student_read_own_social_text.sql",
  "028_duel_and_quiz_learning_events.sql",
  "029_seed_matched_quizzes.sql",
  "030_focus_study_with_me.sql",
  "031_focus_analytics_and_plans.sql",
  "032_launch_gaps_closure.sql",
  "033_compliance_and_demo_child.sql",
  "034_expand_education_areas_tr.sql",
  "035_coaching_and_guidance_areas.sql",
  "036_study_skills_and_exam_prep.sql",
  "037_user_profile_extensions.sql",
  "038_auth_email_and_student_gates.sql",
  "039_unified_content_posts.sql",
  "040_moderation_keyword_filter.sql",
  "041_quiz_questions_and_attempts.sql",
  "042_parent_child_activity.sql",
  "043_content_moderation_publish_rls.sql",
  "044_product_scope_hardening.sql",
  "045_premium_prep_grade_optional_doc.sql",
  "046_teacher_creator_plus_gates.sql",
  "047_sponsored_ads_infrastructure.sql",
  "048_education_organization_type.sql",
  "049_registration_organization_accounts.sql",
  "050_verified_teacher_answers_rls.sql",
  "051_general_interest_areas.sql",
  "052_obscenity_moderation.sql",
  "053_moderation_strikes.sql",
  "054_moderation_strikes_fix.sql",
  "055_demo_social_interactions_reset.sql",
];

const verificationCommands = [
  "npm run test:smoke",
  "npm run test:migrations",
  "npm run test:rls",
  "npm run test:live",
  "npm run test:deploy",
  "npm run test:mobile",
  "npm run typecheck",
  "npm run build",
];

export default async function SetupPage() {
  const m = await getServerMessages();
  const s = m.ops.setupPage;
  const liveReportRaw = await getLiveGates();
  const liveReport = localizeLiveGates(liveReportRaw, m.ops.liveGates);

  return (
    <div className="space-y-5 pb-3">
      <SupabaseSetupCard envConnected={hasSupabaseEnv()} />

      <SetupProgressTracker common={m.ops.common} labels={m.ops.setupProgress} report={liveReportRaw} />

      <LiveGatesPanel
        common={m.ops.common}
        labels={m.ops.liveGates}
        report={liveReport}
        title={m.ops.liveGates.liveProjectStatus}
      />

      <HostedDeployCard />

      <RoleQaPanel />

      <section className="-mx-4 bg-white px-4 py-4" id="migrations">
        <div className="flex items-center justify-between gap-3">
          <p className="text-xs font-black uppercase tracking-[0.2em] text-slate-500">{s.migrationOrder}</p>
          <a className="text-xs font-black text-crystal" href="/supabase-quickstart.md">
            {s.quickstart}
          </a>
        </div>
        <div className="mt-4 grid gap-2">
          {migrationSteps.map((step, index) => (
            <div className="flex items-center gap-3 rounded-lg bg-slate-50 px-3 py-2" key={step}>
              <span className="flex size-7 items-center justify-center rounded-lg bg-white text-xs font-black text-night">
                {index + 1}
              </span>
              <p className="text-xs font-black text-slate-700">{step}</p>
            </div>
          ))}
        </div>
        <p className="mt-4 text-sm leading-6 text-slate-500">{s.bundleHint}</p>
      </section>

      <section className="-mx-4 bg-white px-4 py-4">
        <p className="text-xs font-black uppercase tracking-[0.2em] text-crystal">{s.demoEyebrow}</p>
        <h2 className="mt-2 text-xl font-black text-night">{s.demoTitle}</h2>
        <p className="mt-2 text-sm leading-6 text-slate-500">
          {s.demoDesc} <code className="rounded bg-slate-100 px-1.5 py-0.5 text-xs font-black">ZigoTest123!</code>
        </p>
        <div className="mt-4 grid gap-2 text-sm font-bold text-slate-600">
          <p>{s.demoTeacher1}</p>
          <p>{s.demoTeacher2}</p>
          <p>{s.demoParent}</p>
          <p>{s.demoStudent}</p>
        </div>
      </section>

      <section className="-mx-4 bg-white px-4 py-4">
        <p className="text-xs font-black uppercase tracking-[0.2em] text-slate-500">{s.liveTestEyebrow}</p>
        <h2 className="mt-2 text-xl font-black text-night">{s.liveTestTitle}</h2>
        <div className="mt-4 divide-y divide-slate-100">
          {s.liveChecks.map((check, index) => (
            <div className="flex gap-3 py-3" key={check}>
              <span className="flex size-7 shrink-0 items-center justify-center rounded-lg bg-slate-100 text-xs font-black text-night">
                {index + 1}
              </span>
              <p className="text-sm font-semibold leading-6 text-slate-600">{check}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="-mx-4 bg-white px-4 py-4">
        <p className="text-xs font-black uppercase tracking-[0.2em] text-slate-500">{s.releaseVerifyEyebrow}</p>
        <h2 className="mt-2 text-xl font-black text-night">{s.releaseVerifyTitle}</h2>
        <div className="mt-4 grid gap-2">
          {verificationCommands.map((command) => (
            <code className="rounded-lg bg-slate-950 px-3 py-2 text-xs font-black text-white" key={command}>
              {command}
            </code>
          ))}
        </div>
      </section>

      <section className="-mx-4 bg-white px-4 py-4">
        <p className="text-xs font-black uppercase tracking-[0.2em] text-crystal">{s.androidEyebrow}</p>
        <h2 className="mt-2 text-xl font-black text-night">{s.androidTitle}</h2>
        <p className="mt-2 text-sm leading-6 text-slate-500">{s.androidDesc}</p>
        <a className="mt-4 inline-flex rounded-lg bg-gradient-to-r from-crystal to-berry px-4 py-3 text-sm font-black text-white" href="/mobile-apk-checklist.md">
          {s.androidChecklist}
        </a>
      </section>

      <section className="-mx-4 bg-white px-4 py-4">
        <p className="text-xs font-black uppercase tracking-[0.2em] text-aqua">{s.pwaEyebrow}</p>
        <h2 className="mt-2 text-xl font-black text-night">{s.pwaTitle}</h2>
        <p className="mt-2 text-sm leading-6 text-slate-500">{s.pwaDesc}</p>
        <div className="mt-4 grid grid-cols-3 gap-2 text-center text-xs font-black text-slate-600">
          <span className="rounded-lg bg-slate-50 px-2 py-3">icon.svg</span>
          <span className="rounded-lg bg-slate-50 px-2 py-3">maskable</span>
          <span className="rounded-lg bg-slate-50 px-2 py-3">Apple</span>
        </div>
      </section>

      <section className="-mx-4 bg-white px-4 py-4">
        <p className="text-xs font-black uppercase tracking-[0.2em] text-berry">{s.storageEyebrow}</p>
        <h2 className="mt-2 text-xl font-black text-night">{s.storageTitle}</h2>
        <p className="mt-2 text-sm leading-6 text-slate-500">{s.storageDesc}</p>
      </section>

      <section className="-mx-4 bg-white px-4 py-4">
        <p className="text-xs font-black uppercase tracking-[0.2em] text-crystal">{s.qaEyebrow}</p>
        <h2 className="mt-2 text-xl font-black text-night">{s.qaTitle}</h2>
        <p className="mt-2 text-sm leading-6 text-slate-500">{s.qaDesc}</p>
        <div className="mt-4 grid grid-cols-2 gap-2">
          <a className="rounded-lg bg-gradient-to-r from-crystal to-berry px-4 py-3 text-center text-sm font-black text-white" href="/manual-qa-checklist.md">
            {s.manualQa}
          </a>
          <a className="rounded-lg bg-gradient-to-r from-aqua to-mint px-4 py-3 text-center text-sm font-black text-white" href="/visual-regression-checklist.md">
            {s.visualQa}
          </a>
          <a className="col-span-2 rounded-lg border border-slate-200 bg-slate-50 px-4 py-3 text-center text-sm font-black text-night" href="/safe-instagram-feel-checklist.md">
            {s.safeFeelChecklist}
          </a>
        </div>
        <div className="mt-2 grid grid-cols-2 gap-2">
          <Link className="block zigo-cta tap-scale rounded-lg px-4 py-3 text-center text-sm font-black text-white" href="/readiness">
            {s.finalAcceptance}
          </Link>
          <Link className="block rounded-lg border border-slate-200 bg-slate-50 px-4 py-3 text-center text-sm font-black text-night" href="/social-polish-roadmap.md">
            {s.polishRoadmap}
          </Link>
        </div>
      </section>
    </div>
  );
}
