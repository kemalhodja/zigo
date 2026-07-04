import Link from "next/link";

import { SafeDuelCard } from "@/components/safe-duel-card";
import { StateCard } from "@/components/state-card";
import { hasSupabaseEnv, withSupabaseFallback } from "@/lib/config";
import { allowDemoContent } from "@/lib/domain/demo-env";
import { getMatchedQuizzes } from "@/lib/domain/learning";
import { getCurrentProfile } from "@/lib/domain/profiles";
import { buildDemoDuels } from "@/lib/i18n/demo-feed";
import { getServerMessages } from "@/lib/i18n/server";
import { createClient } from "@/lib/supabase/server";

const duelAccents = ["from-crystal to-berry", "from-aqua to-mint", "from-sun to-peach"] as const;

type DuelCard = {
  id: string;
  areaId: number;
  accent: string;
  reward: string;
  title: string;
  topic: string;
};

export default async function DuelsPage() {
  const m = await getServerMessages();
  const d = m.duelsPage;
  const data = await getDuelAccess();
  const duels = await getDuels(d);

  if (data.mode === "signed-out") {
    return (
      <StateCard
        action={
          <Link className="font-black text-crystal" href={hasSupabaseEnv() ? "/auth?next=/duels" : "/setup"}>
            {hasSupabaseEnv() ? m.common.signIn : m.preview.setup}
          </Link>
        }
        description={d.signInDesc}
        title={d.signInTitle}
      />
    );
  }

  if (data.mode === "teacher") {
    return (
      <StateCard
        action={<Link className="font-black text-crystal" href="/teacher">{m.dashboard.teacher.studio}</Link>}
        description={d.teacherDesc}
        title={d.teacherTitle}
      />
    );
  }

  if (data.mode === "parent") {
    return (
      <StateCard
        action={<Link className="font-black text-crystal" href="/parent">{m.dashboard.parent.title}</Link>}
        description={d.parentDesc}
        title={d.parentTitle}
      />
    );
  }

  return (
    <div className="space-y-5 pb-3">
      <section className="-mx-4 border-b border-pink-100 bg-white px-4 pb-4">
        <p className="text-xs font-black uppercase tracking-[0.2em] text-slate-500">{d.label}</p>
        <h1 className="mt-1 text-2xl font-black leading-tight text-night">{d.title}</h1>
        <p className="mt-2 text-sm leading-6 text-slate-500">{d.desc}</p>
        <div className="mt-4 grid grid-cols-3 gap-2 text-center">
          <DuelStat label={d.noDm} value={d.safeStat} />
          <DuelStat label={d.rewardLabel} value="+25" />
          <DuelStat label="Mode" value={d.modeSolo} />
        </div>
      </section>

      <section className="-mx-4 bg-gradient-to-r from-violet-50 via-pink-50 to-cyan-50 px-4 py-4">
        <p className="text-xs font-black uppercase tracking-[0.18em] text-crystal">{d.safetyLabel}</p>
        <div className="mt-3 grid gap-2">
          {d.safetyRules.map((rule) => (
            <div className="rounded-lg bg-white px-4 py-3 text-sm font-black text-night" key={rule}>
              {rule}
            </div>
          ))}
        </div>
      </section>

      <section className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-black text-night">{d.chooseDuel}</h2>
          <Link className="text-xs font-black text-crystal" href="/learn">
            {d.trainFirst}
          </Link>
        </div>

        {duels.length === 0 ? (
          <StateCard
            action={
              <Link className="font-black text-crystal" href="/onboarding">
                {m.onboarding.chooseInterests}
              </Link>
            }
            description={d.signInDesc}
            title={d.chooseDuel}
          />
        ) : (
          duels.map((duel) => (
            <SafeDuelCard
              accent={duel.accent}
              areaId={duel.areaId}
              duelId={duel.id}
              key={duel.id}
              reward={duel.reward}
              title={duel.title}
              topic={duel.topic}
            />
          ))
        )}
      </section>
    </div>
  );
}

async function getDuels(d: Awaited<ReturnType<typeof getServerMessages>>["duelsPage"]): Promise<DuelCard[]> {
  if (!hasSupabaseEnv()) {
    return allowDemoContent() ? [...buildDemoDuels(d)] : [];
  }

  return withSupabaseFallback(
    async () => {
      const supabase = await createClient();
      const quizzes = await getMatchedQuizzes(supabase);
      return (quizzes ?? []).map((quiz, index) => ({
        id: quiz.id,
        areaId: quiz.area_id ?? 0,
        accent: duelAccents[index % duelAccents.length],
        reward: `+${quiz.points_reward ?? 25}`,
        title: quiz.title,
        topic: d.topicMath,
      }));
    },
    allowDemoContent() ? [...buildDemoDuels(d)] : [],
    [],
  );
}

async function getDuelAccess(): Promise<{ mode: "parent" | "signed-out" | "student" | "teacher" }> {
  if (!hasSupabaseEnv()) return { mode: "signed-out" as const };

  return withSupabaseFallback(
    async () => {
      const supabase = await createClient();
      const profile = await getCurrentProfile(supabase);
      if (!profile) return { mode: "signed-out" as const };
      if (profile.role === "teacher") return { mode: "teacher" as const };
      return { mode: profile.role };
    },
    { mode: "signed-out" as const },
  );
}

function DuelStat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg bg-gradient-to-br from-violet-50 to-pink-50 p-3">
      <p className="text-lg font-black text-crystal">{value}</p>
      <p className="mt-0.5 text-[0.62rem] font-black uppercase tracking-[0.12em] text-slate-500">{label}</p>
    </div>
  );
}
