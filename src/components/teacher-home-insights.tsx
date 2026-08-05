import Link from "next/link";

import type { Messages } from "@/lib/i18n/server";

type TeacherHomeInsightsProps = {
  copy: Messages["feedEnhancements"];
  inboxCount: number;
  postCount: number;
};

export function TeacherHomeInsights({ copy, inboxCount, postCount }: TeacherHomeInsightsProps) {
  return (
    <section className="-mx-4 border-b border-violet-100/60 bg-gradient-to-r from-violet-50/90 via-fuchsia-50/50 to-white px-4 py-3.5 shadow-[0_2px_10px_-3px_rgba(124,58,237,0.06)]">
      <div className="flex items-center justify-between gap-3">
        <div className="min-w-0">
          <div className="flex items-center gap-1.5">
            <span className="flex size-5 items-center justify-center rounded-md bg-crystal/10 text-xs text-crystal">
              🎓
            </span>
            <p className="text-zigo-micro font-black uppercase tracking-[0.15em] text-crystal">
              {copy.teacherPerformance}
            </p>
          </div>
          <div className="mt-1 flex items-center gap-2 text-xs font-bold text-slate-700">
            <span className="inline-flex items-center rounded-full bg-slate-100 px-2 py-0.5 text-slate-700">
              {postCount} gönderi
            </span>
            <span className="text-slate-300">•</span>
            <span className={`inline-flex items-center rounded-full px-2 py-0.5 ${inboxCount > 0 ? "bg-amber-100 text-amber-800" : "bg-slate-100 text-slate-600"}`}>
              {inboxCount} bekleyen soru
            </span>
          </div>
        </div>
        <Link
          className="tap-scale zigo-cta shrink-0 rounded-xl px-3.5 py-2 text-xs font-extrabold shadow-sm"
          href="/questions"
        >
          {inboxCount > 0 ? copy.teacherInbox.replace("{count}", String(inboxCount)) : copy.goInbox}
        </Link>
      </div>
    </section>
  );
}
