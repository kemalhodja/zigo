"use client";

import { getPushTopicsForRole, isPushConfigured } from "@/lib/domain/push-notifications";
import { useMessages } from "@/lib/i18n/locale-context";
import type { UserRole } from "@/lib/supabase/database.types";

type PushNotificationPanelProps = {
  role: UserRole;
};

export function PushNotificationPanel({ role }: PushNotificationPanelProps) {
  const { notifications: n } = useMessages();
  const configured = isPushConfigured();
  const topics = getPushTopicsForRole(role === "teacher" ? "teacher" : role === "parent" ? "parent" : "student");
  const topicLabels: Record<string, string> = {
    learning_reminder: n.topicLearningReminder,
    parent_approval: n.topicParentApproval,
    focus_streak: n.topicFocusStreak,
  };

  return (
    <section className="-mx-4 border-b border-pink-100 bg-gradient-to-r from-slate-50 to-white px-4 py-4">
      <p className="zigo-eyebrow text-slate-500">{n.pushAlerts}</p>
      <p className="zigo-body mt-1 font-bold text-slate-600">
        {configured ? n.pushConfigured : n.pushNotConfigured}
      </p>
      <div className="mt-3 flex flex-wrap gap-2">
        {topics.map((topic) => (
          <span className="zigo-compact-pill rounded-lg bg-white text-night shadow-sm ring-1 ring-slate-100" key={topic}>
            {topicLabels[topic] ?? topic}
          </span>
        ))}
      </div>
    </section>
  );
}
