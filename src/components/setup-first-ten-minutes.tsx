import Link from "next/link";

import { buildSetupFirstTenPaths, type SetupFirstTenRole } from "@/lib/domain/setup-first-ten";
import type { Messages } from "@/lib/i18n/server";

type SetupFirstTenMinutesProps = {
  labels: Messages["ops"]["setupPage"]["firstTen"];
};

const roleTone: Record<SetupFirstTenRole, string> = {
  teacher: "from-crystal to-berry",
  parent: "from-aqua to-mint",
  student: "from-amber-400 to-orange-500",
};

export function SetupFirstTenMinutes({ labels }: SetupFirstTenMinutesProps) {
  const paths = buildSetupFirstTenPaths({
    teacherSteps: labels.teacherSteps,
    parentSteps: labels.parentSteps,
    studentSteps: labels.studentSteps,
  });

  const roleLabel: Record<SetupFirstTenRole, string> = {
    teacher: labels.teacherTitle,
    parent: labels.parentTitle,
    student: labels.studentTitle,
  };

  return (
    <section className="-mx-4 bg-white px-4 py-4">
      <p className="text-xs font-black uppercase tracking-[0.18em] text-crystal">{labels.eyebrow}</p>
      <h2 className="mt-1 text-xl font-black text-night">{labels.title}</h2>
      <p className="mt-2 text-sm leading-6 text-slate-500">{labels.desc}</p>
      <div className="mt-4 grid gap-3">
        {paths.map((path) => (
          <article className="rounded-2xl border border-slate-100 bg-slate-50 p-4" key={path.role}>
            <div className="flex items-start justify-between gap-3">
              <div>
                <h3 className="text-sm font-black text-night">{roleLabel[path.role]}</h3>
                <ol className="mt-2 space-y-1">
                  {path.steps.map((step, index) => (
                    <li className="text-sm leading-6 text-slate-600" key={step}>
                      <span className="font-black text-slate-400">{index + 1}.</span> {step}
                    </li>
                  ))}
                </ol>
              </div>
              <Link
                className={`shrink-0 rounded-lg bg-gradient-to-r ${roleTone[path.role]} px-3 py-2 text-xs font-black text-white`}
                href={path.href}
              >
                {labels.open}
              </Link>
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}
