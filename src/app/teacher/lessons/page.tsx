import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";

import { LessonRequestsPanel } from "@/components/lesson-requests-panel";
import { getChildProfiles } from "@/lib/domain/children";
import { getCurrentProfile } from "@/lib/domain/profiles";
import { ROLE_BACK } from "@/lib/domain/role-navigation";
import { getUserSubscription } from "@/lib/domain/subscription";
import { canTeacherUseCreatorPlusTools } from "@/lib/domain/teacher-creator-plus";
import type { UserRole } from "@/lib/supabase/database.types";
import { createClient } from "@/lib/supabase/server";

export const metadata: Metadata = {
  title: "Özel Ders Talepleri · Zigo",
  description: "Öğretmen ve veliler için özel ders talepleri ve mesajlaşma merkezi.",
};

export default async function TeacherLessonsPage() {
  const supabase = await createClient();
  const profile = await getCurrentProfile(supabase);

  if (!profile) {
    redirect("/auth?redirect=/teacher/lessons");
  }

  const sub = await getUserSubscription(supabase, profile.id);
  const isTeacher = profile.role === "teacher";
  const isParent = profile.role === "parent";
  const isSubscriber = sub.isPremium || canTeacherUseCreatorPlusTools(sub, profile.role);

  const children = isParent ? await getChildProfiles(supabase) : [];
  const childrenOptions = children.map((c) => ({ id: c.id, name: c.display_name }));
  const back = ROLE_BACK[profile.role as UserRole] ?? ROLE_BACK.teacher;

  return (
    <div className="space-y-4">
      {/* Top Header */}
      <div className="flex items-center justify-between rounded-2xl bg-white border border-slate-200/80 p-4 shadow-xs">
        <div className="flex items-center gap-3">
          <Link
            href={back.href}
            className="tap-scale flex items-center gap-1 rounded-xl bg-slate-100 px-3 py-2 text-xs font-black text-slate-700 hover:bg-slate-200 transition"
          >
            <span>←</span>
            <span>{back.label}</span>
          </Link>
          <div>
            <h1 className="text-lg font-black text-night">Özel Ders Talepleri & Mesajlaşma</h1>
            <p className="text-xs font-semibold text-slate-500">
              {isTeacher
                ? "Velilerden ve öğrencilerden gelen özel ders taleplerini yönet ve iletişime geç."
                : "Öğretmenlere özel ders talebi gönder ve yanıtları takip et."}
            </p>
          </div>
        </div>
      </div>

      <LessonRequestsPanel
        role={isTeacher ? "teacher" : "parent"}
        viewerId={profile.id}
        isSubscriber={isSubscriber}
        childrenOptions={childrenOptions}
      />
    </div>
  );
}
