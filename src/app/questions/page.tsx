import Link from "next/link";

import { AnswerForm } from "@/components/answer-form";
import { QuestionForm } from "@/components/question-form";
import { SocialAvatar, SocialPill } from "@/components/social-primitives";
import { StateCard } from "@/components/state-card";
import { hasSupabaseEnv, withSupabaseFallback } from "@/lib/config";
import { getCurrentProfile, getEducationAreas, getUserInterestAreaIds } from "@/lib/domain/profiles";
import { getMatchedQuestions } from "@/lib/domain/questions";
import { getServerMessages } from "@/lib/i18n/server";
import { createClient } from "@/lib/supabase/server";

const demoQuestions = [
  {
    title: "How can my child practice fractions daily?",
    description: "A parent asks for a five-minute home routine matched to Mathematics.",
    area: "Mathematics",
    status: "Open",
  },
  {
    title: "Why does my quiz answer not get points twice?",
    description: "A student sees how verified learning actions prevent point farming.",
    area: "Gamification",
    status: "Answered",
  },
];

export default async function QuestionsPage() {
  const m = await getServerMessages();

  if (!hasSupabaseEnv()) {
    return <QuestionsPreview mode="preview" />;
  }

  const previewFallback = await QuestionsPreview({ mode: "preview" });

  return withSupabaseFallback(async () => {
  const supabase = await createClient();
  const profile = await getCurrentProfile(supabase);

  if (!profile) {
    return <QuestionsPreview mode="signed-out" />;
  }

  const [questions, allAreas, selectedAreaIds] = await Promise.all([
    getMatchedQuestions(supabase, profile.id),
    getEducationAreas(supabase),
    getUserInterestAreaIds(supabase, profile.id),
  ]);
  const matchedAreas = allAreas.filter((area) => selectedAreaIds.includes(area.id));

  return (
    <div className="space-y-4">
      <section className="-mx-4 border-b border-slate-100 bg-white px-4 pb-3">
        <h1 className="text-2xl font-black text-night">{m.questions.title}</h1>
        <p className="mt-1 text-sm font-semibold text-slate-500">{m.questions.subtitle}</p>
      </section>

      {profile.role === "teacher" ? (
        <AnswerForm questions={(questions as any[]).filter((question: any) => !question.is_resolved)} />
      ) : (
        <QuestionForm areas={matchedAreas} />
      )}

      <section className="space-y-3">
        {questions.length === 0 ? (
          <StateCard
            title={m.questions.noMatched}
            description={m.questions.noMatchedDesc}
            action={<Link className="font-black text-crystal" href="/onboarding">{m.common.updateAreas}</Link>}
          />
        ) : (
          questions.map((question: any) => (
            <article className="-mx-4 border-b border-slate-100 bg-white px-4 py-4 space-y-3" key={question.id}>
              <div className="flex gap-3">
                <SocialAvatar className="size-10 shrink-0" label={question.title} ring={false} />
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <p className="truncate text-sm font-black text-night">{m.questions.matchedArea}</p>
                    <SocialPill tone={question.is_resolved ? "primary" : "light"}>
                      {question.is_resolved ? "✓ Çözüldü" : "⏳ Çözüm Bekliyor"}
                    </SocialPill>
                  </div>
                  <h3 className="mt-1 text-sm font-black text-night">{question.title}</h3>
                  <p className="mt-1 text-sm leading-5 text-slate-600">{question.description}</p>
                </div>
              </div>

              {/* Snap & Solve Question Photo */}
              {question.image_url && (
                <div className="pl-13">
                  <div className="overflow-hidden rounded-xl border border-slate-200 bg-slate-50 max-w-sm">
                    <img
                      src={question.image_url}
                      alt={question.title}
                      className="max-h-72 w-full object-contain cursor-pointer transition hover:scale-102"
                      onClick={() => window.open(question.image_url, "_blank")}
                    />
                  </div>
                </div>
              )}

              {/* Solutions / Answers List */}
              {question.answers && question.answers.length > 0 && (
                <div className="pl-13 space-y-2 pt-2 border-t border-slate-50">
                  <p className="text-xs font-black uppercase tracking-wider text-emerald-600 flex items-center gap-1">
                    <span>🎓</span> Öğretmen Çözümleri ({question.answers.length})
                  </p>
                  {question.answers.map((answer: any) => (
                    <div key={answer.id} className="rounded-xl border border-emerald-100 bg-emerald-50/40 p-3 space-y-2">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <div className="h-6 w-6 rounded-full bg-emerald-100 text-emerald-800 flex items-center justify-center text-[0.6rem] font-black">
                            {(answer.teacher?.full_name || "Ö").slice(0, 2).toUpperCase()}
                          </div>
                          <span className="text-xs font-black text-slate-900">
                            {answer.teacher?.full_name || "Öğretmen"}
                          </span>
                          {answer.teacher?.is_verified && (
                            <span className="rounded bg-emerald-200 px-1 py-0.2 text-[0.6rem] font-black text-emerald-800">
                              Onaylı Öğretmen
                            </span>
                          )}
                        </div>
                        <span className="text-[0.65rem] font-bold text-slate-400">
                          {new Date(answer.created_at).toLocaleDateString("tr-TR")}
                        </span>
                      </div>

                      {/* Text Solution */}
                      {answer.content && (
                        <p className="text-xs font-medium text-slate-700 leading-5">
                          {answer.content}
                        </p>
                      )}

                      {/* Video Solution */}
                      {answer.video_url && (
                        <div className="mt-2 overflow-hidden rounded-xl bg-black max-w-sm">
                          <video
                            src={answer.video_url}
                            controls
                            className="w-full max-h-64 object-contain"
                          />
                        </div>
                      )}

                      {/* Audio Solution */}
                      {answer.audio_url && (
                        <div className="mt-2 rounded-lg bg-white p-2 border border-emerald-200 max-w-sm">
                          <audio src={answer.audio_url} controls className="w-full h-8" />
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </article>
          ))
        )}
      </section>
    </div>
  );
  }, previewFallback);
}

async function QuestionsPreview({ mode }: { mode: "preview" | "signed-out" }) {
  const m = await getServerMessages();

  return (
    <div className="space-y-4">
      <section className="-mx-4 border-b border-slate-100 bg-white px-4 pb-3">
        <h1 className="text-2xl font-black text-night">{m.questions.title}</h1>
        <p className="mt-1 text-sm font-semibold text-slate-500">{m.questions.subtitle}</p>
      </section>

      {mode === "signed-out" ? (
        <StateCard
          title={m.questions.signInAsk}
          description={m.questions.noMatchedDesc}
          action={<Link className="font-black text-crystal" href="/auth?next=/questions">{m.common.signIn}</Link>}
        />
      ) : null}

      <section className="-mx-4 bg-white px-4 py-4">
        <p className="text-xs font-black uppercase tracking-[0.2em] text-crystal">
          {m.nav.ask}
        </p>
        <div className="mt-4 space-y-3">
          <div className="rounded-lg bg-slate-50 px-4 py-3 text-sm font-bold text-slate-500">
            {m.questions.previewArea}
          </div>
          <div className="rounded-lg bg-slate-50 px-4 py-3 text-sm font-bold text-slate-500">
            {m.questions.previewPlaceholder}
          </div>
          <button className="tap-scale w-full zigo-cta tap-scale rounded-lg px-4 py-3 text-sm font-black text-white" type="button">
            {m.questions.previewAsk}
          </button>
        </div>
      </section>

      <section className="space-y-3">
        {demoQuestions.map((question) => (
          <article className="-mx-4 flex gap-3 border-b border-slate-100 bg-white px-4 py-4" key={question.title}>
            <SocialAvatar className="size-10" label={question.title} ring={false} />
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2">
                <p className="truncate text-sm font-black text-night">{question.area}</p>
                <SocialPill tone={question.status === "Answered" ? "primary" : "light"}>{question.status}</SocialPill>
              </div>
              <h3 className="mt-1 text-sm font-black text-night">{question.title}</h3>
              <p className="mt-1 text-sm leading-5 text-slate-600">{question.description}</p>
            </div>
          </article>
        ))}
      </section>
    </div>
  );
}
