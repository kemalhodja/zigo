import Link from "next/link";

import type { Messages } from "@/lib/i18n/server";

type TeacherHomeInsightsProps = {
  copy: Messages["feedEnhancements"];
  inboxCount: number;
  postCount: number;
};

export function TeacherHomeInsights({ copy, inboxCount, postCount }: TeacherHomeInsightsProps) {
  return (
    <section className="-mx-4 border-b border-violet-100 bg-white px-4 py-3">
      <div className="flex items-center justify-between gap-3">
        <div className="min-w-0">
          <p className="text-xs font-black uppercase tracking-[0.16em] text-crystal">{copy.teacherPerformance}</p>
          <p className="mt-1 text-sm font-bold text-slate-600">
            {copy.teacherStats.replace("{posts}", String(postCount)).replace("{inbox}", String(inboxCount))}
          </p>
        </div>
        <Link
          className="tap-scale shrink-0 rounded-xl bg-gradient-to-r from-crystal to-berry px-3 py-2 text-xs font-black text-white"
          href="/questions"
        >
          {inboxCount > 0 ? copy.teacherInbox.replace("{count}", String(inboxCount)) : copy.goInbox}
        </Link>
      </div>
    </section>
  );
}
