import Link from "next/link";

import { getServerMessages } from "@/lib/i18n/server";

export async function SupabaseSetupCard({ envConnected = false }: { envConnected?: boolean }) {
  const { ops: { setupCard: s } } = await getServerMessages();

  return (
    <div className="space-y-5">
      <section className="-mx-4 border-b border-slate-100 bg-white px-4 pb-4">
        <p className="text-xs font-black uppercase tracking-[0.2em] text-slate-500">{s.eyebrow}</p>
        <h2 className="mt-1 text-2xl font-black leading-tight text-night">{s.title}</h2>
        <p className="mt-2 text-sm leading-6 text-slate-500">{s.desc}</p>
        <div className={`mt-4 rounded-lg p-4 ${envConnected ? "bg-mint/20" : "bg-gradient-to-r from-violet-50 via-pink-50 to-cyan-50"}`}>
          <p className="text-sm font-black text-night">{envConnected ? s.envDetected : s.whatThisMeans}</p>
          <p className="mt-1 text-sm leading-6 text-slate-600">
            {envConnected ? s.envDetectedDesc : s.envMissingDesc}
          </p>
        </div>
      </section>

      <section className="-mx-4 bg-white px-4 py-4">
        <p className="text-xs font-black uppercase tracking-[0.2em] text-slate-500">{s.requiredNow}</p>
        <div className="mt-4 grid gap-3">
          <SetupStep text={s.step1Text} title={s.step1Title} />
          <SetupStep text={s.step2Text} title={s.step2Title} />
          <SetupStep text={s.step3Text} title={s.step3Title} />
          <SetupStep text={s.step4Text} title={s.step4Title} />
        </div>
      </section>

      <div className="grid grid-cols-2 gap-3">
        <Link className="tap-scale rounded-lg bg-gradient-to-r from-aqua to-mint px-4 py-3 text-center text-sm font-black text-white" href="/readiness">
          {s.checkReadiness}
        </Link>
        <Link className="tap-scale rounded-lg bg-gradient-to-r from-crystal to-berry px-4 py-3 text-center text-sm font-black text-white" href="/setup">
          {s.setupGuide}
        </Link>
        <a
          className="col-span-2 rounded-lg border border-slate-200 bg-slate-50 px-4 py-3 text-center text-sm font-black text-night"
          href="/supabase-quickstart.md"
        >
          {s.quickstart}
        </a>
      </div>
    </div>
  );
}

function SetupStep({ text, title }: { text: string; title: string }) {
  return (
    <article className="rounded-lg bg-slate-50 p-4">
      <h3 className="text-sm font-black text-night">{title}</h3>
      <p className="mt-1 text-sm leading-6 text-slate-500">{text}</p>
    </article>
  );
}
