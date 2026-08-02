import type { Metadata } from "next";
import Link from "next/link";

type ShareLearningPageProps = {
  searchParams: Promise<{ streak?: string; points?: string; done?: string; total?: string }>;
};

export async function generateMetadata({ searchParams }: ShareLearningPageProps): Promise<Metadata> {
  const params = await searchParams;
  const streak = Number(params.streak ?? 0) || 0;
  const points = Number(params.points ?? 0) || 0;
  const done = Number(params.done ?? 0) || 0;
  const total = Number(params.total ?? 5) || 5;
  const title = `Zigo · ${done}/${total} görev · ${streak} gün streak`;
  const description = `${points} puan ile bugünkü öğrenme kartı.`;

  return {
    title,
    description,
    openGraph: {
      title,
      description,
      type: "website",
    },
  };
}

export default async function ShareLearningPage({ searchParams }: ShareLearningPageProps) {
  const params = await searchParams;
  const streak = Number(params.streak ?? 0) || 0;
  const points = Number(params.points ?? 0) || 0;
  const done = Number(params.done ?? 0) || 0;
  const total = Number(params.total ?? 5) || 5;

  return (
    <main className="mx-auto flex min-h-[70vh] max-w-lg flex-col justify-center px-4 py-10">
      <article className="overflow-hidden rounded-3xl bg-gradient-to-br from-night via-violet-900 to-crystal p-6 text-white shadow-soft">
        <p className="text-[0.65rem] font-black uppercase tracking-[0.18em] text-white/70">Zigo öğrenme kartı</p>
        <h1 className="mt-2 text-3xl font-black leading-tight">Bugün {done}/{total}</h1>
        <p className="mt-2 text-sm font-semibold text-white/85">
          {streak} gün streak · {points} puan
        </p>
        <div className="mt-6 h-2 overflow-hidden rounded-full bg-white/15">
          <div
            className="h-full rounded-full bg-gradient-to-r from-sun to-berry"
            style={{ width: `${Math.min(100, (done / Math.max(1, total)) * 100)}%` }}
          />
        </div>
      </article>
      <div className="mt-6 flex flex-wrap gap-3">
        <Link className="tap-scale zigo-cta rounded-xl px-4 py-3 text-sm font-black text-white" href="/auth">
          Zigo’ya katıl
        </Link>
        <Link className="tap-scale rounded-xl bg-slate-100 px-4 py-3 text-sm font-black text-night" href="/">
          Akışa git
        </Link>
      </div>
    </main>
  );
}
