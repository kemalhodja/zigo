import Link from "next/link";

import { AvatarStore } from "@/components/avatar-store";
import { GamifiedChildAvatar } from "@/features/booking/components/gamified-child-avatar";
import { StateCard } from "@/components/state-card";
import { hasSupabaseEnv, withSupabaseFallback } from "@/lib/config";
import { getLearningProgressStats } from "@/lib/domain/learning";
import { getCurrentProfile } from "@/lib/domain/profiles";
import { buildStudentGamification, getCompactLeague } from "@/lib/domain/student-gamification";
import { getServerMessages } from "@/lib/i18n/server";
import type { Messages } from "@/lib/i18n/types";
import { createClient } from "@/lib/supabase/server";

export default async function AvatarPage() {
  const m = await getServerMessages();

  if (!hasSupabaseEnv()) {
    return <AvatarPreview messages={m} mode="preview" />;
  }

  const previewFallback = await AvatarPreview({ mode: "preview", messages: m });

  return withSupabaseFallback(async () => {
  const supabase = await createClient();
  const profile = await getCurrentProfile(supabase);
  const a = m.avatarPage;

  if (!profile) {
    return <AvatarPreview mode="signed-out" messages={m} />;
  }

  if (profile.role !== "student") {
    return <AvatarPreview mode="role-preview" messages={m} />;
  }

  const stats = await getLearningProgressStats(supabase, profile.id);
  const gamification = buildStudentGamification(profile.total_points);
  const compactLeague = getCompactLeague(profile.total_points);

  return (
    <div className="space-y-5">
      <section className="-mx-4 bg-white px-4 pb-4">
        <div>
          <p className="text-xs font-black uppercase tracking-[0.2em] text-slate-500">
            @{profile.full_name.toLowerCase().replaceAll(" ", "")}
          </p>
          <div className="mt-5 flex items-end justify-between">
            <div className="flex items-center gap-4">
              <GamifiedChildAvatar
                avatarAssets={profile.avatar_assets}
                badgeLabel={a.liveLessonStarBadge}
                label={profile.full_name}
                size="lg"
              />
              <div>
              <h2 className="text-2xl font-black text-night">{profile.full_name}</h2>
              <p className="mt-1 text-sm font-semibold text-slate-500">
                {a.levelGems
                  .replace("{level}", String(gamification.level))
                  .replace("{league}", compactLeague.label)
                  .replace("{gems}", String(gamification.gems))}
              </p>
              </div>
            </div>
            <div className="rounded-lg bg-slate-100 px-4 py-2 text-sm font-black text-night">
              Lv {gamification.level}
            </div>
          </div>
        </div>
        <div className="mt-4 grid grid-cols-3 border-y border-slate-100 text-center text-xs font-black text-slate-600">
          <div className="p-3">
            <p className="text-lg text-night">{profile.total_points}</p>
            <p>{a.pointsLabel}</p>
          </div>
          <div className="border-x border-slate-100 p-3">
            <p className="text-lg text-night">{stats.duelWins}</p>
            <p>{a.duelsLabel}</p>
          </div>
          <div className="p-3">
            <p className="text-lg text-night">{stats.quizCompletions}</p>
            <p>{a.quizzesLabel}</p>
          </div>
        </div>
      </section>

      <section className="-mx-4 bg-white px-4 py-4">
        <p className="text-xs font-black uppercase tracking-[0.2em] text-crystal">{a.pointBalance}</p>
        <div className="mt-4 flex items-end justify-between">
          <div>
            <p className="text-sm font-bold text-slate-500">{a.zigoPoints}</p>
            <h2 className="text-4xl font-black text-night">{profile.total_points}</h2>
          </div>
          <div className="rounded-lg bg-violet-100 px-4 py-2 text-sm font-black text-crystal">
            {gamification.leagueLabel}
          </div>
        </div>
      </section>

      <AvatarStore equippedAssets={profile.avatar_assets} totalPoints={profile.total_points} />
    </div>
  );
  }, previewFallback);
}

async function AvatarPreview({
  mode,
  messages: m,
}: {
  mode: "preview" | "signed-out" | "role-preview";
  messages: Messages;
}) {
  const a = m.avatarPage;
  const note = {
    preview: a.previewNote,
    "signed-out": a.signInStudent,
    "role-preview": a.rolePreviewNote,
  }[mode];

  const previewItems = [
    { label: a.crystalCap, price: 80 },
    { label: a.mathHeroSuit, price: 120 },
    { label: a.studyOwl, price: 160 },
  ];

  return (
    <div className="space-y-5">
      <section className="-mx-4 bg-white px-4 pb-4">
        <div>
          <p className="text-xs font-black uppercase tracking-[0.2em] text-slate-500">{a.studentProfile}</p>
          <div className="mt-5 flex items-end justify-between gap-4">
            <div>
              <div className="story-ring flex size-28 items-center justify-center rounded-full bg-gradient-to-br from-crystal via-fuchsia-500 to-rose-400 text-5xl font-black text-white">
                Z
              </div>
              <h2 className="mt-4 text-2xl font-black text-night">{a.crystalLearner}</h2>
              <p className="mt-1 text-sm font-semibold text-slate-500">Level 7 · Gold League</p>
            </div>
            <span className="rounded-lg bg-slate-100 px-3 py-2 text-xs font-black text-night">340 Zigo</span>
          </div>
        </div>
        <div className="mt-4 grid grid-cols-3 border-y border-slate-100 text-center text-xs font-black text-slate-600">
          <div className="p-3">
            <p className="text-lg text-night">7</p>
            <p>{a.streakLabel}</p>
          </div>
          <div className="border-x border-slate-100 p-3">
            <p className="text-lg text-night">12</p>
            <p>{a.badgesLabel}</p>
          </div>
          <div className="p-3">
            <p className="text-lg text-night">3</p>
            <p>{a.itemsLabel}</p>
          </div>
        </div>
      </section>

      <StateCard
        title={a.profilePreview}
        description={note}
        action={
          mode === "signed-out" ? (
            <Link className="font-black text-crystal" href="/auth?next=/avatar">
              {m.common.signIn}
            </Link>
          ) : undefined
        }
      />

      <section className="-mx-4 space-y-3 bg-white px-4 py-4">
        <h3 className="text-lg font-black text-night">{a.rewardStorePreview}</h3>
        {previewItems.map((item) => (
          <div className="flex items-center justify-between rounded-lg bg-slate-50 px-4 py-3" key={item.label}>
            <div>
              <p className="font-black text-night">{item.label}</p>
              <p className="text-xs font-bold text-slate-500">{item.price} crystals</p>
            </div>
            <span className="rounded-lg bg-slate-100 px-3 py-1 text-xs font-black text-night">{a.equip}</span>
          </div>
        ))}
      </section>
    </div>
  );
}
